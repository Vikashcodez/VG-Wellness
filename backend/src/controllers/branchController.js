import pool from "../config/db.js";

export const getOrganizations = async (req, res, next) => {
  try {
    const list = (await pool.query("SELECT * FROM organizations ORDER BY name ASC")).rows;
    res.json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
};

export const getBranches = async (req, res, next) => {
  try {
    const list = (await pool.query("SELECT * FROM branches WHERE is_active = true ORDER BY name ASC")).rows;
    res.json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
};
