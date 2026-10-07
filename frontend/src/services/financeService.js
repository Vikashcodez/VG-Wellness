import api from "./api";

export const financeService = {
  getOverview: async (params = {}) => {
    const res = await api.get("/finance/overview", { params });
    return res.data;
  },
  getExpenses: async (params = {}) => {
    const res = await api.get("/finance/expenses", { params });
    return res.data;
  },
  createExpense: async (data) => {
    const res = await api.post("/finance/expenses", data);
    return res.data;
  },
  getCategories: async (params = {}) => {
    const res = await api.get("/finance/categories", { params });
    return res.data;
  },
  createCategory: async (data) => {
    const res = await api.post("/finance/categories", data);
    return res.data;
  }
};
