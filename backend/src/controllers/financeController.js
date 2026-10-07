import { financeService } from "../services/financeService.js";
import { getTenantScope } from "../utils/tenantIsolation.js";

export const getFinancialOverview = async (req, res, next) => {
  try {
    const { organizationId, branchId } = getTenantScope(req);
    const overview = await financeService.getFinancialOverview({
      organizationId: organizationId || 1,
      branchId
    });
    res.json({ success: true, data: overview });
  } catch (error) {
    next(error);
  }
};

export const getExpenses = async (req, res, next) => {
  try {
    const { categoryId, dateFrom, dateTo, search } = req.query;
    const { organizationId, branchId } = getTenantScope(req);
    const expenses = await financeService.getExpenses({
      organizationId: organizationId || 1,
      branchId,
      categoryId: categoryId ? parseInt(categoryId) : null,
      dateFrom,
      dateTo,
      search
    });
    res.json({ success: true, data: expenses });
  } catch (error) {
    next(error);
  }
};

export const createExpense = async (req, res, next) => {
  try {
    const { organizationId, branchId } = getTenantScope(req);
    const expense = await financeService.createExpense({
      ...req.body,
      organizationId: req.body.organizationId || organizationId || 1,
      branchId: req.body.branchId || branchId || 1
    }, req.user.id);
    res.status(201).json({ success: true, message: "Expense recorded successfully", data: expense });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getExpenseCategories = async (req, res, next) => {
  try {
    const { organizationId } = getTenantScope(req);
    const categories = await financeService.getExpenseCategories(organizationId || 1);
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

export const createExpenseCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const { organizationId } = getTenantScope(req);
    const category = await financeService.createExpenseCategory(name, description, req.body.organizationId || organizationId || 1);
    res.status(201).json({ success: true, message: "Expense category created", data: category });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
