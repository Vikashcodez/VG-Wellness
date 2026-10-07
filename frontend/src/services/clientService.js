import api from "./api.js";

export const clientService = {
  async getAll(params) {
    const res = await api.get("/clients", { params });
    return res.data;
  },
  async getById(id) {
    const res = await api.get(`/clients/${id}`);
    return res.data;
  },
  async create(data) {
    const res = await api.post("/clients", data);
    return res.data;
  },
  async update(id, data) {
    const res = await api.put(`/clients/${id}`, data);
    return res.data;
  }
};
