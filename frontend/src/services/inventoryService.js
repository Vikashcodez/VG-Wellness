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
  async getSuppliers(branchId = 1) {
    const res = await api.get("/inventory/suppliers", { params: { branchId } });
    return res.data;
  }
};
