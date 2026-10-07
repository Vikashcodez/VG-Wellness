import bcrypt from "bcryptjs";
import pool from "../config/db.js";
import { signToken } from "../utils/jwt.js";
import { logAudit } from "../middleware/auditLogger.js";

export const authService = {
  async login(email, password, ipAddress) {
    const res = await pool.query(
      `SELECT u.id, u.organization_id, u.branch_id, u.first_name, u.last_name, u.email,
              u.password_hash, u.is_active, u.permissions, r.name as role, c.id as client_id, c.client_code,
              p.id as practitioner_id, b.name as branch_name, b.organization_id as branch_org_id,
              COALESCE(o.name, b_org.name, 'VGT Wellness Centre Management') as organization_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN clients c ON c.user_id = u.id
       LEFT JOIN practitioners p ON p.user_id = u.id
       LEFT JOIN branches b ON u.branch_id = b.id
       LEFT JOIN organizations o ON u.organization_id = o.id
       LEFT JOIN organizations b_org ON b.organization_id = b_org.id
       WHERE LOWER(u.email) = LOWER($1)`,
      [email]
    );

    if (res.rowCount === 0) {
      throw new Error("Invalid email or password");
    }

    const user = res.rows[0];
    if (!user.is_active) {
      throw new Error("Account is suspended. Please contact administrator.");
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new Error("Invalid email or password");
    }

    // Update last login
    await pool.query("UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1", [user.id]);

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    logAudit({
      userId: user.id,
      action: "USER_LOGIN",
      module: "AUTH",
      entityType: "users",
      entityId: user.id,
      ipAddress
    });

    const finalOrgId = user.organization_id || user.branch_org_id || 1;

    return {
      token,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
        permissions: user.permissions || [],
        organizationId: finalOrgId,
        organizationName: user.organization_name,
        branchId: user.branch_id,
        branchName: user.branch_name,
        clientId: user.client_id,
        clientCode: user.client_code,
        practitionerId: user.practitioner_id
      }
    };
  },

  async registerClient({ firstName, lastName, email, password, mobile, dateOfBirth, gender, branchId = 1, address, city, state, pincode, ipAddress }) {
    const clientConn = await pool.connect();
    try {
      await clientConn.query("BEGIN");

      // Check if user exists
      const existing = await clientConn.query("SELECT id FROM users WHERE LOWER(email) = LOWER($1)", [email]);
      if (existing.rowCount > 0) {
        throw new Error("An account with this email address already exists.");
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Get CLIENT role ID
      const roleRes = await clientConn.query("SELECT id FROM roles WHERE name = 'CLIENT'");
      const roleId = roleRes.rows[0]?.id || 10;

      // Resolve branch organization_id
      const bRes = await clientConn.query("SELECT organization_id FROM branches WHERE id = $1", [branchId]);
      const orgId = bRes.rows[0]?.organization_id || 1;

      // Create user
      const userRes = await clientConn.query(
        `INSERT INTO users (organization_id, branch_id, first_name, last_name, email, password_hash, phone, role_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [orgId, branchId, firstName, lastName, email, passwordHash, mobile, roleId]
      );
      const userId = userRes.rows[0].id;

      await clientConn.query(
        `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [userId, roleId]
      );

      // Generate client code (WC-YYYY-XXXX)
      const countRes = await clientConn.query("SELECT COUNT(*) FROM clients");
      const codeNum = String(parseInt(countRes.rows[0].count) + 1).padStart(4, "0");
      const clientCode = `WC-${new Date().getFullYear()}-${codeNum}`;

      // Calculate age if DOB provided
      let age = null;
      if (dateOfBirth) {
        const birthDate = new Date(dateOfBirth);
        const ageDifMs = Date.now() - birthDate.getTime();
        const ageDate = new Date(ageDifMs);
        age = Math.abs(ageDate.getUTCFullYear() - 1970);
      }

      // Create client
      const clientRes = await clientConn.query(
        `INSERT INTO clients (organization_id, user_id, branch_id, client_code, first_name, last_name, date_of_birth, age, gender, mobile, email)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id`,
        [orgId, userId, branchId, clientCode, firstName, lastName, dateOfBirth || null, age, gender || "OTHER", mobile, email]
      );
      const clientId = clientRes.rows[0].id;

      // Create address if provided
      if (address || city) {
        await clientConn.query(
          `INSERT INTO client_addresses (client_id, address_line1, city, state, pincode, is_primary)
           VALUES ($1, $2, $3, $4, $5, true)`,
          [clientId, address || "Not provided", city || "Bengaluru", state || "Karnataka", pincode || "560001"]
        );
      }

      // Create welcome notification
      await clientConn.query(
        `INSERT INTO notifications (user_id, client_id, title, message, type, link)
         VALUES ($1, $2, 'Welcome to the Wellness Centre!', 'Your account has been registered successfully. Explore services, book your first consultation, and set your health goals.', 'SUCCESS', '/dashboard')`,
        [userId, clientId]
      );

      await clientConn.query("COMMIT");

      const token = signToken({ id: userId, email, role: "CLIENT" });

      logAudit({
        userId,
        action: "CLIENT_REGISTERED",
        module: "AUTH",
        entityType: "clients",
        entityId: clientId,
        newData: { email, clientCode, name: `${firstName} ${lastName}` },
        ipAddress
      });

      return {
        token,
        user: {
          id: userId,
          firstName,
          lastName,
          email,
          role: "CLIENT",
          branchId,
          clientId,
          clientCode
        }
      };
    } catch (err) {
      await clientConn.query("ROLLBACK");
      throw err;
    } finally {
      clientConn.release();
    }
  }
};
