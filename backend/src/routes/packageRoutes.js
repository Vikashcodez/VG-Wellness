import express from "express";
import { getPackages, getClientPackages, createPackage, updatePackage } from "../controllers/packageController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authenticate, getPackages);
router.get("/client", authenticate, getClientPackages);
router.post("/", authenticate, authorize("SUPER_ADMIN", "ADMIN", "CENTRE_ADMIN", "BRANCH_ADMIN", "MANAGER"), createPackage);
router.put("/:id", authenticate, authorize("SUPER_ADMIN", "ADMIN", "CENTRE_ADMIN", "BRANCH_ADMIN", "MANAGER"), updatePackage);

export default router;
