import express from "express";
import { getInvoices, getInvoiceById, createInvoice, recordPayment, processRefund, getPrintableInvoice } from "../controllers/billingController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/invoices", authenticate, getInvoices);
router.post("/invoices", authenticate, authorize("SUPER_ADMIN", "ADMIN", "CENTRE_ADMIN", "MANAGER", "BRANCH_ADMIN", "RECEPTIONIST", "BILLING_STAFF", "ACCOUNTANT"), createInvoice);
router.get("/invoices/:id", authenticate, getInvoiceById);
router.get("/invoices/:id/print", authenticate, getPrintableInvoice);
router.post("/invoices/:id/payments", authenticate, authorize("SUPER_ADMIN", "ADMIN", "CENTRE_ADMIN", "MANAGER", "BRANCH_ADMIN", "RECEPTIONIST", "BILLING_STAFF", "ACCOUNTANT"), recordPayment);
router.post("/refunds", authenticate, authorize("SUPER_ADMIN", "ADMIN", "CENTRE_ADMIN", "MANAGER", "BRANCH_ADMIN", "BILLING_STAFF", "ACCOUNTANT"), processRefund);

export default router;
