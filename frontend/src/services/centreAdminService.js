import api from "./api.js";

export const centreAdminService = {
  getMyCentreProfile: async () => {
    const res = await api.get("/saas/my-centre");
    return res.data;
  },
  getBranches: async () => {
    const res = await api.get("/branches");
    return res.data;
  },
  createBranchWithAdmin: async (branchData) => {
    const myCentre = await api.get("/saas/my-centre");
    const orgId = myCentre.data?.data?.id;
    const res = await api.post(`/saas/centres/${orgId}/branches`, branchData);
    return res.data;
  }
};
