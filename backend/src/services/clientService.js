import pool from "../config/db.js";
import { logAudit } from "../middleware/auditLogger.js";

export const clientService = {
  async getAllClients({ search = "", organizationId = null, branchId = null, limit = 50, offset = 0 }) {
    let query = `
      SELECT c.*, b.name as branch_name, o.name as organization_name,
        (SELECT COUNT(*) FROM appointments a WHERE a.client_id = c.id) as total_appointments,
        (SELECT COUNT(*) FROM wellness_goals g WHERE g.client_id = c.id AND g.status = 'ACTIVE') as active_goals_count,
        (SELECT COALESCE(SUM(balance_amount), 0) FROM invoices inv WHERE inv.client_id = c.id AND inv.status != 'PAID' AND inv.status != 'CANCELLED') as outstanding_balance
      FROM clients c
      LEFT JOIN branches b ON c.branch_id = b.id
      LEFT JOIN organizations o ON c.organization_id = o.id
      WHERE 1=1
    `;
    const params = [];

    if (organizationId) {
      params.push(organizationId);
      query += ` AND c.organization_id = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (c.first_name ILIKE $${params.length} OR c.last_name ILIKE $${params.length} OR c.client_code ILIKE $${params.length} OR c.mobile ILIKE $${params.length} OR c.email ILIKE $${params.length})`;
    }

    if (branchId) {
      params.push(branchId);
      query += ` AND c.branch_id = $${params.length}`;
    }

    query += ` ORDER BY c.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    let countQuery = "SELECT COUNT(*) FROM clients c WHERE 1=1";
    const countParams = [];
    if (organizationId) {
      countParams.push(organizationId);
      countQuery += ` AND c.organization_id = $${countParams.length}`;
    }
    if (branchId) {
      countParams.push(branchId);
      countQuery += ` AND c.branch_id = $${countParams.length}`;
    }
    if (search) {
      countParams.push(`%${search}%`);
      countQuery += ` AND (c.first_name ILIKE $${countParams.length} OR c.last_name ILIKE $${countParams.length} OR c.client_code ILIKE $${countParams.length} OR c.mobile ILIKE $${countParams.length} OR c.email ILIKE $${countParams.length})`;
    }
    const countRes = await pool.query(countQuery, countParams);

    const res = await pool.query(query, params);
    return {
      clients: res.rows,
      total: parseInt(countRes.rows[0].count)
    };
  },

  async getClientProfile(clientId) {
    // 1. Core client info
    const cRes = await pool.query(
      `SELECT c.*, b.name as branch_name, u.email as user_email
       FROM clients c
       LEFT JOIN branches b ON c.branch_id = b.id
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.id = $1`,
      [clientId]
    );

    if (cRes.rowCount === 0) {
      throw new Error("Client not found");
    }
    const client = cRes.rows[0];

    // 2. Addresses & Emergency Contacts
    const addresses = (await pool.query("SELECT * FROM client_addresses WHERE client_id = $1", [clientId])).rows;
    const emergencyContacts = (await pool.query("SELECT * FROM client_emergency_contacts WHERE client_id = $1", [clientId])).rows;

    // 3. Appointments
    const appointments = (await pool.query(
      `SELECT a.*, s.name as service_name, s.duration_minutes, s.price,
              p.first_name as practitioner_first_name, p.last_name as practitioner_last_name,
              b.name as branch_name
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       JOIN practitioners p ON a.practitioner_id = p.id
       LEFT JOIN branches b ON a.branch_id = b.id
       WHERE a.client_id = $1
       ORDER BY a.appointment_date DESC, a.start_time DESC`,
      [clientId]
    )).rows;

    // 4. Assessments & Metrics
    const assessments = (await pool.query(
      `SELECT a.*, p.first_name as practitioner_first_name, p.last_name as practitioner_last_name
       FROM wellness_assessments a
       LEFT JOIN practitioners p ON a.practitioner_id = p.id
       WHERE a.client_id = $1
       ORDER BY a.assessment_date DESC, a.created_at DESC`,
      [clientId]
    )).rows;

    // 5. Goals with targets, milestones, and measurements
    const goalsRes = await pool.query(
      `SELECT g.*, gt.name as goal_type_name, gt.target_direction, gt.default_unit,
              p.first_name as practitioner_first_name, p.last_name as practitioner_last_name
       FROM wellness_goals g
       LEFT JOIN goal_types gt ON g.goal_type_id = gt.id
       LEFT JOIN practitioners p ON g.practitioner_id = p.id
       WHERE g.client_id = $1
       ORDER BY g.created_at DESC`,
      [clientId]
    );

    const goals = [];
    for (const g of goalsRes.rows) {
      const targets = (await pool.query("SELECT * FROM goal_targets WHERE goal_id = $1", [g.id])).rows;
      const milestones = (await pool.query("SELECT * FROM goal_milestones WHERE goal_id = $1 ORDER BY sequence_order ASC", [g.id])).rows;
      const measurements = (await pool.query("SELECT * FROM goal_measurements WHERE goal_id = $1 ORDER BY recorded_date ASC", [g.id])).rows;
      goals.push({
        ...g,
        target: targets[0] || null,
        milestones,
        measurements
      });
    }

    // 6. Wellness Plans
    const plans = (await pool.query(
      `SELECT cwp.*, wp.name as plan_name, wp.description as plan_description, wp.duration_weeks,
              p.first_name as practitioner_first_name, p.last_name as practitioner_last_name
       FROM client_wellness_plans cwp
       JOIN wellness_plans wp ON cwp.wellness_plan_id = wp.id
       LEFT JOIN practitioners p ON cwp.practitioner_id = p.id
       WHERE cwp.client_id = $1
       ORDER BY cwp.created_at DESC`,
      [clientId]
    )).rows;

    // 7. Packages
    const packages = (await pool.query(
      `SELECT cp.*, pkg.name as package_name, pkg.description as package_description, pkg.price
       FROM client_packages cp
       JOIN packages pkg ON cp.package_id = pkg.id
       WHERE cp.client_id = $1
       ORDER BY cp.created_at DESC`,
      [clientId]
    )).rows;

    // 8. Memberships
    const memberships = (await pool.query(
      `SELECT cm.*, mp.name as plan_name, mp.tier, mp.benefits_description
       FROM client_memberships cm
       JOIN membership_plans mp ON cm.membership_plan_id = mp.id
       WHERE cm.client_id = $1
       ORDER BY cm.created_at DESC`,
      [clientId]
    )).rows;

    // 9. Product Recommendations
    const recommendations = (await pool.query(
      `SELECT pr.*, prod.name as product_name, prod.price, prod.image_url, prod.sku,
              p.first_name as practitioner_first_name, p.last_name as practitioner_last_name
       FROM product_recommendations pr
       JOIN products prod ON pr.product_id = prod.id
       LEFT JOIN practitioners p ON pr.practitioner_id = p.id
       WHERE pr.client_id = $1
       ORDER BY pr.created_at DESC`,
      [clientId]
    )).rows;

    // 10. Orders
    const orders = (await pool.query(
      `SELECT o.*,
        (SELECT json_agg(json_build_object('id', oi.id, 'product_id', oi.product_id, 'product_name', p.name, 'quantity', oi.quantity, 'unit_price', oi.unit_price, 'total_price', oi.total_price))
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = o.id) as items
       FROM orders o
       WHERE o.client_id = $1
       ORDER BY o.created_at DESC`,
      [clientId]
    )).rows;

    // 11. Invoices
    const invoices = (await pool.query(
      `SELECT inv.*,
        (SELECT json_agg(json_build_object('id', ii.id, 'item_type', ii.item_type, 'description', ii.description, 'quantity', ii.quantity, 'unit_price', ii.unit_price, 'total_amount', ii.total_amount))
         FROM invoice_items ii WHERE ii.invoice_id = inv.id) as items
       FROM invoices inv
       WHERE inv.client_id = $1
       ORDER BY inv.invoice_date DESC`,
      [clientId]
    )).rows;

    // 12. Payments
    const payments = (await pool.query(
      `SELECT pay.*, inv.invoice_number
       FROM payments pay
       LEFT JOIN invoices inv ON pay.invoice_id = inv.id
       WHERE pay.client_id = $1
       ORDER BY pay.payment_date DESC`,
      [clientId]
    )).rows;

    // 13. Activities
    const activities = (await pool.query(
      `SELECT ca.*, am.name as activity_name, am.category
       FROM client_activities ca
       JOIN activity_master am ON ca.activity_id = am.id
       WHERE ca.client_id = $1`,
      [clientId]
    )).rows;

    const activityLogs = (await pool.query(
      `SELECT al.*, am.name as activity_name
       FROM activity_logs al
       JOIN activity_master am ON al.activity_id = am.id
       WHERE al.client_id = $1
       ORDER BY al.log_date DESC LIMIT 30`,
      [clientId]
    )).rows;

    return {
      profile: client,
      addresses,
      emergencyContacts,
      appointments,
      assessments,
      goals,
      plans,
      packages,
      memberships,
      recommendations,
      orders,
      invoices,
      payments,
      activities,
      activityLogs
    };
  },

  async createClient(data, creatorUserId) {
    const conn = await pool.connect();
    try {
      await conn.query("BEGIN");

      const countRes = await conn.query("SELECT COUNT(*) FROM clients");
      const codeNum = String(parseInt(countRes.rows[0].count) + 1).padStart(4, "0");
      const clientCode = `WC-${new Date().getFullYear()}-${codeNum}`;

      let age = data.age || null;
      if (!age && data.dateOfBirth) {
        const birthDate = new Date(data.dateOfBirth);
        const ageDifMs = Date.now() - birthDate.getTime();
        age = Math.abs(new Date(ageDifMs).getUTCFullYear() - 1970);
      }

      const cRes = await conn.query(
        `INSERT INTO clients (
          organization_id, branch_id, client_code, first_name, last_name, date_of_birth, age,
          gender, mobile, email, preferred_language, medical_notes, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          data.organizationId || 1,
          data.branchId || 1,
          clientCode,
          data.firstName,
          data.lastName,
          data.dateOfBirth || null,
          age,
          data.gender || "OTHER",
          data.mobile,
          data.email || null,
          data.preferredLanguage || "English",
          data.medicalNotes || null,
          creatorUserId
        ]
      );
      const newClient = cRes.rows[0];

      if (data.addressLine1 || data.city) {
        await conn.query(
          `INSERT INTO client_addresses (client_id, address_line1, address_line2, city, state, country, pincode, is_primary)
           VALUES ($1, $2, $3, $4, $5, $6, $7, true)`,
          [
            newClient.id,
            data.addressLine1 || "Not specified",
            data.addressLine2 || null,
            data.city || "Bengaluru",
            data.state || "Karnataka",
            data.country || "India",
            data.pincode || "560001"
          ]
        );
      }

      if (data.emergencyContactName && data.emergencyContactMobile) {
        await conn.query(
          `INSERT INTO client_emergency_contacts (client_id, contact_name, relationship, mobile, email)
           VALUES ($1, $2, $3, $4, $5)`,
          [newClient.id, data.emergencyContactName, data.emergencyContactRelationship || "Family", data.emergencyContactMobile, data.emergencyContactEmail || null]
        );
      }

      await conn.query("COMMIT");

      logAudit({
        userId: creatorUserId,
        action: "CLIENT_CREATED",
        module: "CLIENTS",
        entityType: "clients",
        entityId: newClient.id,
        newData: newClient
      });

      return newClient;
    } catch (err) {
      await conn.query("ROLLBACK");
      throw err;
    } finally {
      conn.release();
    }
  },

  async updateClient(clientId, data, updaterUserId) {
    const fields = [];
    const values = [];
    let idx = 1;

    const allowed = [
      "first_name", "last_name", "date_of_birth", "age", "gender",
      "mobile", "email", "preferred_language", "medical_notes", "is_active", "branch_id"
    ];

    const mapping = {
      firstName: "first_name",
      lastName: "last_name",
      dateOfBirth: "date_of_birth",
      age: "age",
      gender: "gender",
      mobile: "mobile",
      email: "email",
      preferredLanguage: "preferred_language",
      medicalNotes: "medical_notes",
      isActive: "is_active",
      branchId: "branch_id"
    };

    for (const [key, col] of Object.entries(mapping)) {
      if (data[key] !== undefined) {
        fields.push(`${col} = $${idx++}`);
        values.push(data[key]);
      }
    }

    if (fields.length === 0) return { id: clientId };

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(clientId);

    const query = `UPDATE clients SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`;
    const res = await pool.query(query, values);

    logAudit({
      userId: updaterUserId,
      action: "CLIENT_UPDATED",
      module: "CLIENTS",
      entityType: "clients",
      entityId: clientId,
      newData: data
    });

    return res.rows[0];
  }
};
