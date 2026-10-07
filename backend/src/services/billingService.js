import pool from "../config/db.js";
import { logAudit } from "../middleware/auditLogger.js";

export const billingService = {
  async getInvoices({ clientId, branchId, organizationId, status, dateFrom, dateTo }) {
    let query = `
      SELECT inv.*,
             c.first_name as client_first_name, c.last_name as client_last_name, c.client_code, c.mobile as client_mobile,
             b.name as branch_name,
             (SELECT COUNT(*) FROM invoice_items ii WHERE ii.invoice_id = inv.id) as item_count
      FROM invoices inv
      JOIN clients c ON inv.client_id = c.id
      LEFT JOIN branches b ON inv.branch_id = b.id
      WHERE 1=1
    `;
    const params = [];

    if (organizationId) {
      params.push(organizationId);
      query += ` AND inv.organization_id = $${params.length}`;
    }
    if (clientId) {
      params.push(clientId);
      query += ` AND inv.client_id = $${params.length}`;
    }
    if (branchId) {
      params.push(branchId);
      query += ` AND inv.branch_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND inv.status = $${params.length}`;
    }
    if (dateFrom) {
      params.push(dateFrom);
      query += ` AND inv.invoice_date >= $${params.length}`;
    }
    if (dateTo) {
      params.push(dateTo);
      query += ` AND inv.invoice_date <= $${params.length}`;
    }

    query += ` ORDER BY inv.invoice_date DESC, inv.created_at DESC`;
    const res = await pool.query(query, params);
    return res.rows;
  },

  async getInvoiceById(invoiceId) {
    const invRes = await pool.query(
      `SELECT inv.*,
              c.first_name as client_first_name, c.last_name as client_last_name, c.client_code,
              c.mobile as client_mobile, c.email as client_email,
              b.name as branch_name, b.address as branch_address, b.phone as branch_phone, b.email as branch_email
       FROM invoices inv
       JOIN clients c ON inv.client_id = c.id
       LEFT JOIN branches b ON inv.branch_id = b.id
       WHERE inv.id = $1`,
      [invoiceId]
    );

    if (invRes.rowCount === 0) throw new Error("Invoice not found");
    const invoice = invRes.rows[0];

    const items = (await pool.query(
      "SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY id ASC",
      [invoiceId]
    )).rows;

    const payments = (await pool.query(
      `SELECT p.*, pa.allocated_amount
       FROM payment_allocations pa
       JOIN payments p ON pa.payment_id = p.id
       WHERE pa.invoice_id = $1
       ORDER BY p.payment_date DESC`,
      [invoiceId]
    )).rows;

    const refunds = (await pool.query(
      "SELECT * FROM refunds WHERE invoice_id = $1 ORDER BY created_at DESC",
      [invoiceId]
    )).rows;

    return {
      ...invoice,
      items,
      payments,
      refunds
    };
  },

  async createInvoice({ clientId, branchId = 1, organizationId = 1, items, discount = 0, notes = "", userId = null }) {
    if (!items || items.length === 0) {
      throw new Error("Invoice must have at least one line item");
    }

    const conn = await pool.connect();
    try {
      await conn.query("BEGIN");

      let subtotal = 0;
      let totalTax = 0;

      // Calculate totals
      for (const it of items) {
        const lineSub = parseFloat(it.unitPrice) * parseInt(it.quantity);
        const taxRate = parseFloat(it.taxRate || 0);
        const lineTax = lineSub * (taxRate / 100);
        subtotal += lineSub;
        totalTax += lineTax;
      }

      const totalAmount = Math.max(0, subtotal + totalTax - parseFloat(discount || 0));
      const balanceAmount = totalAmount;

      const countRes = await conn.query("SELECT COUNT(*) FROM invoices");
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(parseInt(countRes.rows[0].count) + 1).padStart(4, "0")}`;

      const invRes = await conn.query(
        `INSERT INTO invoices (
          invoice_number, organization_id, client_id, branch_id, invoice_date, due_date,
          subtotal, discount, tax, total_amount, paid_amount, balance_amount, status, notes, created_by
        ) VALUES ($1, $2, $3, $4, CURRENT_DATE, CURRENT_DATE + INTERVAL '14 days', $5, $6, $7, $8, 0.00, $9, 'ISSUED', $10, $11)
        RETURNING *`,
        [invoiceNumber, organizationId, clientId, branchId, subtotal, discount, totalTax, totalAmount, balanceAmount, notes, userId]
      );
      const newInvoice = invRes.rows[0];

      for (const it of items) {
        const lineSub = parseFloat(it.unitPrice) * parseInt(it.quantity);
        const taxRate = parseFloat(it.taxRate || 0);
        const lineTax = lineSub * (taxRate / 100);
        const lineTotal = lineSub + lineTax;

        await conn.query(
          `INSERT INTO invoice_items (invoice_id, item_type, reference_id, description, quantity, unit_price, tax_rate, tax_amount, total_amount)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [newInvoice.id, it.itemType || "SERVICE", it.referenceId || null, it.description, it.quantity, it.unitPrice, taxRate, lineTax, lineTotal]
        );
      }

      await conn.query("COMMIT");

      logAudit({
        userId,
        action: "INVOICE_CREATED",
        module: "BILLING",
        entityType: "invoices",
        entityId: newInvoice.id,
        newData: { invoiceNumber, totalAmount, clientId }
      });

      return await this.getInvoiceById(newInvoice.id);
    } catch (err) {
      await conn.query("ROLLBACK");
      throw err;
    } finally {
      conn.release();
    }
  },

  async recordPayment({ invoiceId, amount, paymentMethod = "CASH", transactionReference = null, notes = "", userId = null }) {
    const conn = await pool.connect();
    try {
      await conn.query("BEGIN");

      const invRes = await conn.query("SELECT * FROM invoices WHERE id = $1 FOR UPDATE", [invoiceId]);
      if (invRes.rowCount === 0) throw new Error("Invoice not found");
      const invoice = invRes.rows[0];

      const payAmount = parseFloat(amount);
      if (payAmount <= 0) throw new Error("Payment amount must be greater than zero");

      const currentBalance = parseFloat(invoice.balance_amount);
      if (payAmount > currentBalance + 0.01) {
        throw new Error(`Payment amount (₹${payAmount}) exceeds outstanding balance (₹${currentBalance})`);
      }

      const countRes = await conn.query("SELECT COUNT(*) FROM payments");
      const paymentNumber = `PAY-${new Date().getFullYear()}-${String(parseInt(countRes.rows[0].count) + 1).padStart(4, "0")}`;

      const payRes = await conn.query(
        `INSERT INTO payments (
          payment_number, organization_id, client_id, branch_id, invoice_id, amount,
          payment_method, transaction_reference, notes, received_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [paymentNumber, invoice.organization_id || 1, invoice.client_id, invoice.branch_id, invoiceId, payAmount, paymentMethod, transactionReference, notes, userId]
      );
      const newPayment = payRes.rows[0];

      await conn.query(
        `INSERT INTO payment_allocations (payment_id, invoice_id, allocated_amount)
         VALUES ($1, $2, $3)`,
        [newPayment.id, invoiceId, payAmount]
      );

      const newPaidAmount = parseFloat(invoice.paid_amount) + payAmount;
      const newBalanceAmount = Math.max(0, parseFloat(invoice.total_amount) - newPaidAmount);
      const newStatus = newBalanceAmount <= 0.01 ? "PAID" : "PARTIAL";

      await conn.query(
        `UPDATE invoices
         SET paid_amount = $1, balance_amount = $2, status = $3, updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [newPaidAmount, newBalanceAmount, newStatus, invoiceId]
      );

      await conn.query("COMMIT");

      logAudit({
        userId,
        action: "PAYMENT_RECEIVED",
        module: "BILLING",
        entityType: "payments",
        entityId: newPayment.id,
        newData: { paymentNumber, amount: payAmount, invoiceId, newStatus }
      });

      return {
        payment: newPayment,
        invoiceStatus: newStatus,
        balanceAmount: newBalanceAmount
      };
    } catch (err) {
      await conn.query("ROLLBACK");
      throw err;
    } finally {
      conn.release();
    }
  },

  async processRefund({ paymentId, amount, reason, userId = null }) {
    const conn = await pool.connect();
    try {
      await conn.query("BEGIN");

      const payRes = await conn.query("SELECT * FROM payments WHERE id = $1 FOR UPDATE", [paymentId]);
      if (payRes.rowCount === 0) throw new Error("Payment not found");
      const payment = payRes.rows[0];

      const refAmount = parseFloat(amount);
      if (refAmount <= 0 || refAmount > parseFloat(payment.amount)) {
        throw new Error("Invalid refund amount");
      }

      const countRes = await conn.query("SELECT COUNT(*) FROM refunds");
      const refundNumber = `REF-${new Date().getFullYear()}-${String(parseInt(countRes.rows[0].count) + 1).padStart(4, "0")}`;

      const refundRes = await conn.query(
        `INSERT INTO refunds (refund_number, payment_id, invoice_id, amount, reason, processed_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [refundNumber, paymentId, payment.invoice_id, refAmount, reason, userId]
      );

      // Adjust invoice paid amount and status
      if (payment.invoice_id) {
        await conn.query(
          `UPDATE invoices
           SET paid_amount = paid_amount - $1,
               balance_amount = balance_amount + $1,
               status = CASE WHEN (paid_amount - $1) <= 0 THEN 'REFUNDED' ELSE 'PARTIAL' END,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [refAmount, payment.invoice_id]
        );
      }

      await conn.query("COMMIT");

      logAudit({
        userId,
        action: "PAYMENT_REFUNDED",
        module: "BILLING",
        entityType: "refunds",
        entityId: refundRes.rows[0].id,
        newData: { refundNumber, amount: refAmount, reason }
      });

      return refundRes.rows[0];
    } catch (err) {
      await conn.query("ROLLBACK");
      throw err;
    } finally {
      conn.release();
    }
  }
};
