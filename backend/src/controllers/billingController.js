import { billingService } from "../services/billingService.js";
import { getTenantScope } from "../utils/tenantIsolation.js";

export const getInvoices = async (req, res, next) => {
  try {
    const scope = getTenantScope(req);
    let clientId = req.query.clientId;
    if (req.user.role === "CLIENT") {
      clientId = req.user.clientId;
    }

    const invoices = await billingService.getInvoices({
      clientId: clientId ? parseInt(clientId) : null,
      branchId: scope.branchId,
      organizationId: scope.organizationId,
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
    const scope = getTenantScope(req);
    const invoiceId = parseInt(req.params.id);
    const invoice = await billingService.getInvoiceById(invoiceId);

    if (req.user.role === "CLIENT" && invoice.client_id !== req.user.clientId) {
      return res.status(403).json({ success: false, message: "Access forbidden" });
    }
    if (!scope.isSuper && invoice.organization_id && invoice.organization_id !== scope.organizationId) {
      return res.status(403).json({ success: false, message: "Access forbidden to this invoice" });
    }

    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const createInvoice = async (req, res, next) => {
  try {
    const scope = getTenantScope(req);
    const { clientId, branchId, items, discount, notes } = req.body;
    if (!clientId || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: "clientId and items are required" });
    }

    const targetBranchId = scope.branchId || (branchId ? parseInt(branchId) : 1);
    const targetOrgId = scope.organizationId || 1;

    const invoice = await billingService.createInvoice({
      clientId: parseInt(clientId),
      branchId: targetBranchId,
      organizationId: targetOrgId,
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

export const getPrintableInvoice = async (req, res, next) => {
  try {
    const scope = getTenantScope(req);
    const invoiceId = parseInt(req.params.id);
    const invoice = await billingService.getInvoiceById(invoiceId);

    if (req.user.role === "CLIENT" && invoice.client_id !== req.user.clientId) {
      return res.status(403).send("<h3>Access forbidden to this invoice</h3>");
    }
    if (!scope.isSuper && invoice.organization_id && invoice.organization_id !== scope.organizationId) {
      return res.status(403).send("<h3>Access forbidden: Invoice belongs to another wellness centre</h3>");
    }

    const clientName = `${invoice.client_first_name} ${invoice.client_last_name}`;
    const formattedDate = new Date(invoice.invoice_date).toLocaleDateString("en-IN", {
      year: "numeric", month: "short", day: "numeric"
    });
    const formattedDue = invoice.due_date ? new Date(invoice.due_date).toLocaleDateString("en-IN", {
      year: "numeric", month: "short", day: "numeric"
    }) : "Due upon receipt";

    const rowsHtml = invoice.items.map((it, idx) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${idx + 1}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
          <strong>${it.description}</strong>
          <div style="font-size: 11px; color: #6b7280; text-transform: uppercase;">${it.item_type}</div>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${it.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${parseFloat(it.unit_price).toFixed(2)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">${parseFloat(it.tax_rate)}%</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">₹${parseFloat(it.total_amount).toFixed(2)}</td>
      </tr>
    `).join("");

    const paymentsHtml = invoice.payments && invoice.payments.length > 0 ? invoice.payments.map(p => `
      <div style="display: flex; justify-content: space-between; font-size: 12px; color: #374151; padding: 4px 0;">
        <span>Receipt <strong>${p.payment_number}</strong> (${p.payment_method}) - ${new Date(p.payment_date).toLocaleDateString("en-IN")}</span>
        <span style="font-weight: 600; color: #059669;">- ₹${parseFloat(p.allocated_amount || p.amount).toFixed(2)}</span>
      </div>
    `).join("") : `<div style="font-size: 12px; color: #9ca3af; font-style: italic;">No payments recorded yet.</div>`;

    const statusColor = invoice.status === 'PAID' ? '#059669' : (invoice.status === 'PARTIAL' ? '#d97706' : '#dc2626');
    const statusBg = invoice.status === 'PAID' ? '#d1fae5' : (invoice.status === 'PARTIAL' ? '#fef3c7' : '#fee2e2');

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Tax Invoice - ${invoice.invoice_number}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
          body {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
            margin: 0;
            padding: 40px;
            color: #1f2937;
            background: #f9fafb;
          }
          .invoice-box {
            max-width: 850px;
            margin: auto;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          }
          @media print {
            body { background: white; padding: 0; }
            .invoice-box { border: none; box-shadow: none; padding: 20px; max-width: 100%; }
            .no-print { display: none !important; }
          }
          .btn-print {
            background: #0d9488;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            margin-bottom: 20px;
          }
        </style>
      </head>
      <body>
        <div style="max-width: 850px; margin: auto; text-align: right;" class="no-print">
          <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
        </div>

        <div class="invoice-box">
          <!-- Header -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0284c7; padding-bottom: 24px; margin-bottom: 24px;">
            <div>
              <div style="display: flex; align-items: center; gap: 10px;">
                <div style="width: 32px; height: 32px; border-radius: 6px; background: #0284c7; color: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 14px; letter-spacing: 0.5px;">VGT</div>
                <span style="font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">${(invoice.organization_name || invoice.branch_name || "VGT WELLNESS CENTRE MANAGEMENT").toUpperCase()}</span>
              </div>
              <div style="font-size: 13px; color: #4b5563; margin-top: 6px;">
                ${invoice.branch_name || "VGT Flagship Centre"}<br>
                ${invoice.branch_address || "12th Main, Indiranagar, Bengaluru, KA"}<br>
                GSTIN: 29AABCU9603R1ZM | Phone: ${invoice.branch_phone || "+91 80 4123 4568"}
              </div>
            </div>

            <div style="text-align: right;">
              <h1 style="margin: 0; font-size: 24px; color: #111827; letter-spacing: 0.5px;">TAX INVOICE</h1>
              <div style="font-size: 15px; font-weight: 700; color: #0d9488; margin-top: 4px;"># ${invoice.invoice_number}</div>
              <div style="margin-top: 8px; display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; background: ${statusBg}; color: ${statusColor};">
                ${invoice.status}
              </div>
            </div>
          </div>

          <!-- Metadata -->
          <div style="display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 13px;">
            <div style="width: 50%;">
              <div style="font-weight: 700; color: #6b7280; text-transform: uppercase; font-size: 11px; margin-bottom: 4px;">BILLED TO:</div>
              <div style="font-size: 16px; font-weight: 700; color: #111827;">${clientName}</div>
              <div style="color: #4b5563; margin-top: 2px;">Client ID: <strong>${invoice.client_code || "WC-2026-0001"}</strong></div>
              <div style="color: #4b5563;">Mobile: ${invoice.client_mobile || "-"}</div>
              <div style="color: #4b5563;">Email: ${invoice.client_email || "-"}</div>
            </div>

            <div style="width: 45%; text-align: right;">
              <div style="margin-bottom: 6px;">
                <span style="color: #6b7280;">Invoice Date:</span>
                <span style="font-weight: 600; color: #111827; margin-left: 8px;">${formattedDate}</span>
              </div>
              <div style="margin-bottom: 6px;">
                <span style="color: #6b7280;">Due Date:</span>
                <span style="font-weight: 600; color: #111827; margin-left: 8px;">${formattedDue}</span>
              </div>
              <div>
                <span style="color: #6b7280;">Place of Supply:</span>
                <span style="font-weight: 600; color: #111827; margin-left: 8px;">Karnataka (29)</span>
              </div>
            </div>
          </div>

          <!-- Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px;">
            <thead>
              <tr style="background: #f3f4f6; color: #374151; font-weight: 600; text-transform: uppercase; font-size: 11px;">
                <th style="padding: 10px; border-bottom: 2px solid #e5e7eb; width: 40px; text-align: center;">#</th>
                <th style="padding: 10px; border-bottom: 2px solid #e5e7eb; text-align: left;">Description</th>
                <th style="padding: 10px; border-bottom: 2px solid #e5e7eb; width: 60px; text-align: center;">Qty</th>
                <th style="padding: 10px; border-bottom: 2px solid #e5e7eb; width: 100px; text-align: right;">Rate</th>
                <th style="padding: 10px; border-bottom: 2px solid #e5e7eb; width: 70px; text-align: right;">GST</th>
                <th style="padding: 10px; border-bottom: 2px solid #e5e7eb; width: 110px; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <!-- Financial Calculation -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
            <div style="width: 50%;">
              <div style="font-weight: 700; color: #374151; font-size: 12px; margin-bottom: 6px; text-transform: uppercase;">Payment History:</div>
              <div style="background: #f9fafb; padding: 12px; border-radius: 8px; border: 1px solid #e5e7eb;">
                ${paymentsHtml}
              </div>
              ${invoice.notes ? `<div style="margin-top: 10px; font-size: 12px; color: #6b7280;"><em>Note: ${invoice.notes}</em></div>` : ''}
            </div>

            <div style="width: 40%;">
              <table style="width: 100%; font-size: 13px;">
                <tr>
                  <td style="padding: 6px 0; color: #6b7280;">Subtotal:</td>
                  <td style="padding: 6px 0; text-align: right; font-weight: 600;">₹${parseFloat(invoice.subtotal).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #6b7280;">GST (CGST + SGST):</td>
                  <td style="padding: 6px 0; text-align: right; font-weight: 600;">₹${parseFloat(invoice.tax || 0).toFixed(2)}</td>
                </tr>
                ${parseFloat(invoice.discount || 0) > 0 ? `
                  <tr>
                    <td style="padding: 6px 0; color: #059669;">Discount:</td>
                    <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #059669;">- ₹${parseFloat(invoice.discount).toFixed(2)}</td>
                  </tr>
                ` : ''}
                <tr style="border-top: 2px solid #e5e7eb; border-bottom: 2px solid #e5e7eb;">
                  <td style="padding: 10px 0; font-size: 16px; font-weight: 800; color: #111827;">Total Amount:</td>
                  <td style="padding: 10px 0; font-size: 16px; font-weight: 800; color: #0d9488; text-align: right;">₹${parseFloat(invoice.total_amount).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #059669; font-weight: 600;">Amount Paid:</td>
                  <td style="padding: 6px 0; text-align: right; font-weight: 600; color: #059669;">₹${parseFloat(invoice.paid_amount || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #dc2626; font-weight: 700;">Balance Due:</td>
                  <td style="padding: 6px 0; text-align: right; font-weight: 700; color: #dc2626; font-size: 15px;">₹${parseFloat(invoice.balance_amount || 0).toFixed(2)}</td>
                </tr>
              </table>
            </div>
          </div>

          <!-- Footer Signatory & Terms -->
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 11px; color: #6b7280;">
            <div>
              <strong>Terms & Conditions:</strong><br>
              1. All treatments and consultations are pre-scheduled.<br>
              2. Cancellations within 4 hours may attract nominal rescheduling fees.<br>
              3. This is a computer-generated tax invoice.
            </div>
            <div style="text-align: center; width: 200px;">
              <div style="height: 40px; border-bottom: 1px solid #9ca3af; margin-bottom: 6px;"></div>
              <strong>Authorized Signatory</strong><br>
              ${invoice.organization_name || "VGT Wellness Centre Management"}
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    res.send(html);
  } catch (error) {
    next(error);
  }
};
