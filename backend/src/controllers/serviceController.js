import pool from "../config/db.js";

export const getServices = async (req, res, next) => {
  try {
    const { categoryId, branchId } = req.query;
    let query = `
      SELECT s.*, sc.name as category_name
      FROM services s
      LEFT JOIN service_categories sc ON s.category_id = sc.id
      WHERE s.is_active = true
    `;
    const params = [];

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
    const list = (await pool.query("SELECT * FROM service_categories WHERE is_active = true ORDER BY name ASC")).rows;
    res.json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
};
