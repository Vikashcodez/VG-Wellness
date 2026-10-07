import api from "./api.js";

export const appointmentService = {
  async getAll(params) {
    const res = await api.get("/appointments", { params });
    return res.data;
  },
  async getById(id) {
    const res = await api.get(`/appointments/${id}`);
    return res.data;
  },
  async getQueue(branchId = 1) {
    const res = await api.get("/appointments/queue", { params: { branchId } });
    return res.data;
  },
  async checkAvailability(params) {
    const res = await api.get("/appointments/availability", { params });
    return res.data;
  },
  async create(data) {
    const res = await api.post("/appointments", data);
    return res.data;
  },
  async updateStatus(id, status, notes = "") {
    const res = await api.patch(`/appointments/${id}/status`, { status, notes });
    return res.data;
  },
  async reschedule(id, newDate, newStartTime) {
    const res = await api.patch(`/appointments/${id}/reschedule`, { newDate, newStartTime });
    return res.data;
  }
};
