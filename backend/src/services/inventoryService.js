import pool from "../config/db.js";
import { logAudit } from "../middleware/auditLogger.js";

export const inventoryService = {
  async getStockList({ organizationId = null, branchId = null, search, lowStockOnly = false }) {
    let query = `
      SELECT s.*, p.name as product_name, p.sku, p.price as selling_retail_price,
             pc.name as category_name, b.name as branch_name, il.name as location_name,
             o.name as organization_name
      FROM inventory_stock s
      JOIN products p ON s.product_id = p.id
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      LEFT JOIN branches b ON s.branch_id = b.id
      LEFT JOIN organizations o ON s.organization_id = o.id
      LEFT JOIN inventory_locations il ON s.location_id = il.id
      WHERE 1=1
    `;
    const params = [];

    if (organizationId) {
      params.push(organizationId);
      query += ` AND s.organization_id = $${params.length}`;
    }
    if (branchId) {
      params.push(branchId);
      query += ` AND s.branch_id = $${params.length}`;
    }
    if (lowStockOnly) {
      query += ` AND s.quantity <= 10`;
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (p.name ILIKE $${params.length} OR p.sku ILIKE $${params.length} OR s.batch_number ILIKE $${params.length})`;
    }

    query += ` ORDER BY s.expiry_date ASC NULLS LAST, s.updated_at DESC`;
    const res = await pool.query(query, params);
    return res.rows;
  },

  async adjustStock({ organizationId = 1, branchId = 1, productId, adjustmentType, quantity, reason, userId }) {
    const conn = await pool.connect();
    try {
      await conn.query("BEGIN");

      // Resolve organizationId from branch if not passed
      let orgId = organizationId;
      if (!orgId && branchId) {
        const bRes = await conn.query("SELECT organization_id FROM branches WHERE id = $1", [branchId]);
        orgId = bRes.rows[0]?.organization_id || 1;
      }

      // Find stock row
      const stockRes = await conn.query(
        "SELECT * FROM inventory_stock WHERE branch_id = $1 AND product_id = $2 ORDER BY id ASC LIMIT 1",
        [branchId, productId]
      );

      let newQty = 0;
      let stockId;

      if (stockRes.rowCount === 0) {
        if (adjustmentType === "DECREASE") {
          throw new Error("Cannot decrease stock for product with 0 inventory");
        }
        const insertRes = await conn.query(
          `INSERT INTO inventory_stock (organization_id, branch_id, product_id, batch_number, quantity, purchase_price, selling_price)
           VALUES ($1, $2, $3, 'ADJ-BATCH', $4, 0, 0) RETURNING *`,
          [orgId, branchId, productId, quantity]
        );
        newQty = quantity;
        stockId = insertRes.rows[0].id;
      } else {
        const stock = stockRes.rows[0];
        stockId = stock.id;
        if (adjustmentType === "INCREASE") {
          newQty = stock.quantity + quantity;
        } else {
          if (stock.quantity < quantity) {
            throw new Error(`Insufficient stock. Current: ${stock.quantity}, requested deduction: ${quantity}`);
          }
          newQty = stock.quantity - quantity;
        }

        await conn.query(
          "UPDATE inventory_stock SET quantity = $1, organization_id = COALESCE(organization_id, $2), updated_at = CURRENT_TIMESTAMP WHERE id = $3",
          [newQty, orgId, stockId]
        );
      }

      // Record adjustment
      await conn.query(
        `INSERT INTO stock_adjustments (organization_id, branch_id, product_id, adjustment_type, quantity, reason, adjusted_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [orgId, branchId, productId, adjustmentType, quantity, reason, userId]
      );

      // Record transaction
      await conn.query(
        `INSERT INTO inventory_transactions (organization_id, branch_id, product_id, transaction_type, quantity, notes, created_by)
         VALUES ($1, $2, $3, 'ADJUSTMENT', $4, $5, $6)`,
        [orgId, branchId, productId, adjustmentType === "INCREASE" ? quantity : -quantity, reason, userId]
      );

      await conn.query("COMMIT");

      logAudit({
        userId,
        action: "STOCK_ADJUSTED",
        module: "INVENTORY",
        entityType: "inventory_stock",
        entityId: stockId,
        newData: { productId, adjustmentType, quantity, newQty, reason }
      });

      return { success: true, newQuantity: newQty };
    } catch (err) {
      await conn.query("ROLLBACK");
      throw err;
    } finally {
      conn.release();
    }
  },

  async getTransactions({ organizationId = null, branchId = null }) {
    let query = `
      SELECT t.*, p.name as product_name, p.sku, u.first_name, u.last_name
      FROM inventory_transactions t
      JOIN products p ON t.product_id = p.id
      LEFT JOIN users u ON t.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (organizationId) {
      params.push(organizationId);
      query += ` AND t.organization_id = $${params.length}`;
    }
    if (branchId) {
      params.push(branchId);
      query += ` AND t.branch_id = $${params.length}`;
    }

    query += ` ORDER BY t.created_at DESC LIMIT 100`;
    const res = await pool.query(query, params);
    return res.rows;
  },

  async getSuppliers({ organizationId = null, branchId = null }) {
    let query = `SELECT * FROM suppliers WHERE 1=1`;
    const params = [];

    if (organizationId) {
      params.push(organizationId);
      query += ` AND (organization_id = $${params.length} OR organization_id IS NULL)`;
    }
    if (branchId) {
      params.push(branchId);
      query += ` AND (branch_id = $${params.length} OR branch_id IS NULL)`;
    }

    query += ` ORDER BY name ASC`;
    const res = await pool.query(query, params);
    return res.rows;
  },

  async createSupplier(data, userId) {
    const { organizationId = null, branchId = null, name, contactPerson, email, phone, address, gstTaxNumber } = data;
    if (!name) throw new Error("Supplier name is required");

    const res = await pool.query(
      `INSERT INTO suppliers (organization_id, branch_id, name, contact_person, email, phone, address, gst_tax_number, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
       RETURNING *`,
      [organizationId, branchId, name, contactPerson || "", email || "", phone || "", address || "", gstTaxNumber || ""]
    );
    return res.rows[0];
  },

  async updateSupplier(id, data, userId) {
    const { name, contactPerson, email, phone, address, gstTaxNumber, isActive } = data;
    const res = await pool.query(
      `UPDATE suppliers
       SET name = COALESCE($1, name),
           contact_person = COALESCE($2, contact_person),
           email = COALESCE($3, email),
           phone = COALESCE($4, phone),
           address = COALESCE($5, address),
           gst_tax_number = COALESCE($6, gst_tax_number),
           is_active = COALESCE($7, is_active)
       WHERE id = $8
       RETURNING *`,
      [name, contactPerson, email, phone, address, gstTaxNumber, isActive, id]
    );
    if (res.rowCount === 0) throw new Error("Supplier not found");
    return res.rows[0];
  },

  async deleteSupplier(id, userId) {
    await pool.query("UPDATE suppliers SET is_active = false WHERE id = $1", [id]);
    return { success: true };
  },

  async createGRN(data, userId) {
    const { organizationId = null, branchId = null, supplierId, invoiceNumber, invoiceDate, receivedDate, notes, items = [] } = data;
    if (!supplierId || items.length === 0) {
      throw new Error("Supplier and at least one item are required for GRN");
    }

    const conn = await pool.connect();
    try {
      await conn.query("BEGIN");

      // Generate GRN Number
      const countRes = await conn.query("SELECT COUNT(*) FROM goods_receipt_notes");
      const grnSeq = parseInt(countRes.rows[0].count) + 1;
      const grnNumber = `GRN-${new Date().getFullYear()}-${String(grnSeq).padStart(4, "0")}`;

      let totalAmount = 0;
      items.forEach(it => {
        const lineTotal = (parseFloat(it.quantity) || 0) * (parseFloat(it.unitCost) || 0);
        totalAmount += lineTotal;
      });

      // Insert GRN header
      const grnRes = await conn.query(
        `INSERT INTO goods_receipt_notes (
          organization_id, branch_id, grn_number, supplier_id, invoice_number,
          invoice_date, received_date, total_amount, status, notes, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'RECEIVED', $9, $10)
        RETURNING *`,
        [
          organizationId, branchId, grnNumber, supplierId, invoiceNumber || "",
          invoiceDate || null, receivedDate || new Date().toISOString().split("T")[0],
          totalAmount, notes || "", userId
        ]
      );
      const grn = grnRes.rows[0];

      // Insert GRN items and update stock
      for (const item of items) {
        const qty = parseInt(item.quantity) || 1;
        const unitCost = parseFloat(item.unitCost) || 0;
        const mrp = parseFloat(item.mrp) || (unitCost * 1.5);
        const lineTotal = qty * unitCost;
        const batchNo = item.batchNumber || `BATCH-${Date.now().toString().slice(-6)}`;
        const expiry = item.expiryDate || null;

        // Insert GRN item
        await conn.query(
          `INSERT INTO grn_items (grn_id, product_id, batch_number, expiry_date, quantity, unit_cost, mrp, total_cost)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [grn.id, item.productId, batchNo, expiry, qty, unitCost, mrp, lineTotal]
        );

        // Check if batch already exists in inventory_stock
        const stockBatchRes = await conn.query(
          `SELECT id, quantity FROM inventory_stock
           WHERE product_id = $1 AND batch_number = $2 AND (branch_id = $3 OR branch_id IS NULL)`,
          [item.productId, batchNo, branchId]
        );

        if (stockBatchRes.rowCount > 0) {
          const currentStock = stockBatchRes.rows[0];
          await conn.query(
            `UPDATE inventory_stock
             SET quantity = quantity + $1, selling_price = $2, purchase_price = $3, updated_at = CURRENT_TIMESTAMP
             WHERE id = $4`,
            [qty, mrp, unitCost, currentStock.id]
          );
        } else {
          await conn.query(
            `INSERT INTO inventory_stock (
              organization_id, branch_id, product_id, batch_number, expiry_date, quantity, purchase_price, selling_price
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [organizationId, branchId, item.productId, batchNo, expiry, qty, unitCost, mrp]
          );
        }

        // Record Inward Transaction
        await conn.query(
          `INSERT INTO inventory_transactions (
            organization_id, branch_id, product_id, transaction_type, quantity, batch_number, reference_type, reference_id, notes, created_by
          ) VALUES ($1, $2, $3, 'INWARD_GRN', $4, $5, 'GRN', $6, $7, $8)`,
          [organizationId, branchId, item.productId, qty, batchNo, grn.id, `GRN Entry ${grnNumber} - ${qty} units received`, userId]
        );
      }

      await conn.query("COMMIT");
      return grn;
    } catch (err) {
      await conn.query("ROLLBACK");
      throw err;
    } finally {
      conn.release();
    }
  },

  async getGRNs({ organizationId = null, branchId = null, search = "" }) {
    let query = `
      SELECT grn.*, 
             s.name as supplier_name, 
             s.contact_person, 
             s.phone as supplier_phone,
             u.first_name as received_by_first, 
             u.last_name as received_by_last,
             (SELECT COUNT(*) FROM grn_items gi WHERE gi.grn_id = grn.id) as item_count
      FROM goods_receipt_notes grn
      LEFT JOIN suppliers s ON grn.supplier_id = s.id
      LEFT JOIN users u ON grn.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (organizationId) {
      params.push(organizationId);
      query += ` AND (grn.organization_id = $${params.length} OR grn.organization_id IS NULL)`;
    }
    if (branchId) {
      params.push(branchId);
      query += ` AND (grn.branch_id = $${params.length} OR grn.branch_id IS NULL)`;
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (grn.grn_number ILIKE $${params.length} OR grn.invoice_number ILIKE $${params.length} OR s.name ILIKE $${params.length})`;
    }

    query += ` ORDER BY grn.created_at DESC`;
    const res = await pool.query(query, params);
    return res.rows;
  },

  async getGRNById(id) {
    const grnRes = await pool.query(
      `SELECT grn.*, 
              s.name as supplier_name, s.email as supplier_email, s.phone as supplier_phone, s.address as supplier_address, s.gst_tax_number,
              u.first_name as received_by_first, u.last_name as received_by_last
       FROM goods_receipt_notes grn
       LEFT JOIN suppliers s ON grn.supplier_id = s.id
       LEFT JOIN users u ON grn.created_by = u.id
       WHERE grn.id = $1`,
      [id]
    );
    if (grnRes.rowCount === 0) throw new Error("GRN not found");

    const itemsRes = await pool.query(
      `SELECT gi.*, p.name as product_name, p.sku
       FROM grn_items gi
       JOIN products p ON gi.product_id = p.id
       WHERE gi.grn_id = $1
       ORDER BY gi.id ASC`,
      [id]
    );

    return {
      ...grnRes.rows[0],
      items: itemsRes.rows
    };
  }
};
