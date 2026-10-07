import express from "express";
import { getMembershipPlans, getClientMemberships } from "../controllers/packageController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authenticate, getMembershipPlans);
router.get("/client", authenticate, getClientMemberships);

export default router;
