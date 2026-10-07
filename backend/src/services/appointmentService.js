import pool from "../config/db.js";
import { logAudit } from "../middleware/auditLogger.js";

export const appointmentService = {
  async checkSlotAvailability(practitionerId, appointmentDate, startTime, endTime, excludeAppointmentId = null) {
    let query = `
      SELECT id, appointment_number, appointment_date, start_time, end_time, status
      FROM appointments
      WHERE practitioner_id = $1
        AND appointment_date = $2
        AND status NOT IN ('CANCELLED', 'NO_SHOW')
        AND (
          (start_time <= $3 AND end_time > $3)
          OR (start_time < $4 AND end_time >= $4)
          OR (start_time >= $3 AND end_time <= $4)
        )
    `;
    const params = [practitionerId, appointmentDate, startTime, endTime];

    if (excludeAppointmentId) {
      params.push(excludeAppointmentId);
      query += ` AND id != $${params.length}`;
    }

    const res = await pool.query(query, params);
    return {
      isAvailable: res.rowCount === 0,
      conflicts: res.rows
    };
  },

  async createAppointment({
    clientId,
    branchId = 1,
    serviceId,
    practitionerId,
    appointmentDate,
    startTime,
    bookingSource = "CLIENT_PORTAL",
    notes = null,
    createdBy = null
  }) {
    // 1. Fetch service to determine duration
    const sRes = await pool.query("SELECT duration_minutes, name, price FROM services WHERE id = $1", [serviceId]);
    if (sRes.rowCount === 0) {
      throw new Error("Selected service does not exist");
    }
    const service = sRes.rows[0];

    // Calculate end time
    const [startH, startM] = startTime.split(":").map(Number);
    const startTotalMins = startH * 60 + startM;
    const endTotalMins = startTotalMins + (service.duration_minutes || 60);
    const endH = String(Math.floor(endTotalMins / 60)).padStart(2, "0");
    const endM = String(endTotalMins % 60).padStart(2, "0");
    const endTime = `${endH}:${endM}:00`;

    // 2. Check Practitioner availability & slot conflict
    const availability = await this.checkSlotAvailability(practitionerId, appointmentDate, startTime, endTime);
    if (!availability.isAvailable) {
      throw new Error(`The practitioner is already booked for another session at this time (${startTime} - ${endTime}). Please select a different slot.`);
    }

    const clientConn = await pool.connect();
    try {
      await clientConn.query("BEGIN");

      // Generate Appointment Number: APT-YYYY-XXXX
      const countRes = await clientConn.query("SELECT COUNT(*) FROM appointments");
      const apptNum = `APT-${new Date().getFullYear()}-${String(parseInt(countRes.rows[0].count) + 1).padStart(4, "0")}`;

      const insertRes = await clientConn.query(
        `INSERT INTO appointments (
          appointment_number, organization_id, client_id, branch_id, service_id, practitioner_id,
          appointment_date, start_time, end_time, status, booking_source, notes, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'BOOKED', $10, $11, $12)
        RETURNING *`,
        [
          apptNum,
          branchId ? (await clientConn.query("SELECT organization_id FROM branches WHERE id = $1", [branchId])).rows[0]?.organization_id || 1 : 1,
          clientId,
          branchId,
          serviceId,
          practitionerId,
          appointmentDate,
          startTime,
          endTime,
          bookingSource,
          notes,
          createdBy
        ]
      );
      const newAppt = insertRes.rows[0];

      // Add to status history
      await clientConn.query(
        `INSERT INTO appointment_status_history (appointment_id, status, notes, changed_by)
         VALUES ($1, 'BOOKED', 'Initial appointment booked', $2)`,
        [newAppt.id, createdBy]
      );

      // Notification for client
      const clientUserRes = await clientConn.query("SELECT user_id, first_name FROM clients WHERE id = $1", [clientId]);
      if (clientUserRes.rowCount > 0 && clientUserRes.rows[0].user_id) {
        await clientConn.query(
          `INSERT INTO notifications (user_id, client_id, title, message, type, link)
           VALUES ($1, $2, 'Appointment Confirmed', $3, 'INFO', '/appointments')`,
          [
            clientUserRes.rows[0].user_id,
            clientId,
            `Your appointment for ${service.name} is scheduled on ${appointmentDate} at ${startTime}.`
          ]
        );
      }

      await clientConn.query("COMMIT");

      logAudit({
        userId: createdBy,
        action: "APPOINTMENT_CREATED",
        module: "APPOINTMENTS",
        entityType: "appointments",
        entityId: newAppt.id,
        newData: newAppt
      });

      return newAppt;
    } catch (err) {
      await clientConn.query("ROLLBACK");
      throw err;
    } finally {
      clientConn.release();
    }
  },

  async updateStatus(appointmentId, status, notes = null, userId = null) {
    const validStatuses = [
      "BOOKED", "CONFIRMED", "CHECKED_IN", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW", "RESCHEDULED"
    ];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    const apptRes = await pool.query("SELECT * FROM appointments WHERE id = $1", [appointmentId]);
    if (apptRes.rowCount === 0) {
      throw new Error("Appointment not found");
    }
    const oldAppt = apptRes.rows[0];

    const updated = (await pool.query(
      `UPDATE appointments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [status, appointmentId]
    )).rows[0];

    await pool.query(
      `INSERT INTO appointment_status_history (appointment_id, status, notes, changed_by)
       VALUES ($1, $2, $3, $4)`,
      [appointmentId, status, notes || `Status changed from ${oldAppt.status} to ${status}`, userId]
    );

    logAudit({
      userId,
      action: `APPOINTMENT_${status}`,
      module: "APPOINTMENTS",
      entityType: "appointments",
      entityId: appointmentId,
      oldData: { status: oldAppt.status },
      newData: { status }
    });

    return updated;
  },

  async rescheduleAppointment(appointmentId, newDate, newStartTime, userId = null) {
    const apptRes = await pool.query("SELECT * FROM appointments WHERE id = $1", [appointmentId]);
    if (apptRes.rowCount === 0) {
      throw new Error("Appointment not found");
    }
    const appt = apptRes.rows[0];

    // Compute new end time based on original duration
    const sRes = await pool.query("SELECT duration_minutes FROM services WHERE id = $1", [appt.service_id]);
    const duration = sRes.rows[0]?.duration_minutes || 60;

    const [startH, startM] = newStartTime.split(":").map(Number);
    const endTotalMins = startH * 60 + startM + duration;
    const newEndTime = `${String(Math.floor(endTotalMins / 60)).padStart(2, "0")}:${String(endTotalMins % 60).padStart(2, "0")}:00`;

    // Check conflict
    const availability = await this.checkSlotAvailability(appt.practitioner_id, newDate, newStartTime, newEndTime, appointmentId);
    if (!availability.isAvailable) {
      throw new Error("Practitioner has a conflicting booking for the selected reschedule time slot.");
    }

    const updated = (await pool.query(
      `UPDATE appointments
       SET appointment_date = $1, start_time = $2, end_time = $3, status = 'RESCHEDULED', updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [newDate, newStartTime, newEndTime, appointmentId]
    )).rows[0];

    await pool.query(
      `INSERT INTO appointment_status_history (appointment_id, status, notes, changed_by)
       VALUES ($1, 'RESCHEDULED', $2, $3)`,
      [appointmentId, `Rescheduled to ${newDate} at ${newStartTime}`, userId]
    );

    return updated;
  },

  async getAppointments({ organizationId, branchId, practitionerId, clientId, status, dateFrom, dateTo, search }) {
    let query = `
      SELECT a.*,
             c.first_name as client_first_name, c.last_name as client_last_name, c.mobile as client_mobile, c.client_code,
             s.name as service_name, s.duration_minutes, s.price as service_price,
             p.first_name as practitioner_first_name, p.last_name as practitioner_last_name,
             b.name as branch_name, o.name as organization_name
      FROM appointments a
      JOIN clients c ON a.client_id = c.id
      JOIN services s ON a.service_id = s.id
      JOIN practitioners p ON a.practitioner_id = p.id
      LEFT JOIN branches b ON a.branch_id = b.id
      LEFT JOIN organizations o ON a.organization_id = o.id
      WHERE 1=1
    `;
    const params = [];

    if (organizationId) {
      params.push(organizationId);
      query += ` AND a.organization_id = $${params.length}`;
    }
    if (branchId) {
      params.push(branchId);
      query += ` AND a.branch_id = $${params.length}`;
    }
    if (practitionerId) {
      params.push(practitionerId);
      query += ` AND a.practitioner_id = $${params.length}`;
    }
    if (clientId) {
      params.push(clientId);
      query += ` AND a.client_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND a.status = $${params.length}`;
    }
    if (dateFrom) {
      params.push(dateFrom);
      query += ` AND a.appointment_date >= $${params.length}`;
    }
    if (dateTo) {
      params.push(dateTo);
      query += ` AND a.appointment_date <= $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (c.first_name ILIKE $${params.length} OR c.last_name ILIKE $${params.length} OR a.appointment_number ILIKE $${params.length} OR s.name ILIKE $${params.length})`;
    }

    query += ` ORDER BY a.appointment_date ASC, a.start_time ASC`;

    const res = await pool.query(query, params);
    return res.rows;
  },

  async getQueueAndCheckInList({ organizationId, branchId }) {
    const today = new Date().toISOString().split("T")[0];
    let query = `
      SELECT a.*,
             c.first_name as client_first_name, c.last_name as client_last_name, c.mobile as client_mobile, c.client_code,
             s.name as service_name, s.duration_minutes,
             p.first_name as practitioner_first_name, p.last_name as practitioner_last_name
      FROM appointments a
      JOIN clients c ON a.client_id = c.id
      JOIN services s ON a.service_id = s.id
      JOIN practitioners p ON a.practitioner_id = p.id
      WHERE a.appointment_date = $1
        AND a.status IN ('BOOKED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS')
    `;
    const params = [today];

    if (organizationId) {
      params.push(organizationId);
      query += ` AND a.organization_id = $${params.length}`;
    }
    if (branchId) {
      params.push(branchId);
      query += ` AND a.branch_id = $${params.length}`;
    }

    query += `
      ORDER BY
        CASE
          WHEN a.status = 'IN_PROGRESS' THEN 1
          WHEN a.status = 'CHECKED_IN' THEN 2
          WHEN a.status = 'CONFIRMED' THEN 3
          ELSE 4
        END,
        a.start_time ASC
    `;

    const res = await pool.query(query, params);
    return res.rows;
  }
};
