import express from "express";
import { getAssets, getAssetById, createAsset, updateAsset, addMaintenanceLog } from "../controllers/assetController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authenticate, getAssets);
router.get("/:id", authenticate, getAssetById);
router.post("/", authenticate, authorize("SUPER_ADMIN", "ADMIN", "CENTRE_ADMIN", "MANAGER", "BRANCH_ADMIN", "INVENTORY_STAFF"), createAsset);
router.put("/:id", authenticate, authorize("SUPER_ADMIN", "ADMIN", "CENTRE_ADMIN", "MANAGER", "BRANCH_ADMIN", "INVENTORY_STAFF"), updateAsset);
router.post("/:id/maintenance", authenticate, authorize("SUPER_ADMIN", "ADMIN", "CENTRE_ADMIN", "MANAGER", "BRANCH_ADMIN", "INVENTORY_STAFF"), addMaintenanceLog);

export default router;
