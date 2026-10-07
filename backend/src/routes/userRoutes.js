import express from "express";
import { getUsers, getRoles, getAuditLogs } from "../controllers/userController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/roles", authenticate, getRoles);
router.get("/audit-logs", authenticate, authorize("SUPER_ADMIN", "ADMIN", "MANAGER"), getAuditLogs);
router.get("/", authenticate, authorize("SUPER_ADMIN", "ADMIN", "MANAGER"), getUsers);

export default router;
