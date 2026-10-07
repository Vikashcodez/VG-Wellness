import { saasService } from "../services/saasService.js";

export const getCentres = async (req, res, next) => {
  try {
    const centres = await saasService.getAllCentres();
    res.json({ success: true, data: centres });
  } catch (error) {
    next(error);
  }
};

export const getCentreById = async (req, res, next) => {
  try {
    const data = await saasService.getCentreById(parseInt(req.params.id));
    res.json({ success: true, data });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const createCentre = async (req, res, next) => {
  try {
    const result = await saasService.createCentre(req.body, req.user.id);
    res.status(201).json({
      success: true,
      message: "Wellness Centre and Administrator created successfully!",
      data: result
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateCentre = async (req, res, next) => {
  try {
    const updated = await saasService.updateCentre(parseInt(req.params.id), req.body, req.user.id);
    res.json({ success: true, message: "Centre details updated", data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const createBranch = async (req, res, next) => {
  try {
    const orgId = parseInt(req.params.id);
    const branch = await saasService.createBranch(orgId, req.body, req.user.id);
    res.status(201).json({ success: true, message: "Branch created successfully", data: branch });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getPlatformMetrics = async (req, res, next) => {
  try {
    const metrics = await saasService.getPlatformMetrics();
    res.json({ success: true, data: metrics });
  } catch (error) {
    next(error);
  }
};

export const getMyCentre = async (req, res, next) => {
  try {
    const data = await saasService.getMyCentre(req.user.id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};
