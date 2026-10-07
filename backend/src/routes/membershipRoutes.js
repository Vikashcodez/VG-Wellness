import express from "express";
import { getMembershipPlans, getClientMemberships, createMembershipPlan, updateMembershipPlan } from "../controllers/packageController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authenticate, getMembershipPlans);
router.get("/client", authenticate, getClientMemberships);
router.post("/", authenticate, authorize("SUPER_ADMIN", "ADMIN", "CENTRE_ADMIN", "BRANCH_ADMIN", "MANAGER"), createMembershipPlan);
router.put("/:id", authenticate, authorize("SUPER_ADMIN", "ADMIN", "CENTRE_ADMIN", "BRANCH_ADMIN", "MANAGER"), updateMembershipPlan);

export default router;
