import bcrypt from "bcryptjs";
import pool from "../config/db.js";
import { logAudit } from "../middleware/auditLogger.js";

export const employeeService = {
  async getEmployees({ organizationId, branchId, department, status, search }) {
    let query = `
      SELECT e.*, 
             b.name as branch_name, 
             o.name as organization_name,
             r.name as role_name,
             u.email as account_email,
             u.id as account_user_id
      FROM employees e
      LEFT JOIN branches b ON e.branch_id = b.id
      LEFT JOIN organizations o ON e.organization_id = o.id
      LEFT JOIN users u ON e.user_id = u.id
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE 1=1
    `;
    const params = [];

    if (organizationId) {
      params.push(organizationId);
      query += ` AND e.organization_id = $${params.length}`;
    }
    if (branchId) {
      params.push(branchId);
      query += ` AND e.branch_id = $${params.length}`;
    }
    if (department) {
      params.push(department);
      query += ` AND e.department = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND e.status = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (e.first_name ILIKE $${params.length} OR e.last_name ILIKE $${params.length} OR e.employee_code ILIKE $${params.length} OR e.email ILIKE $${params.length} OR e.designation ILIKE $${params.length})`;
    }

    query += ` ORDER BY e.created_at DESC`;
    const res = await pool.query(query, params);
    return res.rows;
  },

  async getEmployeeById(id) {
    const res = await pool.query(
      `SELECT e.*, 
              b.name as branch_name, 
              o.name as organization_name,
              r.name as role_name,
              u.email as account_email,
              u.id as account_user_id
       FROM employees e
       LEFT JOIN branches b ON e.branch_id = b.id
       LEFT JOIN organizations o ON e.organization_id = o.id
       LEFT JOIN users u ON e.user_id = u.id
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE e.id = $1`,
      [id]
    );
    if (res.rowCount === 0) throw new Error("Employee not found");
    return res.rows[0];
  },

  async createEmployee(data, creatorUserId) {
    const {
      organizationId = 1, branchId = 1, employeeCode,
      firstName, lastName, email, phone, department, designation,
      joiningDate, salary, emergencyContact, address,
      password, roleName, permissions = []
    } = data;

    if (!firstName || !lastName || !email || !department || !designation) {
      throw new Error("First Name, Last Name, Email, Department, and Designation are required");
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Auto-generate code if not provided
      let code = employeeCode;
      if (!code) {
        const countRes = await client.query("SELECT COUNT(*) FROM employees");
        code = `EMP-${String(parseInt(countRes.rows[0].count) + 1).padStart(3, "0")}`;
      }

      // Determine appropriate user role
      let finalRoleName = roleName;
      if (!finalRoleName) {
        switch (department) {
          case "CLINICAL":
            finalRoleName = "PRACTITIONER";
            break;
          case "THERAPY":
            finalRoleName = "THERAPIST";
            break;
          case "FRONT_OFFICE":
            finalRoleName = "RECEPTIONIST";
            break;
          case "ACCOUNTS":
            finalRoleName = "BILLING_STAFF";
            break;
          case "INVENTORY":
            finalRoleName = "INVENTORY_STAFF";
            break;
          case "MANAGEMENT":
            finalRoleName = "MANAGER";
            break;
          default:
            finalRoleName = "EMPLOYEE";
        }
      }

      // Check role id
      const roleRes = await client.query("SELECT id FROM roles WHERE name = $1 LIMIT 1", [finalRoleName]);
      const roleId = roleRes.rowCount > 0 ? roleRes.rows[0].id : 14; // Default to EMPLOYEE

      // Check if user account exists
      let userId = null;
      const existingUser = await client.query("SELECT id FROM users WHERE LOWER(email) = LOWER($1)", [email]);
      
      const empPassword = password && password.trim().length >= 6 ? password : "Staff@123";
      const hashedPassword = await bcrypt.hash(empPassword, 10);

      const jsonPermissions = JSON.stringify(Array.isArray(permissions) ? permissions : []);

      if (existingUser.rowCount > 0) {
        userId = existingUser.rows[0].id;
        // Update permissions & branch/org
        await client.query(
          `UPDATE users 
           SET permissions = $1, organization_id = $2, branch_id = $3, role_id = $4
           WHERE id = $5`,
          [jsonPermissions, organizationId, branchId, roleId, userId]
        );
      } else {
        // Create user login account
        const newUserRes = await client.query(
          `INSERT INTO users (
            organization_id, branch_id, first_name, last_name, email,
            password_hash, phone, role_id, is_active, permissions
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9)
          RETURNING id`,
          [
            organizationId, branchId, firstName, lastName, email.toLowerCase().trim(),
            hashedPassword, phone || "", roleId, jsonPermissions
          ]
        );
        userId = newUserRes.rows[0].id;
      }

      // Create employee record linked to user_id
      const empRes = await client.query(
        `INSERT INTO employees (
          organization_id, branch_id, user_id, employee_code, first_name, last_name,
          email, phone, department, designation, joining_date, salary,
          status, emergency_contact, address, permissions
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'ACTIVE', $13, $14, $15)
        RETURNING *`,
        [
          organizationId, branchId, userId, code, firstName, lastName,
          email.toLowerCase().trim(), phone || "", department, designation,
          joiningDate || new Date().toISOString().split("T")[0],
          salary || 0.00, emergencyContact || null, address || null,
          jsonPermissions
        ]
      );

      // If clinical/practitioner role, also ensure practitioners record
      if (["PRACTITIONER", "THERAPIST", "NUTRITIONIST"].includes(finalRoleName)) {
        await client.query(
          `INSERT INTO practitioners (
            user_id, organization_id, branch_id, first_name, last_name, email, mobile,
            qualification, specialization, license_number, bio, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'ACTIVE')
          ON CONFLICT DO NOTHING`,
          [
            userId, organizationId, branchId, firstName, lastName,
            email.toLowerCase().trim(), phone || "9876543210",
            designation, designation,
            `LIC-${code}`, `${designation} at ${department}`
          ]
        );
      }

      await client.query("COMMIT");

      logAudit({
        userId: creatorUserId,
        action: "EMPLOYEE_CREATED",
        module: "EMPLOYEES",
        entityType: "employees",
        entityId: empRes.rows[0].id,
        newData: { ...empRes.rows[0], role: finalRoleName }
      });

      return {
        ...empRes.rows[0],
        user_id: userId,
        role_name: finalRoleName
      };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },

  async updateEmployee(id, data, updaterUserId) {
    const {
      branchId, firstName, lastName, email, phone, department, designation,
      salary, status, emergencyContact, address, roleName, password
    } = data;

    const res = await pool.query(
      `UPDATE employees
       SET branch_id = COALESCE($1, branch_id),
           first_name = COALESCE($2, first_name),
           last_name = COALESCE($3, last_name),
           email = COALESCE($4, email),
           phone = COALESCE($5, phone),
           department = COALESCE($6, department),
           designation = COALESCE($7, designation),
           salary = COALESCE($8, salary),
           status = COALESCE($9, status),
           emergency_contact = COALESCE($10, emergency_contact),
           address = COALESCE($11, address),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $12
       RETURNING *`,
      [branchId, firstName, lastName, email, phone, department, designation, salary, status, emergencyContact, address, id]
    );

    if (res.rowCount === 0) throw new Error("Employee not found");
    const updatedEmp = res.rows[0];

    // Sync to linked user or create user if missing
    let userId = updatedEmp.user_id;
    if (userId) {
      const updates = [];
      const userParams = [];

      if (firstName) { userParams.push(firstName); updates.push(`first_name = $${userParams.length}`); }
      if (lastName) { userParams.push(lastName); updates.push(`last_name = $${userParams.length}`); }
      if (email) { userParams.push(email.toLowerCase().trim()); updates.push(`email = $${userParams.length}`); }
      if (phone !== undefined) { userParams.push(phone); updates.push(`phone = $${userParams.length}`); }
      if (status) { userParams.push(status === "ACTIVE"); updates.push(`is_active = $${userParams.length}`); }
      if (branchId) { userParams.push(branchId); updates.push(`branch_id = $${userParams.length}`); }

      if (roleName) {
        const roleRes = await pool.query("SELECT id FROM roles WHERE name = $1 LIMIT 1", [roleName]);
        if (roleRes.rowCount > 0) {
          userParams.push(roleRes.rows[0].id);
          updates.push(`role_id = $${userParams.length}`);
        }
      }

      if (password && password.trim().length >= 6) {
        const hashed = await bcrypt.hash(password.trim(), 10);
        userParams.push(hashed);
        updates.push(`password_hash = $${userParams.length}`);
      }

      if (updates.length > 0) {
        userParams.push(userId);
        await pool.query(
          `UPDATE users SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = $${userParams.length}`,
          userParams
        );
      }
    }

    logAudit({
      userId: updaterUserId,
      action: "EMPLOYEE_UPDATED",
      module: "EMPLOYEES",
      entityType: "employees",
      entityId: id,
      newData: data
    });

    return updatedEmp;
  },

  async updatePermissions(id, permissions, updaterUserId) {
    const jsonPermissions = JSON.stringify(Array.isArray(permissions) ? permissions : []);
    
    // Fetch employee
    const checkRes = await pool.query("SELECT * FROM employees WHERE id = $1", [id]);
    if (checkRes.rowCount === 0) throw new Error("Employee not found");
    const emp = checkRes.rows[0];

    let linkedUserId = emp.user_id;
    if (!linkedUserId) {
      // Check if user account with employee's email exists
      const userCheck = await pool.query("SELECT id FROM users WHERE LOWER(email) = LOWER($1)", [emp.email]);
      if (userCheck.rowCount > 0) {
        linkedUserId = userCheck.rows[0].id;
      } else {
        // Create user login account with default password Staff@123
        const hashedPassword = await bcrypt.hash("Staff@123", 10);
        let roleName = "EMPLOYEE";
        if (emp.department === "CLINICAL") roleName = "PRACTITIONER";
        else if (emp.department === "THERAPY") roleName = "THERAPIST";
        else if (emp.department === "FRONT_OFFICE") roleName = "RECEPTIONIST";
        else if (emp.department === "ACCOUNTS") roleName = "BILLING_STAFF";
        else if (emp.department === "INVENTORY") roleName = "INVENTORY_STAFF";
        else if (emp.department === "MANAGEMENT") roleName = "MANAGER";

        const roleRes = await pool.query("SELECT id FROM roles WHERE name = $1 LIMIT 1", [roleName]);
        const roleId = roleRes.rowCount > 0 ? roleRes.rows[0].id : 14;

        const newUser = await pool.query(
          `INSERT INTO users (
            organization_id, branch_id, first_name, last_name, email,
            password_hash, phone, role_id, is_active, permissions
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9)
          RETURNING id`,
          [
            emp.organization_id || 1, emp.branch_id || 1,
            emp.first_name, emp.last_name, emp.email.toLowerCase().trim(),
            hashedPassword, emp.phone || "", roleId, jsonPermissions
          ]
        );
        linkedUserId = newUser.rows[0].id;
      }

      await pool.query("UPDATE employees SET user_id = $1 WHERE id = $2", [linkedUserId, id]);
    }

    // Update employee record
    await pool.query(
      `UPDATE employees 
       SET permissions = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [jsonPermissions, id]
    );

    // If linked to user, update user permissions as well
    if (linkedUserId) {
      await pool.query(
        `UPDATE users SET permissions = $1 WHERE id = $2`,
        [jsonPermissions, linkedUserId]
      );
    }

    logAudit({
      userId: updaterUserId,
      action: "EMPLOYEE_PERMISSIONS_UPDATED",
      module: "EMPLOYEES",
      entityType: "employees",
      entityId: id,
      newData: { permissions, linkedUserId }
    });

    return {
      employeeId: id,
      userId: linkedUserId,
      permissions
    };
  },

  async deleteEmployee(id, deleterUserId) {
    const res = await pool.query("UPDATE employees SET status = 'INACTIVE' WHERE id = $1 RETURNING *", [id]);
    logAudit({
      userId: deleterUserId,
      action: "EMPLOYEE_DEACTIVATED",
      module: "EMPLOYEES",
      entityType: "employees",
      entityId: id
    });
    return res.rows[0];
  }
};
