import pool from "../config/db.js";
import { getTenantScope } from "../utils/tenantIsolation.js";

// Packages
export const getPackages = async (req, res, next) => {
  try {
    const { organizationId, branchId } = getTenantScope(req);
    let query = "SELECT * FROM packages WHERE is_active = true";
    const params = [];
    if (organizationId) {
      params.push(organizationId);
      query += ` AND (organization_id = $${params.length} OR organization_id IS NULL)`;
    }
    if (branchId) {
      params.push(branchId);
      query += ` AND (branch_id = $${params.length} OR branch_id IS NULL)`;
    }
    query += " ORDER BY price ASC";
    const pkgs = (await pool.query(query, params)).rows;
    res.json({ success: true, data: pkgs });
  } catch (error) {
    next(error);
  }
};

export const getClientPackages = async (req, res, next) => {
  try {
    let clientId = req.query.clientId;
    if (req.user.role === "CLIENT") clientId = req.user.clientId;
    if (!clientId) return res.status(400).json({ success: false, message: "clientId required" });

    const list = (await pool.query(
      `SELECT cp.*, p.name as package_name, p.description as package_description, p.price
       FROM client_packages cp
       JOIN packages p ON cp.package_id = p.id
       WHERE cp.client_id = $1
       ORDER BY cp.created_at DESC`,
      [parseInt(clientId)]
    )).rows;

    res.json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
};

// Memberships
export const getMembershipPlans = async (req, res, next) => {
  try {
    const { organizationId } = getTenantScope(req);
    let query = "SELECT * FROM membership_plans WHERE is_active = true";
    const params = [];
    if (organizationId) {
      params.push(organizationId);
      query += ` AND (organization_id = $${params.length} OR organization_id IS NULL)`;
    }
    query += " ORDER BY price ASC";
    const plans = (await pool.query(query, params)).rows;
    res.json({ success: true, data: plans });
  } catch (error) {
    next(error);
  }
};

export const getClientMemberships = async (req, res, next) => {
  try {
    let clientId = req.query.clientId;
    if (req.user.role === "CLIENT") clientId = req.user.clientId;
    if (!clientId) return res.status(400).json({ success: false, message: "clientId required" });

    const list = (await pool.query(
      `SELECT cm.*, mp.name as plan_name, mp.tier, mp.benefits_description
       FROM client_memberships cm
       JOIN membership_plans mp ON cm.membership_plan_id = mp.id
       WHERE cm.client_id = $1
       ORDER BY cm.created_at DESC`,
      [parseInt(clientId)]
    )).rows;

    res.json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
};

export const createPackage = async (req, res, next) => {
  try {
    const { name, description, durationDays, price } = req.body;
    const { organizationId, branchId } = getTenantScope(req);
    if (!name || price === undefined) {
      return res.status(400).json({ success: false, message: "Package name and price are required" });
    }
    const insertRes = await pool.query(
      `INSERT INTO packages (organization_id, branch_id, name, description, duration_days, price, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING *`,
      [organizationId, branchId, name, description || "", durationDays || 30, price]
    );
    res.status(201).json({ success: true, message: "Package created successfully", data: insertRes.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const updatePackage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, durationDays, price, isActive } = req.body;
    const updateRes = await pool.query(
      `UPDATE packages
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           duration_days = COALESCE($3, duration_days),
           price = COALESCE($4, price),
           is_active = COALESCE($5, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [name, description, durationDays, price, isActive, id]
    );
    if (updateRes.rowCount === 0) return res.status(404).json({ success: false, message: "Package not found" });
    res.json({ success: true, message: "Package updated successfully", data: updateRes.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const createMembershipPlan = async (req, res, next) => {
  try {
    const { name, tier, durationMonths, price, discountPercent, benefitsDescription } = req.body;
    const { organizationId, branchId } = getTenantScope(req);
    if (!name || !tier || price === undefined) {
      return res.status(400).json({ success: false, message: "Name, tier, and price are required" });
    }
    const insertRes = await pool.query(
      `INSERT INTO membership_plans (organization_id, branch_id, name, tier, duration_months, price, discount_percent, benefits_description, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
       RETURNING *`,
      [organizationId, branchId, name, tier, durationMonths || 12, price, discountPercent || 10, benefitsDescription || ""]
    );
    res.status(201).json({ success: true, message: "Membership plan created successfully", data: insertRes.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const updateMembershipPlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, tier, durationMonths, price, discountPercent, benefitsDescription, isActive } = req.body;
    const updateRes = await pool.query(
      `UPDATE membership_plans
       SET name = COALESCE($1, name),
           tier = COALESCE($2, tier),
           duration_months = COALESCE($3, duration_months),
           price = COALESCE($4, price),
           discount_percent = COALESCE($5, discount_percent),
           benefits_description = COALESCE($6, benefits_description),
           is_active = COALESCE($7, is_active)
       WHERE id = $8
       RETURNING *`,
      [name, tier, durationMonths, price, discountPercent, benefitsDescription, isActive, id]
    );
    if (updateRes.rowCount === 0) return res.status(404).json({ success: false, message: "Membership plan not found" });
    res.json({ success: true, message: "Membership plan updated successfully", data: updateRes.rows[0] });
  } catch (error) {
    next(error);
  }
};
