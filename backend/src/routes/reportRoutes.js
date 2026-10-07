import express from "express";
import { getReports } from "../controllers/reportController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authenticate, authorize("SUPER_ADMIN", "ADMIN", "MANAGER", "BILLING_STAFF"), getReports);

export default router;
