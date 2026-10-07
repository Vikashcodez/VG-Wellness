import express from "express";
import { getFinancialOverview, getExpenses, createExpense, getExpenseCategories, createExpenseCategory } from "../controllers/financeController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/overview", authenticate, authorize("SUPER_ADMIN", "ADMIN", "CENTRE_ADMIN", "MANAGER", "BRANCH_ADMIN", "BILLING_STAFF", "ACCOUNTANT"), getFinancialOverview);
router.get("/expenses", authenticate, authorize("SUPER_ADMIN", "ADMIN", "CENTRE_ADMIN", "MANAGER", "BRANCH_ADMIN", "BILLING_STAFF", "ACCOUNTANT"), getExpenses);
router.post("/expenses", authenticate, authorize("SUPER_ADMIN", "ADMIN", "CENTRE_ADMIN", "MANAGER", "BRANCH_ADMIN", "BILLING_STAFF", "ACCOUNTANT"), createExpense);
router.get("/categories", authenticate, getExpenseCategories);
router.post("/categories", authenticate, authorize("SUPER_ADMIN", "ADMIN", "CENTRE_ADMIN", "MANAGER", "BRANCH_ADMIN", "ACCOUNTANT"), createExpenseCategory);

export default router;
