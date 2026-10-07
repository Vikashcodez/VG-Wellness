import api from "./api.js";

export const goalService = {
  async getMeta() {
    const res = await api.get("/goals/meta");
    return res.data;
  },
  async getClientGoals(clientId) {
    const res = await api.get("/goals", { params: { clientId } });
    return res.data;
  },
  async getById(id) {
    const res = await api.get(`/goals/${id}`);
    return res.data;
  },
  async create(data) {
    const res = await api.post("/goals", data);
    return res.data;
  },
  async recordMeasurement(goalId, data) {
    const res = await api.post(`/goals/${goalId}/measurements`, data);
    return res.data;
  },
  async updateMilestone(goalId, milestoneId, data) {
    const res = await api.patch(`/goals/${goalId}/milestones/${milestoneId}`, data);
    return res.data;
  }
};
