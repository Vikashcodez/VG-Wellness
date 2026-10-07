import api from "./api.js";

export const dashboardService = {
  async getAdminStats(branchId = null) {
    const res = await api.get("/dashboard/admin", { params: { branchId } });
    return res.data;
  }
};
