import api from "./api.js";

export const inventoryService = {
  async getStock(params) {
    const res = await api.get("/inventory/stock", { params });
    return res.data;
  },
  async adjustStock(data) {
    const res = await api.post("/inventory/adjust", data);
    return res.data;
  },
  async getTransactions(branchId = 1) {
    const res = await api.get("/inventory/transactions", { params: { branchId } });
    return res.data;
  },
  async getSuppliers(branchId) {
    const res = await api.get("/inventory/suppliers", { params: branchId ? { branchId } : {} });
    return res.data;
  },
  async createSupplier(data) {
    const res = await api.post("/inventory/suppliers", data);
    return res.data;
  },
  async updateSupplier(id, data) {
    const res = await api.put(`/inventory/suppliers/${id}`, data);
    return res.data;
  },
  async deleteSupplier(id) {
    const res = await api.delete(`/inventory/suppliers/${id}`);
    return res.data;
  },
  async getGRNs(params) {
    const res = await api.get("/inventory/grn", { params });
    return res.data;
  },
  async getGRNById(id) {
    const res = await api.get(`/inventory/grn/${id}`);
    return res.data;
  },
  async createGRN(data) {
    const res = await api.post("/inventory/grn", data);
    return res.data;
  }
};
