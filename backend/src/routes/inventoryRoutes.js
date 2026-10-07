import express from "express";
import { getStock, adjustStock, getTransactions, getSuppliers } from "../controllers/inventoryController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/stock", authenticate, authorize("SUPER_ADMIN", "ADMIN", "MANAGER", "INVENTORY_STAFF"), getStock);
router.post("/adjust", authenticate, authorize("SUPER_ADMIN", "ADMIN", "INVENTORY_STAFF"), adjustStock);
router.get("/transactions", authenticate, authorize("SUPER_ADMIN", "ADMIN", "INVENTORY_STAFF"), getTransactions);
router.get("/suppliers", authenticate, authorize("SUPER_ADMIN", "ADMIN", "INVENTORY_STAFF"), getSuppliers);

export default router;
