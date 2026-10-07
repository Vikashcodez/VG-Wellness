import { billingService } from "../services/billingService.js";

export const getInvoices = async (req, res, next) => {
  try {
    let clientId = req.query.clientId;
    if (req.user.role === "CLIENT") {
      clientId = req.user.clientId;
    }

    const invoices = await billingService.getInvoices({
      clientId: clientId ? parseInt(clientId) : null,
      branchId: req.query.branchId ? parseInt(req.query.branchId) : null,
      status: req.query.status,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo
    });

    res.json({ success: true, data: invoices });
  } catch (error) {
    next(error);
  }
};

export const getInvoiceById = async (req, res, next) => {
  try {
    const invoiceId = parseInt(req.params.id);
    const invoice = await billingService.getInvoiceById(invoiceId);

    if (req.user.role === "CLIENT" && invoice.client_id !== req.user.clientId) {
      return res.status(403).json({ success: false, message: "Access forbidden" });
    }

    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const createInvoice = async (req, res, next) => {
  try {
    const { clientId, branchId, items, discount, notes } = req.body;
    if (!clientId || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: "clientId and items are required" });
    }

    const invoice = await billingService.createInvoice({
      clientId: parseInt(clientId),
      branchId: branchId ? parseInt(branchId) : 1,
      items,
      discount: discount || 0,
      notes,
      userId: req.user.id
    });

    res.status(201).json({ success: true, message: "Invoice created successfully", data: invoice });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const recordPayment = async (req, res, next) => {
  try {
    const invoiceId = parseInt(req.params.id);
    const { amount, paymentMethod, transactionReference, notes } = req.body;

    if (!amount) {
      return res.status(400).json({ success: false, message: "Payment amount is required" });
    }

    const result = await billingService.recordPayment({
      invoiceId,
      amount: parseFloat(amount),
      paymentMethod: paymentMethod || "CASH",
      transactionReference,
      notes,
      userId: req.user.id
    });

    res.json({ success: true, message: "Payment recorded successfully", data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const processRefund = async (req, res, next) => {
  try {
    const { paymentId, amount, reason } = req.body;
    if (!paymentId || !amount || !reason) {
      return res.status(400).json({ success: false, message: "paymentId, amount, and reason are required" });
    }

    const refund = await billingService.processRefund({
      paymentId: parseInt(paymentId),
      amount: parseFloat(amount),
      reason,
      userId: req.user.id
    });

    res.json({ success: true, message: "Refund processed successfully", data: refund });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
