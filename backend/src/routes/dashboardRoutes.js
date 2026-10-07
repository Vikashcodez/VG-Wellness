import express from "express";
import { getAdminDashboard, getClientDashboard } from "../controllers/dashboardController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/admin", authenticate, authorize("SUPER_ADMIN", "ADMIN", "MANAGER", "RECEPTIONIST", "PRACTITIONER", "NUTRITIONIST", "THERAPIST", "BILLING_STAFF", "INVENTORY_STAFF"), getAdminDashboard);
router.get("/client", authenticate, getClientDashboard);

export default router;
