import pool from "../config/db.js";
import { getTenantScope } from "../utils/tenantIsolation.js";

export const getPractitioners = async (req, res, next) => {
  try {
    const scope = getTenantScope(req);
    const { serviceId } = req.query;

    let query = `
      SELECT p.*, b.name as branch_name,
        (SELECT json_agg(ps.specialization) FROM practitioner_specializations ps WHERE ps.practitioner_id = p.id) as specializations,
        (SELECT json_agg(json_build_object('id', s.id, 'name', s.name, 'duration_minutes', s.duration_minutes, 'price', s.price))
         FROM practitioner_services prs
         JOIN services s ON prs.service_id = s.id
         WHERE prs.practitioner_id = p.id) as services
      FROM practitioners p
      LEFT JOIN branches b ON p.branch_id = b.id
      WHERE p.status = 'ACTIVE'
    `;
    const params = [];

    if (scope.organizationId) {
      params.push(scope.organizationId);
      query += ` AND p.organization_id = $${params.length}`;
    }

    if (scope.branchId) {
      params.push(scope.branchId);
      query += ` AND p.branch_id = $${params.length}`;
    }

    if (serviceId) {
      params.push(serviceId);
      query += ` AND EXISTS (SELECT 1 FROM practitioner_services prs WHERE prs.practitioner_id = p.id AND prs.service_id = $${params.length})`;
    }

    query += ` ORDER BY p.first_name ASC`;
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

export const getPractitionerById = async (req, res, next) => {
  try {
    const scope = getTenantScope(req);
    const practitionerId = parseInt(req.params.id);
    const pRes = await pool.query(
      `SELECT p.*, b.name as branch_name
       FROM practitioners p
       LEFT JOIN branches b ON p.branch_id = b.id
       WHERE p.id = $1`,
      [practitionerId]
    );

    if (pRes.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Practitioner not found" });
    }

    if (!scope.isSuper && pRes.rows[0].organization_id && pRes.rows[0].organization_id !== scope.organizationId) {
      return res.status(403).json({ success: false, message: "Access forbidden: Practitioner belongs to another wellness centre" });
    }

    const specs = (await pool.query("SELECT specialization FROM practitioner_specializations WHERE practitioner_id = $1", [practitionerId])).rows.map(r => r.specialization);
    const availability = (await pool.query("SELECT * FROM practitioner_availability WHERE practitioner_id = $1 ORDER BY day_of_week ASC", [practitionerId])).rows;
    const services = (await pool.query(
      `SELECT s.* FROM practitioner_services ps JOIN services s ON ps.service_id = s.id WHERE ps.practitioner_id = $1`,
      [practitionerId]
    )).rows;

    res.json({
      success: true,
      data: {
        ...pRes.rows[0],
        specializations: specs,
        availability,
        services
      }
    });
  } catch (error) {
    next(error);
  }
};
