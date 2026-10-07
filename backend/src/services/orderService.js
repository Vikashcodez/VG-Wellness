import pool from "../config/db.js";
import { logAudit } from "../middleware/auditLogger.js";

export const orderService = {
  async getCart(clientId) {
    let cartRes = await pool.query("SELECT * FROM carts WHERE client_id = $1", [clientId]);
    let cartId;
    if (cartRes.rowCount === 0) {
      const newCart = await pool.query("INSERT INTO carts (client_id) VALUES ($1) RETURNING id", [clientId]);
      cartId = newCart.rows[0].id;
    } else {
      cartId = cartRes.rows[0].id;
    }

    const items = (await pool.query(
      `SELECT ci.*, p.name as product_name, p.sku, p.price, p.image_url, p.tax_rate,
              COALESCE(SUM(s.quantity), 0) as stock_quantity
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       LEFT JOIN inventory_stock s ON s.product_id = p.id
       WHERE ci.cart_id = $1
       GROUP BY ci.id, p.name, p.sku, p.price, p.image_url, p.tax_rate`,
      [cartId]
    )).rows;

    let subtotal = 0;
    let taxTotal = 0;
    items.forEach(item => {
      const itemSub = parseFloat(item.unit_price) * item.quantity;
      subtotal += itemSub;
      taxTotal += itemSub * (parseFloat(item.tax_rate || 0) / 100);
    });

    const total = subtotal + taxTotal;

    return {
      cartId,
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(taxTotal * 100) / 100,
      total: Math.round(total * 100) / 100
    };
  },

  async addToCart(clientId, productId, quantity = 1) {
    const cart = await this.getCart(clientId);

    // Get current product price
    const pRes = await pool.query("SELECT price FROM products WHERE id = $1", [productId]);
    if (pRes.rowCount === 0) throw new Error("Product not found");
    const unitPrice = pRes.rows[0].price;

    await pool.query(
      `INSERT INTO cart_items (cart_id, product_id, quantity, unit_price)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (cart_id, product_id)
       DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity, unit_price = EXCLUDED.unit_price`,
      [cart.cartId, productId, quantity, unitPrice]
    );

    return await this.getCart(clientId);
  },

  async updateCartItem(clientId, productId, quantity) {
    const cart = await this.getCart(clientId);
    if (quantity <= 0) {
      await pool.query("DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2", [cart.cartId, productId]);
    } else {
      await pool.query("UPDATE cart_items SET quantity = $1 WHERE cart_id = $2 AND product_id = $3", [quantity, cart.cartId, productId]);
    }
    return await this.getCart(clientId);
  },

  async checkoutOrder(clientId, { shippingAddress, paymentMethod = "UPI", branchId = 1, notes = "" }) {
    const cart = await this.getCart(clientId);
    if (cart.items.length === 0) {
      throw new Error("Cannot checkout with an empty cart");
    }

    const conn = await pool.connect();
    try {
      await conn.query("BEGIN");

      // Verify stock availability
      for (const item of cart.items) {
        const stockRes = await conn.query(
          "SELECT COALESCE(SUM(quantity), 0) as total_qty FROM inventory_stock WHERE product_id = $1 AND branch_id = $2",
          [item.product_id, branchId]
        );
        const avail = parseInt(stockRes.rows[0].total_qty);
        if (avail < item.quantity) {
          throw new Error(`Insufficient stock for "${item.product_name}". Available: ${avail}, Requested: ${item.quantity}`);
        }
      }

      // Generate Order Number: ORD-YYYY-XXXX
      const countRes = await conn.query("SELECT COUNT(*) FROM orders");
      const orderNumber = `ORD-${new Date().getFullYear()}-${String(parseInt(countRes.rows[0].count) + 1).padStart(4, "0")}`;

      // Insert Order
      const orderRes = await conn.query(
        `INSERT INTO orders (
          order_number, client_id, branch_id, subtotal, tax_amount, discount_amount,
          total_amount, status, payment_status, shipping_address, notes
        ) VALUES ($1, $2, $3, $4, $5, 0.00, $6, 'PAID', 'PAID', $7, $8)
        RETURNING *`,
        [orderNumber, clientId, branchId, cart.subtotal, cart.tax, cart.total, shippingAddress, notes]
      );
      const newOrder = orderRes.rows[0];

      // Insert Order Items and Deduct Inventory
      for (const item of cart.items) {
        const itemTotal = parseFloat(item.unit_price) * item.quantity;
        await conn.query(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
           VALUES ($1, $2, $3, $4, $5)`,
          [newOrder.id, item.product_id, item.quantity, item.unit_price, itemTotal]
        );

        // Deduct from stock
        let qtyToDeduct = item.quantity;
        const stockBatches = (await conn.query(
          "SELECT id, quantity FROM inventory_stock WHERE product_id = $1 AND branch_id = $2 AND quantity > 0 ORDER BY expiry_date ASC NULLS LAST, id ASC",
          [item.product_id, branchId]
        )).rows;

        for (const batch of stockBatches) {
          if (qtyToDeduct <= 0) break;
          const deductFromThis = Math.min(batch.quantity, qtyToDeduct);
          await conn.query("UPDATE inventory_stock SET quantity = quantity - $1 WHERE id = $2", [deductFromThis, batch.id]);
          qtyToDeduct -= deductFromThis;
        }

        // Record inventory transaction
        await conn.query(
          `INSERT INTO inventory_transactions (branch_id, product_id, transaction_type, quantity, reference_id, reference_type, notes)
           VALUES ($1, $2, 'SALE', $3, $4, 'ORDER', $5)`,
          [branchId, item.product_id, -item.quantity, newOrder.id, `E-Commerce Order ${orderNumber}`]
        );

        // Mark any product recommendation as PURCHASED
        await conn.query(
          "UPDATE product_recommendations SET status = 'PURCHASED' WHERE client_id = $1 AND product_id = $2 AND status = 'ACTIVE'",
          [clientId, item.product_id]
        );
      }

      // Automatically generate Invoice for this Order
      const invCount = await conn.query("SELECT COUNT(*) FROM invoices");
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(parseInt(invCount.rows[0].count) + 1).padStart(4, "0")}`;

      const invRes = await conn.query(
        `INSERT INTO invoices (
          invoice_number, client_id, branch_id, order_id, invoice_date, due_date,
          subtotal, discount, tax, total_amount, paid_amount, balance_amount, status, notes
        ) VALUES ($1, $2, $3, $4, CURRENT_DATE, CURRENT_DATE, $5, 0.00, $6, $7, $7, 0.00, 'PAID', $8)
        RETURNING *`,
        [invoiceNumber, clientId, branchId, newOrder.id, cart.subtotal, cart.tax, cart.total, `Auto-generated for Order ${orderNumber}`]
      );
      const newInvoice = invRes.rows[0];

      // Insert invoice items
      for (const item of cart.items) {
        const itemTotal = parseFloat(item.unit_price) * item.quantity;
        const itemTax = itemTotal * (parseFloat(item.tax_rate || 0) / 100);
        await conn.query(
          `INSERT INTO invoice_items (invoice_id, item_type, reference_id, description, quantity, unit_price, tax_rate, tax_amount, total_amount)
           VALUES ($1, 'PRODUCT', $2, $3, $4, $5, $6, $7, $8)`,
          [newInvoice.id, item.product_id, item.product_name, item.quantity, item.unit_price, item.tax_rate, itemTax, itemTotal + itemTax]
        );
      }

      // Record Payment
      const payCount = await conn.query("SELECT COUNT(*) FROM payments");
      const paymentNumber = `PAY-${new Date().getFullYear()}-${String(parseInt(payCount.rows[0].count) + 1).padStart(4, "0")}`;

      const payRes = await conn.query(
        `INSERT INTO payments (payment_number, client_id, branch_id, invoice_id, amount, payment_method, notes)
         VALUES ($1, $2, $3, $4, $5, $6, 'Online store purchase payment')
         RETURNING id`,
        [paymentNumber, clientId, branchId, newInvoice.id, cart.total, paymentMethod]
      );

      await conn.query(
        `INSERT INTO payment_allocations (payment_id, invoice_id, allocated_amount)
         VALUES ($1, $2, $3)`,
        [payRes.rows[0].id, newInvoice.id, cart.total]
      );

      // Status history for order
      await conn.query(
        `INSERT INTO order_status_history (order_id, status, notes)
         VALUES ($1, 'PAID', 'Order placed and paid successfully')`,
        [newOrder.id]
      );

      // Notification
      const clientUser = (await conn.query("SELECT user_id FROM clients WHERE id = $1", [clientId])).rows[0]?.user_id;
      if (clientUser) {
        await conn.query(
          `INSERT INTO notifications (user_id, client_id, title, message, type, link)
           VALUES ($1, $2, 'Order Confirmed! 🛒', $3, 'SUCCESS', $4)`,
          [clientUser, clientId, `Your order ${orderNumber} for ₹${cart.total} has been confirmed.`, `/orders/${newOrder.id}`]
        );
      }

      // Clear cart
      await conn.query("DELETE FROM cart_items WHERE cart_id = $1", [cart.cartId]);

      await conn.query("COMMIT");

      logAudit({
        action: "PRODUCT_SOLD",
        module: "ORDERS",
        entityType: "orders",
        entityId: newOrder.id,
        newData: { orderNumber, total: cart.total, itemsCount: cart.items.length }
      });

      return {
        order: newOrder,
        invoice: newInvoice
      };
    } catch (err) {
      await conn.query("ROLLBACK");
      throw err;
    } finally {
      conn.release();
    }
  },

  async getOrders({ clientId, branchId, status }) {
    let query = `
      SELECT o.*,
             c.first_name as client_first_name, c.last_name as client_last_name, c.mobile as client_mobile,
             (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as item_count
      FROM orders o
      JOIN clients c ON o.client_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (clientId) {
      params.push(clientId);
      query += ` AND o.client_id = $${params.length}`;
    }
    if (branchId) {
      params.push(branchId);
      query += ` AND o.branch_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND o.status = $${params.length}`;
    }

    query += ` ORDER BY o.created_at DESC`;
    const res = await pool.query(query, params);
    return res.rows;
  },

  async getOrderById(orderId) {
    const oRes = await pool.query(
      `SELECT o.*, c.first_name, c.last_name, c.mobile, c.email, c.client_code
       FROM orders o
       JOIN clients c ON o.client_id = c.id
       WHERE o.id = $1`,
      [orderId]
    );

    if (oRes.rowCount === 0) throw new Error("Order not found");
    const order = oRes.rows[0];

    const items = (await pool.query(
      `SELECT oi.*, p.name as product_name, p.sku, p.image_url
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [orderId]
    )).rows;

    const history = (await pool.query(
      "SELECT * FROM order_status_history WHERE order_id = $1 ORDER BY created_at DESC",
      [orderId]
    )).rows;

    return {
      ...order,
      items,
      history
    };
  }
};
