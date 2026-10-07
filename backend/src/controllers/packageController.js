import pool from "../config/db.js";

// Packages
export const getPackages = async (req, res, next) => {
  try {
    const pkgs = (await pool.query("SELECT * FROM packages WHERE is_active = true ORDER BY price ASC")).rows;
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
    const plans = (await pool.query("SELECT * FROM membership_plans WHERE is_active = true ORDER BY price ASC")).rows;
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
