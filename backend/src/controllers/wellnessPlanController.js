import pool from "../config/db.js";
import { getTenantScope } from "../utils/tenantIsolation.js";

export const getWellnessPlans = async (req, res, next) => {
  try {
    const scope = getTenantScope(req);
    let query = "SELECT * FROM wellness_plans WHERE is_active = true";
    const params = [];

    if (scope.organizationId) {
      params.push(scope.organizationId);
      query += ` AND organization_id = $${params.length}`;
    }

    query += " ORDER BY name ASC";
    const plans = (await pool.query(query, params)).rows;
    res.json({ success: true, data: plans });
  } catch (error) {
    next(error);
  }
};

export const getWellnessPlanById = async (req, res, next) => {
  try {
    const scope = getTenantScope(req);
    const planId = parseInt(req.params.id);
    const planRes = await pool.query("SELECT * FROM wellness_plans WHERE id = $1", [planId]);
    if (planRes.rowCount === 0) return res.status(404).json({ success: false, message: "Plan not found" });

    const plan = planRes.rows[0];
    if (!scope.isSuper && plan.organization_id && plan.organization_id !== scope.organizationId) {
      return res.status(403).json({ success: false, message: "Access forbidden to this wellness plan" });
    }

    const services = (await pool.query(
      `SELECT wps.*, s.name as service_name, s.duration_minutes
       FROM wellness_plan_services wps
       JOIN services s ON wps.service_id = s.id
       WHERE wps.wellness_plan_id = $1`,
      [planId]
    )).rows;

    const activities = (await pool.query(
      "SELECT * FROM wellness_plan_activities WHERE wellness_plan_id = $1",
      [planId]
    )).rows;

    res.json({ success: true, data: { ...plan, services, activities } });
  } catch (error) {
    next(error);
  }
};

export const assignPlanToClient = async (req, res, next) => {
  try {
    const { clientId, wellnessPlanId, goalId, startDate, endDate, notes } = req.body;
    if (!clientId || !wellnessPlanId || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: "clientId, wellnessPlanId, startDate, and endDate are required" });
    }

    const resInsert = await pool.query(
      `INSERT INTO client_wellness_plans (client_id, wellness_plan_id, goal_id, practitioner_id, start_date, end_date, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE', $7)
       RETURNING *`,
      [clientId, wellnessPlanId, goalId || null, req.user.practitionerId || null, startDate, endDate, notes || null]
    );

    res.status(201).json({ success: true, message: "Plan assigned to client", data: resInsert.rows[0] });
  } catch (error) {
    next(error);
  }
};
