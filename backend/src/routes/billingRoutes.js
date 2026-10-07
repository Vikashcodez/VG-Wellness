import express from "express";
import { getInvoices, getInvoiceById, createInvoice, recordPayment, processRefund } from "../controllers/billingController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/invoices", authenticate, getInvoices);
router.post("/invoices", authenticate, authorize("SUPER_ADMIN", "ADMIN", "MANAGER", "RECEPTIONIST", "BILLING_STAFF"), createInvoice);
router.get("/invoices/:id", authenticate, getInvoiceById);
router.post("/invoices/:id/payments", authenticate, authorize("SUPER_ADMIN", "ADMIN", "MANAGER", "RECEPTIONIST", "BILLING_STAFF"), recordPayment);
router.post("/refunds", authenticate, authorize("SUPER_ADMIN", "ADMIN", "MANAGER", "BILLING_STAFF"), processRefund);

export default router;
