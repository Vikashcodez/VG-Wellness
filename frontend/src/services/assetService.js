import api from "./api";

export const assetService = {
  getAssets: async (params = {}) => {
    const res = await api.get("/assets", { params });
    return res.data;
  },
  getAssetById: async (id) => {
    const res = await api.get(`/assets/${id}`);
    return res.data;
  },
  createAsset: async (data) => {
    const res = await api.post("/assets", data);
    return res.data;
  },
  updateAsset: async (id, data) => {
    const res = await api.put(`/assets/${id}`, data);
    return res.data;
  },
  addMaintenanceLog: async (id, data) => {
    const res = await api.post(`/assets/${id}/maintenance`, data);
    return res.data;
  }
};
