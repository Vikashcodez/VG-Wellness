import pool from "../config/db.js";
import { getTenantScope } from "../utils/tenantIsolation.js";

export const getOrganizations = async (req, res, next) => {
  try {
    const scope = getTenantScope(req);
    let query = "SELECT * FROM organizations WHERE 1=1";
    const params = [];

    if (!scope.isSuper) {
      params.push(scope.organizationId || 1);
      query += ` AND id = $${params.length}`;
    }

    query += " ORDER BY name ASC";
    const list = (await pool.query(query, params)).rows;
    res.json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
};

export const getBranches = async (req, res, next) => {
  try {
    const scope = getTenantScope(req);
    let query = `
      SELECT b.*,
             u.first_name as admin_first_name,
             u.last_name as admin_last_name,
             u.email as admin_email
      FROM branches b
      LEFT JOIN users u ON u.branch_id = b.id AND u.role_id = (SELECT id FROM roles WHERE name = 'BRANCH_ADMIN' LIMIT 1)
      WHERE b.is_active = true
    `;
    const params = [];

    if (scope.organizationId) {
      params.push(scope.organizationId);
      query += ` AND b.organization_id = $${params.length}`;
    }

    if (scope.branchId) {
      params.push(scope.branchId);
      query += ` AND b.id = $${params.length}`;
    }

    query += " ORDER BY b.name ASC";
    const list = (await pool.query(query, params)).rows;
    res.json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
};
