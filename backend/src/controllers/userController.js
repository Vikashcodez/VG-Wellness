import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import { getTenantScope } from "../utils/tenantIsolation.js";

export const getUsers = async (req, res, next) => {
  try {
    const scope = getTenantScope(req);
    let query = `
      SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.is_active, u.created_at,
             r.name as role_name, b.name as branch_name, b.organization_id as branch_org_id,
             COALESCE(u.organization_id, b.organization_id) as organization_id
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN branches b ON u.branch_id = b.id
      WHERE 1=1
    `;
    const params = [];

    if (!scope.isSuper) {
      params.push(scope.organizationId || 1);
      query += ` AND (u.organization_id = $${params.length} OR b.organization_id = $${params.length})`;
    }

    if (scope.branchId) {
      params.push(scope.branchId);
      query += ` AND u.branch_id = $${params.length}`;
    }

    query += " ORDER BY u.created_at DESC";
    const list = (await pool.query(query, params)).rows;
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
    const scope = getTenantScope(req);
    let query = `
      SELECT al.*, u.first_name, u.last_name, u.email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN branches b ON u.branch_id = b.id
      WHERE 1=1
    `;
    const params = [];

    if (!scope.isSuper) {
      params.push(scope.organizationId || 1);
      query += ` AND (u.organization_id = $${params.length} OR b.organization_id = $${params.length})`;
    }

    query += " ORDER BY al.created_at DESC LIMIT 100";
    const list = (await pool.query(query, params)).rows;
    res.json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
};
