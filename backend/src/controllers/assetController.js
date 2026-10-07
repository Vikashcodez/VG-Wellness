import { assetService } from "../services/assetService.js";
import { getTenantScope } from "../utils/tenantIsolation.js";

export const getAssets = async (req, res, next) => {
  try {
    const { category, status, search } = req.query;
    const { organizationId, branchId } = getTenantScope(req);
    const assets = await assetService.getAssets({
      category,
      status,
      branchId,
      organizationId,
      search
    });
    res.json({ success: true, data: assets });
  } catch (error) {
    next(error);
  }
};

export const getAssetById = async (req, res, next) => {
  try {
    const data = await assetService.getAssetById(parseInt(req.params.id));
    res.json({ success: true, data });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const createAsset = async (req, res, next) => {
  try {
    const { organizationId, branchId } = getTenantScope(req);
    const asset = await assetService.createAsset({
      ...req.body,
      organizationId: req.body.organizationId || organizationId,
      branchId: req.body.branchId || branchId || 1
    }, req.user.id);
    res.status(201).json({ success: true, message: "Asset added to inventory", data: asset });
  } catch (error) {
    next(error);
  }
};

export const updateAsset = async (req, res, next) => {
  try {
    const asset = await assetService.updateAsset(parseInt(req.params.id), req.body, req.user.id);
    res.json({ success: true, message: "Asset updated", data: asset });
  } catch (error) {
    next(error);
  }
};

export const addMaintenanceLog = async (req, res, next) => {
  try {
    const log = await assetService.addMaintenanceLog(parseInt(req.params.id), req.body, req.user.id);
    res.status(201).json({ success: true, message: "Maintenance service recorded", data: log });
  } catch (error) {
    next(error);
  }
};
