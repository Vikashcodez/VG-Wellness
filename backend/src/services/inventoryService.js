import pool from "../config/db.js";
import { logAudit } from "../middleware/auditLogger.js";

export const inventoryService = {
  async getStockList({ branchId = 1, search, lowStockOnly = false }) {
    let query = `
      SELECT s.*, p.name as product_name, p.sku, p.price as selling_retail_price,
             pc.name as category_name, b.name as branch_name, il.name as location_name
      FROM inventory_stock s
      JOIN products p ON s.product_id = p.id
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      LEFT JOIN branches b ON s.branch_id = b.id
      LEFT JOIN inventory_locations il ON s.location_id = il.id
      WHERE 1=1
    `;
    const params = [];

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

  async adjustStock({ branchId = 1, productId, adjustmentType, quantity, reason, userId }) {
    const conn = await pool.connect();
    try {
      await conn.query("BEGIN");

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
          `INSERT INTO inventory_stock (branch_id, product_id, batch_number, quantity, purchase_price, selling_price)
           VALUES ($1, $2, 'ADJ-BATCH', $3, 0, 0) RETURNING *`,
          [branchId, productId, quantity]
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
          "UPDATE inventory_stock SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
          [newQty, stockId]
        );
      }

      // Record adjustment
      await conn.query(
        `INSERT INTO stock_adjustments (branch_id, product_id, adjustment_type, quantity, reason, adjusted_by)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [branchId, productId, adjustmentType, quantity, reason, userId]
      );

      // Record transaction
      await conn.query(
        `INSERT INTO inventory_transactions (branch_id, product_id, transaction_type, quantity, notes, created_by)
         VALUES ($1, $2, 'ADJUSTMENT', $3, $4, $5)`,
        [branchId, productId, adjustmentType === "INCREASE" ? quantity : -quantity, reason, userId]
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

  async getTransactions(branchId = 1) {
    const res = await pool.query(
      `SELECT t.*, p.name as product_name, p.sku, u.first_name, u.last_name
       FROM inventory_transactions t
       JOIN products p ON t.product_id = p.id
       LEFT JOIN users u ON t.created_by = u.id
       WHERE t.branch_id = $1
       ORDER BY t.created_at DESC LIMIT 100`,
      [branchId]
    );
    return res.rows;
  },

  async getSuppliers(branchId = 1) {
    const res = await pool.query(
      `SELECT * FROM suppliers WHERE branch_id = $1 OR branch_id IS NULL ORDER BY name ASC`,
      [branchId]
    );
    return res.rows;
  }
};
