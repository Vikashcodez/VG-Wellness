import express from "express";
import { getCentres, getCentreById, createCentre, updateCentre, createBranch, getPlatformMetrics, getMyCentre } from "../controllers/saasController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/metrics", authenticate, authorize("SUPER_ADMIN"), getPlatformMetrics);
router.get("/my-centre", authenticate, authorize("SUPER_ADMIN", "ADMIN", "CENTRE_ADMIN"), getMyCentre);
router.get("/centres", authenticate, authorize("SUPER_ADMIN", "ADMIN", "CENTRE_ADMIN"), getCentres);
router.post("/centres", authenticate, authorize("SUPER_ADMIN"), createCentre);
router.get("/centres/:id", authenticate, authorize("SUPER_ADMIN", "ADMIN", "CENTRE_ADMIN"), getCentreById);
router.put("/centres/:id", authenticate, authorize("SUPER_ADMIN", "ADMIN"), updateCentre);
router.post("/centres/:id/branches", authenticate, authorize("SUPER_ADMIN", "ADMIN", "CENTRE_ADMIN"), createBranch);

export default router;
