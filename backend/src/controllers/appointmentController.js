import { appointmentService } from "../services/appointmentService.js";
import { getTenantScope } from "../utils/tenantIsolation.js";
import pool from "../config/db.js";

export const getAppointments = async (req, res, next) => {
  try {
    const { practitionerId, clientId, status, dateFrom, dateTo, search } = req.query;
    const { organizationId, branchId } = getTenantScope(req);

    // If client is logged in, restrict to their appointments
    let filterClientId = clientId;
    if (req.user.role === "CLIENT") {
      filterClientId = req.user.clientId;
    }

    const appointments = await appointmentService.getAppointments({
      organizationId,
      branchId,
      practitionerId,
      clientId: filterClientId,
      status,
      dateFrom,
      dateTo,
      search
    });

    res.json({ success: true, data: appointments });
  } catch (error) {
    next(error);
  }
};

export const getQueue = async (req, res, next) => {
  try {
    const { organizationId, branchId } = getTenantScope(req);
    const queue = await appointmentService.getQueueAndCheckInList({ organizationId, branchId });
    res.json({ success: true, data: queue });
  } catch (error) {
    next(error);
  }
};

export const checkAvailability = async (req, res, next) => {
  try {
    const { practitionerId, appointmentDate, startTime, serviceId } = req.query;
    if (!practitionerId || !appointmentDate || !startTime) {
      return res.status(400).json({ success: false, message: "practitionerId, appointmentDate, and startTime are required" });
    }

    let endTime;
    if (serviceId) {
      const s = await pool.query("SELECT duration_minutes FROM services WHERE id = $1", [serviceId]);
      const duration = s.rows[0]?.duration_minutes || 60;
      const [h, m] = startTime.split(":").map(Number);
      const total = h * 60 + m + duration;
      endTime = `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}:00`;
    } else {
      const [h, m] = startTime.split(":").map(Number);
      endTime = `${String(h + 1).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
    }

    const check = await appointmentService.checkSlotAvailability(practitionerId, appointmentDate, startTime, endTime);
    res.json({ success: true, available: check.isAvailable, conflicts: check.conflicts });
  } catch (error) {
    next(error);
  }
};

export const createAppointment = async (req, res, next) => {
  try {
    const { serviceId, practitionerId, appointmentDate, startTime, notes, branchId } = req.body;
    let clientId = req.body.clientId;

    if (req.user.role === "CLIENT") {
      clientId = req.user.clientId;
    }

    if (!clientId || !serviceId || !practitionerId || !appointmentDate || !startTime) {
      return res.status(400).json({
        success: false,
        message: "clientId, serviceId, practitionerId, appointmentDate, and startTime are required"
      });
    }

    const bookingSource = req.user.role === "CLIENT" ? "CLIENT_PORTAL" : (req.body.bookingSource || "RECEPTION");

    const { organizationId, branchId: scopedBranchId } = getTenantScope(req);
    const appointment = await appointmentService.createAppointment({
      clientId,
      organizationId,
      branchId: branchId || scopedBranchId || 1,
      serviceId,
      practitionerId,
      appointmentDate,
      startTime,
      bookingSource,
      notes,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      data: appointment
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateAppointmentStatus = async (req, res, next) => {
  try {
    const appointmentId = parseInt(req.params.id);
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required" });
    }

    const updated = await appointmentService.updateStatus(appointmentId, status, notes, req.user.id);
    res.json({
      success: true,
      message: `Appointment status updated to ${status}`,
      data: updated
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const rescheduleAppointment = async (req, res, next) => {
  try {
    const appointmentId = parseInt(req.params.id);
    const { newDate, newStartTime } = req.body;

    if (!newDate || !newStartTime) {
      return res.status(400).json({ success: false, message: "newDate and newStartTime are required" });
    }

    const updated = await appointmentService.rescheduleAppointment(appointmentId, newDate, newStartTime, req.user.id);
    res.json({
      success: true,
      message: "Appointment rescheduled successfully",
      data: updated
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAppointmentById = async (req, res, next) => {
  try {
    const appointmentId = parseInt(req.params.id);
    const apptRes = await pool.query(
      `SELECT a.*,
              c.first_name as client_first_name, c.last_name as client_last_name, c.mobile as client_mobile, c.email as client_email, c.client_code,
              s.name as service_name, s.duration_minutes, s.price as service_price, s.description as service_description,
              p.first_name as practitioner_first_name, p.last_name as practitioner_last_name, p.qualification, p.mobile as practitioner_mobile,
              b.name as branch_name, b.address as branch_address
       FROM appointments a
       JOIN clients c ON a.client_id = c.id
       JOIN services s ON a.service_id = s.id
       JOIN practitioners p ON a.practitioner_id = p.id
       LEFT JOIN branches b ON a.branch_id = b.id
       WHERE a.id = $1`,
      [appointmentId]
    );

    if (apptRes.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    const appt = apptRes.rows[0];

    // Status history
    const history = (await pool.query(
      `SELECT ash.*, u.first_name, u.last_name
       FROM appointment_status_history ash
       LEFT JOIN users u ON ash.changed_by = u.id
       WHERE ash.appointment_id = $1
       ORDER BY ash.created_at DESC`,
      [appointmentId]
    )).rows;

    res.json({
      success: true,
      data: {
        ...appt,
        statusHistory: history
      }
    });
  } catch (error) {
    next(error);
  }
};
