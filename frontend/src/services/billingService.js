import api from "./api.js";

export const billingService = {
  async getInvoices(params) {
    const res = await api.get("/billing/invoices", { params });
    return res.data;
  },
  async getInvoiceById(id) {
    const res = await api.get(`/billing/invoices/${id}`);
    return res.data;
  },
  async createInvoice(data) {
    const res = await api.post("/billing/invoices", data);
    return res.data;
  },
  async recordPayment(invoiceId, data) {
    const res = await api.post(`/billing/invoices/${invoiceId}/payments`, data);
    return res.data;
  },
  async processRefund(data) {
    const res = await api.post("/billing/refunds", data);
    return res.data;
  }
};
