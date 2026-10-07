import express from "express";
import { checkout, getOrders, getOrderById, updateOrderStatus } from "../controllers/orderController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/checkout", authenticate, checkout);
router.get("/", authenticate, getOrders);
router.get("/:id", authenticate, getOrderById);
router.patch("/:id/status", authenticate, authorize("SUPER_ADMIN", "ADMIN", "CENTRE_ADMIN", "BRANCH_ADMIN", "MANAGER", "INVENTORY_STAFF"), updateOrderStatus);

export default router;
