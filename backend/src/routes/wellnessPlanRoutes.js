import express from "express";
import { getWellnessPlans, getWellnessPlanById, assignPlanToClient } from "../controllers/wellnessPlanController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authenticate, getWellnessPlans);
router.get("/:id", authenticate, getWellnessPlanById);
router.post("/assign", authenticate, authorize("SUPER_ADMIN", "ADMIN", "PRACTITIONER", "NUTRITIONIST"), assignPlanToClient);

export default router;
