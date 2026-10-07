import { inventoryService } from "../services/inventoryService.js";

export const getStock = async (req, res, next) => {
  try {
    const { branchId, search, lowStock } = req.query;
    const stock = await inventoryService.getStockList({
      branchId: branchId ? parseInt(branchId) : 1,
      search,
      lowStockOnly: lowStock === "true"
    });
    res.json({ success: true, data: stock });
  } catch (error) {
    next(error);
  }
};

export const adjustStock = async (req, res, next) => {
  try {
    const { branchId, productId, adjustmentType, quantity, reason } = req.body;
    if (!productId || !adjustmentType || !quantity || !reason) {
      return res.status(400).json({
        success: false,
        message: "productId, adjustmentType (INCREASE/DECREASE), quantity, and reason are required"
      });
    }

    const result = await inventoryService.adjustStock({
      branchId: branchId || 1,
      productId: parseInt(productId),
      adjustmentType,
      quantity: parseInt(quantity),
      reason,
      userId: req.user.id
    });

    res.json({ success: true, message: "Stock adjusted successfully", data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getTransactions = async (req, res, next) => {
  try {
    const branchId = req.query.branchId ? parseInt(req.query.branchId) : 1;
    const list = await inventoryService.getTransactions(branchId);
    res.json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
};

export const getSuppliers = async (req, res, next) => {
  try {
    const branchId = req.query.branchId ? parseInt(req.query.branchId) : 1;
    const list = await inventoryService.getSuppliers(branchId);
    res.json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
};
