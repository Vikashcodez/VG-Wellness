import bcrypt from "bcryptjs";
import pool from "../config/db.js";
import { logAudit } from "../middleware/auditLogger.js";

export const saasService = {
  async getAllCentres() {
    const query = `
      SELECT o.*,
             u.first_name as admin_first_name, u.last_name as admin_last_name, u.email as admin_email,
             (SELECT COUNT(*) FROM branches b WHERE b.organization_id = o.id) as branch_count,
             (SELECT COUNT(*) FROM employees e WHERE e.organization_id = o.id) as employee_count,
             (SELECT COUNT(*) FROM clients c JOIN branches b ON c.branch_id = b.id WHERE b.organization_id = o.id) as client_count,
             (SELECT COALESCE(SUM(inv.total_amount), 0) FROM invoices inv JOIN branches b ON inv.branch_id = b.id WHERE b.organization_id = o.id AND inv.status = 'PAID') as total_revenue
      FROM organizations o
      LEFT JOIN users u ON o.admin_user_id = u.id
      ORDER BY o.created_at DESC
    `;
    const res = await pool.query(query);
    return res.rows;
  },

  async getCentreById(orgId) {
    const orgRes = await pool.query(
      `SELECT o.*, u.first_name as admin_first_name, u.last_name as admin_last_name, u.email as admin_email, u.phone as admin_phone
       FROM organizations o
       LEFT JOIN users u ON o.admin_user_id = u.id
       WHERE o.id = $1`,
      [orgId]
    );
    if (orgRes.rowCount === 0) throw new Error("Wellness Centre not found");

    const branches = (await pool.query(
      `SELECT b.*, u.first_name as admin_first_name, u.last_name as admin_last_name, u.email as admin_email
       FROM branches b
       LEFT JOIN users u ON b.branch_admin_id = u.id
       WHERE b.organization_id = $1 ORDER BY b.id ASC`,
      [orgId]
    )).rows;

    const employees = (await pool.query(
      `SELECT * FROM employees WHERE organization_id = $1 ORDER BY id ASC`,
      [orgId]
    )).rows;

    return {
      centre: orgRes.rows[0],
      branches,
      employees
    };
  },

  async createCentre(data, creatorUserId) {
    const {
      name, code, slug, email, phone, address, website,
      planType = "PRO", maxBranches = 5, taxNumber,
      adminFirstName, adminLastName, adminEmail, adminPassword, adminPhone
    } = data;

    if (!name || !code || !adminEmail || !adminPassword) {
      throw new Error("Centre Name, Code, Admin Email, and Admin Password are required");
    }

    const conn = await pool.connect();
    try {
      await conn.query("BEGIN");

      // 1. Create Organization
      const orgSlug = slug || code.toLowerCase().replace(/[^a-z0-9]/g, "-");
      const orgRes = await conn.query(
        `INSERT INTO organizations (name, code, slug, email, phone, address, website, plan_type, status, max_branches, tax_number)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ACTIVE', $9, $10)
         RETURNING *`,
        [name, code.toUpperCase(), orgSlug, email, phone, address, website, planType, maxBranches, taxNumber || "GSTIN-NOT-SPECIFIED"]
      );
      const newOrg = orgRes.rows[0];

      // 2. Create Initial Flagship Branch
      const branchCode = `${code.toUpperCase()}-BR-01`;
      const branchRes = await conn.query(
        `INSERT INTO branches (organization_id, name, code, email, phone, address, city, state, country)
         VALUES ($1, $2, $3, $4, $5, $6, 'Bengaluru', 'Karnataka', 'India')
         RETURNING *`,
        [newOrg.id, `${name} Main Branch`, branchCode, email, phone, address]
      );
      const newBranch = branchRes.rows[0];

      // 3. Get or create CENTRE_ADMIN role
      const roleRes = await conn.query("SELECT id FROM roles WHERE name IN ('CENTRE_ADMIN', 'ADMIN') ORDER BY (name = 'CENTRE_ADMIN') DESC");
      const adminRoleId = roleRes.rows[0]?.id || 2;

      // 4. Create Centre Admin User
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(adminPassword, salt);

      const userRes = await conn.query(
        `INSERT INTO users (branch_id, organization_id, role_id, email, password_hash, first_name, last_name, phone)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [newBranch.id, newOrg.id, adminRoleId, adminEmail, passwordHash, adminFirstName || "Centre", adminLastName || "Admin", adminPhone || phone]
      );
      const adminUserId = userRes.rows[0].id;

      // Assign user_roles
      await conn.query(
        `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [adminUserId, adminRoleId]
      );

      // Link Admin User back to Organization and Branch
      await conn.query("UPDATE organizations SET admin_user_id = $1 WHERE id = $2", [adminUserId, newOrg.id]);
      await conn.query("UPDATE branches SET branch_admin_id = $1 WHERE id = $2", [adminUserId, newBranch.id]);

      // Seed Starter Master Categories for this new Wellness Centre
      await conn.query(
        `INSERT INTO service_categories (organization_id, name, description, is_active)
         VALUES 
          ($1, 'Therapy & Consultations', 'General and holistic wellness consultations', true),
          ($1, 'Holistic Treatments', 'Specialized body and mind treatments', true),
          ($1, 'Nutrition & Diet', 'Nutritional assessments and meal planning', true)
         ON CONFLICT DO NOTHING`,
        [newOrg.id]
      );
      await conn.query(
        `INSERT INTO product_categories (organization_id, name, description, is_active)
         VALUES 
          ($1, 'Supplements & Herbs', 'Dietary supplements and herbal extracts', true),
          ($1, 'Wellness Oils', 'Organic and essential oils', true)
         ON CONFLICT DO NOTHING`,
        [newOrg.id]
      );

      await conn.query("COMMIT");

      logAudit({
        userId: creatorUserId,
        action: "CENTRE_TENANT_CREATED",
        module: "SAAS",
        entityType: "organizations",
        entityId: newOrg.id,
        newData: { name, code, adminEmail }
      });

      return {
        centre: newOrg,
        branch: newBranch,
        adminUser: { id: adminUserId, email: adminEmail }
      };
    } catch (err) {
      await conn.query("ROLLBACK");
      throw err;
    } finally {
      conn.release();
    }
  },

  async updateCentre(orgId, data, updaterUserId) {
    const { name, email, phone, address, website, planType, status, maxBranches, taxNumber } = data;
    const res = await pool.query(
      `UPDATE organizations
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           phone = COALESCE($3, phone),
           address = COALESCE($4, address),
           website = COALESCE($5, website),
           plan_type = COALESCE($6, plan_type),
           status = COALESCE($7, status),
           max_branches = COALESCE($8, max_branches),
           tax_number = COALESCE($9, tax_number),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING *`,
      [name, email, phone, address, website, planType, status, maxBranches, taxNumber, orgId]
    );

    logAudit({
      userId: updaterUserId,
      action: "CENTRE_TENANT_UPDATED",
      module: "SAAS",
      entityType: "organizations",
      entityId: orgId,
      newData: data
    });

    return res.rows[0];
  },

  async createBranch(orgId, data, creatorUserId) {
    const {
      name, code, email, phone, address, city, state, country, pincode,
      adminFirstName, adminLastName, adminEmail, adminPassword, adminPhone
    } = data;
    if (!name || !code) throw new Error("Branch Name and Code are required");

    // Check branch limit
    const orgRes = await pool.query("SELECT max_branches FROM organizations WHERE id = $1", [orgId]);
    const maxBranches = orgRes.rows[0]?.max_branches || 5;

    const countRes = await pool.query("SELECT COUNT(*) FROM branches WHERE organization_id = $1", [orgId]);
    if (parseInt(countRes.rows[0].count) >= maxBranches) {
      throw new Error(`Branch limit reached for this organization (Max: ${maxBranches}). Please upgrade subscription.`);
    }

    const conn = await pool.connect();
    try {
      await conn.query("BEGIN");

      // 1. Insert branch
      const branchRes = await conn.query(
        `INSERT INTO branches (organization_id, name, code, email, phone, address, city, state, country, pincode)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [orgId, name, code.toUpperCase(), email, phone, address, city || "Bengaluru", state || "Karnataka", country || "India", pincode]
      );
      const newBranch = branchRes.rows[0];

      let branchAdminUser = null;

      // 2. If Branch Admin credentials provided, create user atomically
      if (adminEmail && adminPassword) {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(adminPassword, salt);

        // Get role ID for BRANCH_ADMIN or MANAGER
        const roleRes = await conn.query(
          "SELECT id FROM roles WHERE name IN ('BRANCH_ADMIN', 'MANAGER') ORDER BY (name = 'BRANCH_ADMIN') DESC"
        );
        const branchAdminRoleId = roleRes.rows[0]?.id || 3;

        const userRes = await conn.query(
          `INSERT INTO users (branch_id, organization_id, role_id, email, password_hash, first_name, last_name, phone)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id, email, first_name, last_name`,
          [
            newBranch.id, orgId, branchAdminRoleId, adminEmail, passwordHash,
            adminFirstName || "Branch", adminLastName || "Admin", adminPhone || phone
          ]
        );
        branchAdminUser = userRes.rows[0];

        await conn.query(
          `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [branchAdminUser.id, branchAdminRoleId]
        );

        await conn.query(
          `UPDATE branches SET branch_admin_id = $1 WHERE id = $2`,
          [branchAdminUser.id, newBranch.id]
        );
        newBranch.branch_admin_id = branchAdminUser.id;
      }

      await conn.query("COMMIT");

      logAudit({
        userId: creatorUserId,
        action: "BRANCH_CREATED",
        module: "SAAS",
        entityType: "branches",
        entityId: newBranch.id,
        newData: { name, code, adminEmail }
      });

      return {
        ...newBranch,
        adminUser: branchAdminUser
      };
    } catch (err) {
      await conn.query("ROLLBACK");
      throw err;
    } finally {
      conn.release();
    }
  },

  async getMyCentre(userId) {
    const userRes = await pool.query(
      `SELECT u.organization_id, b.organization_id as branch_org_id
       FROM users u
       LEFT JOIN branches b ON u.branch_id = b.id
       WHERE u.id = $1`,
      [userId]
    );
    let orgId = userRes.rows[0]?.organization_id || userRes.rows[0]?.branch_org_id;
    if (!orgId) {
      const orgAdminRes = await pool.query("SELECT id FROM organizations WHERE admin_user_id = $1", [userId]);
      orgId = orgAdminRes.rows[0]?.id;
    }
    if (!orgId) orgId = 1;
    return await this.getCentreById(orgId);
  },

  async getPlatformMetrics() {
    const centresCount = await pool.query("SELECT COUNT(*) FROM organizations");
    const activeCentres = await pool.query("SELECT COUNT(*) FROM organizations WHERE status = 'ACTIVE'");
    const branchesCount = await pool.query("SELECT COUNT(*) FROM branches");
    const employeesCount = await pool.query("SELECT COUNT(*) FROM employees");
    const clientsCount = await pool.query("SELECT COUNT(*) FROM clients");
    const revenueSum = await pool.query("SELECT COALESCE(SUM(amount), 0) as total FROM payments");

    const recentCentres = (await pool.query(
      `SELECT o.id, o.name, o.code, o.plan_type, o.status, o.created_at,
              (SELECT COUNT(*) FROM branches b WHERE b.organization_id = o.id) as branch_count
       FROM organizations o ORDER BY o.created_at DESC LIMIT 5`
    )).rows;

    return {
      totalCentres: parseInt(centresCount.rows[0].count),
      activeCentres: parseInt(activeCentres.rows[0].count),
      totalBranches: parseInt(branchesCount.rows[0].count),
      totalEmployees: parseInt(employeesCount.rows[0].count),
      totalClients: parseInt(clientsCount.rows[0].count),
      totalPlatformRevenue: parseFloat(revenueSum.rows[0].total),
      recentCentres
    };
  }
};
