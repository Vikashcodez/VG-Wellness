import api from "./api";

export const saasService = {
  getCentres: async () => {
    const res = await api.get("/saas/centres");
    return res.data;
  },
  getCentreById: async (id) => {
    const res = await api.get(`/saas/centres/${id}`);
    return res.data;
  },
  getMyCentre: async () => {
    const res = await api.get("/saas/my-centre");
    return res.data;
  },
  createCentre: async (data) => {
    const res = await api.post("/saas/centres", data);
    return res.data;
  },
  updateCentre: async (id, data) => {
    const res = await api.put(`/saas/centres/${id}`, data);
    return res.data;
  },
  createBranch: async (orgId, data) => {
    const res = await api.post(`/saas/centres/${orgId}/branches`, data);
    return res.data;
  },
  getPlatformMetrics: async () => {
    const res = await api.get("/saas/metrics");
    return res.data;
  }
};
