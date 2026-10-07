import express from "express";
import {
  getAppointments, getAppointmentById, createAppointment, updateAppointmentStatus,
  rescheduleAppointment, checkAvailability, getQueue
} from "../controllers/appointmentController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/availability", authenticate, checkAvailability);
router.get("/queue", authenticate, authorize("SUPER_ADMIN", "ADMIN", "MANAGER", "RECEPTIONIST", "PRACTITIONER", "NUTRITIONIST", "THERAPIST"), getQueue);

router.get("/", authenticate, getAppointments);
router.post("/", authenticate, createAppointment);
router.get("/:id", authenticate, getAppointmentById);
router.patch("/:id/status", authenticate, updateAppointmentStatus);
router.patch("/:id/reschedule", authenticate, rescheduleAppointment);

export default router;
