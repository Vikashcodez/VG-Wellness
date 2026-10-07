import { verifyToken } from "../utils/jwt.js";
import pool from "../config/db.js";

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication token missing or invalid format"
      });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token"
      });
    }

    // Query user and their primary role
    const userRes = await pool.query(
      `SELECT u.id, u.organization_id, u.branch_id, u.first_name, u.last_name, u.email,
              u.is_active, r.name as role_name, c.id as client_id, p.id as practitioner_id
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN clients c ON c.user_id = u.id
       LEFT JOIN practitioners p ON p.user_id = u.id
       WHERE u.id = $1`,
      [decoded.id]
    );

    if (userRes.rowCount === 0) {
      return res.status(401).json({
        success: false,
        message: "User account no longer exists"
      });
    }

    const user = userRes.rows[0];
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: "User account is deactivated"
      });
    }

    req.user = {
      id: user.id,
      organizationId: user.organization_id,
      branchId: user.branch_id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role_name,
      clientId: user.client_id,
      practitionerId: user.practitioner_id
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ success: false, message: "Server authentication error" });
  }
};

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        success: false,
        message: "Access forbidden: No role assigned"
      });
    }

    // SUPER_ADMIN has access to everything
    if (req.user.role === "SUPER_ADMIN") {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires one of roles: [${allowedRoles.join(", ")}]. Current role: ${req.user.role}`
      });
    }

    next();
  };
};
