import { inventoryService } from "../services/inventoryService.js";
import { getTenantScope } from "../utils/tenantIsolation.js";

export const getStock = async (req, res, next) => {
  try {
    const { search, lowStock } = req.query;
    const { organizationId, branchId } = getTenantScope(req);
    const stock = await inventoryService.getStockList({
      organizationId,
      branchId,
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

    const { organizationId, branchId: scopedBranchId } = getTenantScope(req);
    const result = await inventoryService.adjustStock({
      organizationId,
      branchId: branchId || scopedBranchId || 1,
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
    const { organizationId, branchId } = getTenantScope(req);
    const list = await inventoryService.getTransactions({ organizationId, branchId });
    res.json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
};

export const getSuppliers = async (req, res, next) => {
  try {
    const { organizationId, branchId } = getTenantScope(req);
    const list = await inventoryService.getSuppliers({ organizationId, branchId });
    res.json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
};

export const createSupplier = async (req, res, next) => {
  try {
    const { organizationId, branchId } = getTenantScope(req);
    const supplier = await inventoryService.createSupplier({
      ...req.body,
      organizationId,
      branchId
    }, req.user.id);
    res.status(201).json({ success: true, message: "Supplier registered successfully", data: supplier });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateSupplier = async (req, res, next) => {
  try {
    const supplier = await inventoryService.updateSupplier(parseInt(req.params.id), req.body, req.user.id);
    res.json({ success: true, message: "Supplier updated successfully", data: supplier });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteSupplier = async (req, res, next) => {
  try {
    await inventoryService.deleteSupplier(parseInt(req.params.id), req.user.id);
    res.json({ success: true, message: "Supplier deactivated successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const createGRN = async (req, res, next) => {
  try {
    const { organizationId, branchId } = getTenantScope(req);
    const grn = await inventoryService.createGRN({
      ...req.body,
      organizationId,
      branchId: req.body.branchId || branchId || 1
    }, req.user.id);
    res.status(201).json({ success: true, message: "Goods Receipt Note (GRN) created and stock received successfully", data: grn });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getGRNs = async (req, res, next) => {
  try {
    const { organizationId, branchId } = getTenantScope(req);
    const { search } = req.query;
    const list = await inventoryService.getGRNs({ organizationId, branchId, search });
    res.json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
};

export const getGRNById = async (req, res, next) => {
  try {
    const grn = await inventoryService.getGRNById(parseInt(req.params.id));
    res.json({ success: true, data: grn });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};
