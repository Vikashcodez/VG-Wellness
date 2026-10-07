import express from "express";
import {
  getStock, adjustStock, getTransactions, getSuppliers,
  createSupplier, updateSupplier, deleteSupplier,
  createGRN, getGRNs, getGRNById
} from "../controllers/inventoryController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/stock", authenticate, authorize("SUPER_ADMIN", "ADMIN", "CENTRE_ADMIN", "BRANCH_ADMIN", "MANAGER", "INVENTORY_STAFF"), getStock);
router.post("/adjust", authenticate, authorize("SUPER_ADMIN", "ADMIN", "CENTRE_ADMIN", "BRANCH_ADMIN", "INVENTORY_STAFF"), adjustStock);
router.get("/transactions", authenticate, authorize("SUPER_ADMIN", "ADMIN", "CENTRE_ADMIN", "BRANCH_ADMIN", "INVENTORY_STAFF"), getTransactions);

// Suppliers Master
router.get("/suppliers", authenticate, authorize("SUPER_ADMIN", "ADMIN", "CENTRE_ADMIN", "BRANCH_ADMIN", "INVENTORY_STAFF", "MANAGER"), getSuppliers);
router.post("/suppliers", authenticate, authorize("SUPER_ADMIN", "ADMIN", "CENTRE_ADMIN", "BRANCH_ADMIN", "INVENTORY_STAFF"), createSupplier);
router.put("/suppliers/:id", authenticate, authorize("SUPER_ADMIN", "ADMIN", "CENTRE_ADMIN", "BRANCH_ADMIN", "INVENTORY_STAFF"), updateSupplier);
router.delete("/suppliers/:id", authenticate, authorize("SUPER_ADMIN", "ADMIN", "CENTRE_ADMIN", "BRANCH_ADMIN"), deleteSupplier);

// Goods Receipt Note (GRN) Inward
router.get("/grn", authenticate, authorize("SUPER_ADMIN", "ADMIN", "CENTRE_ADMIN", "BRANCH_ADMIN", "INVENTORY_STAFF", "MANAGER"), getGRNs);
router.get("/grn/:id", authenticate, authorize("SUPER_ADMIN", "ADMIN", "CENTRE_ADMIN", "BRANCH_ADMIN", "INVENTORY_STAFF", "MANAGER"), getGRNById);
router.post("/grn", authenticate, authorize("SUPER_ADMIN", "ADMIN", "CENTRE_ADMIN", "BRANCH_ADMIN", "INVENTORY_STAFF"), createGRN);

export default router;
