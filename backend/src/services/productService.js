import pool from "../config/db.js";
import { logAudit } from "../middleware/auditLogger.js";

export const productService = {
  async getAllProducts({ organizationId, branchId, categoryId, brandId, search, activeOnly = true }) {
    let query = `
      SELECT p.*, pc.name as category_name, pb.name as brand_name,
             COALESCE(SUM(s.quantity), 0) as stock_quantity
      FROM products p
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      LEFT JOIN product_brands pb ON p.brand_id = pb.id
      LEFT JOIN inventory_stock s ON s.product_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (activeOnly) {
      query += ` AND p.is_active = true`;
    }
    if (organizationId) {
      params.push(organizationId);
      query += ` AND p.organization_id = $${params.length}`;
    }
    if (branchId) {
      params.push(branchId);
      query += ` AND (p.branch_id = $${params.length} OR p.branch_id IS NULL)`;
    }
    if (categoryId) {
      params.push(categoryId);
      query += ` AND p.category_id = $${params.length}`;
    }
    if (brandId) {
      params.push(brandId);
      query += ` AND p.brand_id = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (p.name ILIKE $${params.length} OR p.sku ILIKE $${params.length} OR p.description ILIKE $${params.length})`;
    }

    query += ` GROUP BY p.id, pc.name, pb.name ORDER BY p.name ASC`;
    const res = await pool.query(query, params);
    return res.rows;
  },

  async getProductById(productId) {
    const res = await pool.query(
      `SELECT p.*, pc.name as category_name, pb.name as brand_name,
              COALESCE(SUM(s.quantity), 0) as total_stock
       FROM products p
       LEFT JOIN product_categories pc ON p.category_id = pc.id
       LEFT JOIN product_brands pb ON p.brand_id = pb.id
       LEFT JOIN inventory_stock s ON s.product_id = p.id
       WHERE p.id = $1
       GROUP BY p.id, pc.name, pb.name`,
      [productId]
    );

    if (res.rowCount === 0) {
      throw new Error("Product not found");
    }

    const batches = (await pool.query(
      `SELECT s.*, il.name as location_name
       FROM inventory_stock s
       LEFT JOIN inventory_locations il ON s.location_id = il.id
       WHERE s.product_id = $1 AND s.quantity > 0
       ORDER BY s.expiry_date ASC NULLS LAST`,
      [productId]
    )).rows;

    const variants = (await pool.query("SELECT * FROM product_variants WHERE product_id = $1", [productId])).rows;

    return {
      ...res.rows[0],
      batches,
      variants
    };
  },

  async getRecommendations(clientId) {
    const res = await pool.query(
      `SELECT pr.*, p.name as product_name, p.price, p.image_url, p.sku,
              pc.name as category_name,
              prac.first_name as practitioner_first_name, prac.last_name as practitioner_last_name,
              COALESCE(SUM(s.quantity), 0) as stock_quantity
       FROM product_recommendations pr
       JOIN products p ON pr.product_id = p.id
       LEFT JOIN product_categories pc ON p.category_id = pc.id
       LEFT JOIN practitioners prac ON pr.practitioner_id = prac.id
       LEFT JOIN inventory_stock s ON s.product_id = p.id
       WHERE pr.client_id = $1
       GROUP BY pr.id, p.name, p.price, p.image_url, p.sku, pc.name, prac.first_name, prac.last_name
       ORDER BY pr.created_at DESC`,
      [clientId]
    );
    return res.rows;
  },

  async createRecommendation({ clientId, practitionerId, productId, reason, dosageNotes }) {
    const res = await pool.query(
      `INSERT INTO product_recommendations (client_id, practitioner_id, product_id, reason, dosage_notes, status)
       VALUES ($1, $2, $3, $4, $5, 'ACTIVE')
       RETURNING *`,
      [clientId, practitionerId, productId, reason, dosageNotes]
    );
    return res.rows[0];
  }
};
