import { clientService } from "../services/clientService.js";

export const getClients = async (req, res, next) => {
  try {
    const { search, branchId, limit, offset } = req.query;
    const result = await clientService.getAllClients({
      search,
      branchId: branchId ? parseInt(branchId) : null,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0
    });
    res.json({ success: true, data: result.clients, total: result.total });
  } catch (error) {
    next(error);
  }
};

export const getClientById = async (req, res, next) => {
  try {
    const clientId = parseInt(req.params.id);
    // If user is client, ensure they can only view their own profile
    if (req.user.role === "CLIENT" && req.user.clientId !== clientId) {
      return res.status(403).json({ success: false, message: "Access forbidden to this profile" });
    }

    const data = await clientService.getClientProfile(clientId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const getMyProfile = async (req, res, next) => {
  try {
    if (!req.user.clientId) {
      return res.status(404).json({ success: false, message: "Client profile not associated with this account" });
    }
    const data = await clientService.getClientProfile(req.user.clientId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const createClient = async (req, res, next) => {
  try {
    const { firstName, lastName, mobile } = req.body;
    if (!firstName || !lastName || !mobile) {
      return res.status(400).json({ success: false, message: "First name, last name, and mobile are required" });
    }

    const newClient = await clientService.createClient(req.body, req.user.id);
    res.status(201).json({ success: true, message: "Client created successfully", data: newClient });
  } catch (error) {
    next(error);
  }
};

export const updateClient = async (req, res, next) => {
  try {
    const clientId = parseInt(req.params.id);
    if (req.user.role === "CLIENT" && req.user.clientId !== clientId) {
      return res.status(403).json({ success: false, message: "Unauthorized to update this profile" });
    }

    const updated = await clientService.updateClient(clientId, req.body, req.user.id);
    res.json({ success: true, message: "Client updated successfully", data: updated });
  } catch (error) {
    next(error);
  }
};
