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
              u.is_active, u.permissions, r.name as role_name, c.id as client_id, p.id as practitioner_id,
              b.organization_id as branch_org_id
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN branches b ON u.branch_id = b.id
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

    const finalOrgId = user.organization_id || user.branch_org_id || null;

    req.user = {
      id: user.id,
      organizationId: finalOrgId,
      branchId: user.branch_id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role_name,
      permissions: user.permissions || [],
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

    // Administrators have full access
    if (["SUPER_ADMIN", "ADMIN", "CENTRE_ADMIN", "BRANCH_ADMIN"].includes(req.user.role)) {
      return next();
    }

    if (allowedRoles.includes(req.user.role)) {
      return next();
    }

    // Check if staff has custom tab permissions assigned
    let perms = req.user.permissions;
    if (typeof perms === "string") {
      try { perms = JSON.parse(perms); } catch (e) { perms = []; }
    }
    if (Array.isArray(perms) && perms.length > 0) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Access denied. Requires one of roles: [${allowedRoles.join(", ")}]. Current role: ${req.user.role}`
    });
  };
};
