import express from "express";
import { getAssessments, createAssessment } from "../controllers/assessmentController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authenticate, getAssessments);
router.post("/", authenticate, authorize("SUPER_ADMIN", "ADMIN", "PRACTITIONER", "NUTRITIONIST", "THERAPIST"), createAssessment);

export default router;
