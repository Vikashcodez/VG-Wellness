import api from "./api.js";

export const reportService = {
  async getReport(type, params = {}) {
    const res = await api.get("/reports", { params: { type, ...params } });
    return res.data;
  },
  getExportUrl(type, params = {}) {
    const searchParams = new URLSearchParams({ type, exportCsv: true, ...params });
    return `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/reports?${searchParams.toString()}`;
  }
};
