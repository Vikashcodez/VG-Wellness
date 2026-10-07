import express from "express";
import {
  getGoalMeta, getGoals, getGoalById, createGoal, recordMeasurement, updateMilestone
} from "../controllers/goalController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/meta", authenticate, getGoalMeta);
router.get("/", authenticate, getGoals);
router.post("/", authenticate, createGoal);
router.get("/:id", authenticate, getGoalById);
router.post("/:id/measurements", authenticate, recordMeasurement);
router.patch("/:id/milestones/:milestoneId", authenticate, updateMilestone);

export default router;
