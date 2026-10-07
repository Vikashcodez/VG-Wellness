import pool from "../config/db.js";
import { getTenantScope } from "../utils/tenantIsolation.js";

export const getServices = async (req, res, next) => {
  try {
    const { categoryId } = req.query;
    const { organizationId, branchId } = getTenantScope(req);
    let query = `
      SELECT s.*, sc.name as category_name, b.name as branch_name, o.name as organization_name
      FROM services s
      LEFT JOIN service_categories sc ON s.category_id = sc.id
      LEFT JOIN branches b ON s.branch_id = b.id
      LEFT JOIN organizations o ON s.organization_id = o.id
      WHERE s.is_active = true
    `;
    const params = [];

    if (organizationId) {
      params.push(organizationId);
      query += ` AND s.organization_id = $${params.length}`;
    }
    if (categoryId) {
      params.push(categoryId);
      query += ` AND s.category_id = $${params.length}`;
    }
    if (branchId) {
      params.push(branchId);
      query += ` AND (s.branch_id = $${params.length} OR s.branch_id IS NULL)`;
    }

    query += ` ORDER BY sc.name ASC, s.name ASC`;
    const resList = await pool.query(query, params);
    res.json({ success: true, data: resList.rows });
  } catch (error) {
    next(error);
  }
};

export const getCategories = async (req, res, next) => {
  try {
    const { organizationId } = getTenantScope(req);
    let query = "SELECT * FROM service_categories WHERE is_active = true";
    const params = [];
    if (organizationId) {
      params.push(organizationId);
      query += ` AND (organization_id = $${params.length} OR organization_id IS NULL)`;
    }
    query += " ORDER BY name ASC";
    const list = (await pool.query(query, params)).rows;
    res.json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const { organizationId } = getTenantScope(req);
    if (!name) return res.status(400).json({ success: false, message: "Category name is required" });
    const insertRes = await pool.query(
      "INSERT INTO service_categories (organization_id, name, description, is_active) VALUES ($1, $2, $3, true) RETURNING *",
      [organizationId, name.trim(), description || ""]
    );
    res.status(201).json({ success: true, message: "Category created successfully", data: insertRes.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const createService = async (req, res, next) => {
  try {
    const { name, categoryId, durationMinutes, price, description, taxRate, isOnline } = req.body;
    const { organizationId, branchId } = getTenantScope(req);
    if (!name || price === undefined || !durationMinutes) {
      return res.status(400).json({ success: false, message: "Name, price, and duration are required" });
    }
    const insertRes = await pool.query(
      `INSERT INTO services (organization_id, branch_id, category_id, name, duration_minutes, price, description, tax_rate, is_online, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
       RETURNING *`,
      [organizationId, branchId, categoryId || null, name, durationMinutes, price, description || "", taxRate || 18, isOnline || false]
    );
    res.status(201).json({ success: true, message: "Service created successfully", data: insertRes.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const updateService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, categoryId, durationMinutes, price, description, taxRate, isOnline, isActive } = req.body;
    const updateRes = await pool.query(
      `UPDATE services
       SET name = COALESCE($1, name),
           category_id = COALESCE($2, category_id),
           duration_minutes = COALESCE($3, duration_minutes),
           price = COALESCE($4, price),
           description = COALESCE($5, description),
           tax_rate = COALESCE($6, tax_rate),
           is_online = COALESCE($7, is_online),
           is_active = COALESCE($8, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [name, categoryId, durationMinutes, price, description, taxRate, isOnline, isActive, id]
    );
    if (updateRes.rowCount === 0) return res.status(404).json({ success: false, message: "Service not found" });
    res.json({ success: true, message: "Service updated successfully", data: updateRes.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query("UPDATE services SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1", [id]);
    res.json({ success: true, message: "Service deactivated successfully" });
  } catch (error) {
    next(error);
  }
};
