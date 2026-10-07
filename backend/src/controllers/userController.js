import pool from "../config/db.js";
import bcrypt from "bcryptjs";

export const getUsers = async (req, res, next) => {
  try {
    const list = (await pool.query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.is_active, u.created_at,
              r.name as role_name, b.name as branch_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN branches b ON u.branch_id = b.id
       ORDER BY u.created_at DESC`
    )).rows;
    res.json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
};

export const getRoles = async (req, res, next) => {
  try {
    const list = (await pool.query("SELECT * FROM roles ORDER BY id ASC")).rows;
    res.json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
};

export const getAuditLogs = async (req, res, next) => {
  try {
    const list = (await pool.query(
      `SELECT al.*, u.first_name, u.last_name, u.email
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ORDER BY al.created_at DESC LIMIT 100`
    )).rows;
    res.json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
};
