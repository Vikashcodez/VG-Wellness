import express from "express";
import { getServices, getCategories, createCategory, createService, updateService, deleteService } from "../controllers/serviceController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/categories", authenticate, getCategories);
router.post("/categories", authenticate, authorize("SUPER_ADMIN", "ADMIN", "CENTRE_ADMIN", "BRANCH_ADMIN", "MANAGER"), createCategory);
router.get("/", authenticate, getServices);
router.post("/", authenticate, authorize("SUPER_ADMIN", "ADMIN", "CENTRE_ADMIN", "BRANCH_ADMIN", "MANAGER"), createService);
router.put("/:id", authenticate, authorize("SUPER_ADMIN", "ADMIN", "CENTRE_ADMIN", "BRANCH_ADMIN", "MANAGER"), updateService);
router.delete("/:id", authenticate, authorize("SUPER_ADMIN", "ADMIN", "CENTRE_ADMIN", "BRANCH_ADMIN"), deleteService);

export default router;
