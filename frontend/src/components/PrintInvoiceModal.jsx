import React from "react";
import Modal from "./Modal";

export default function PrintInvoiceModal({ isOpen, onClose, invoice }) {
  if (!invoice) return null;

  const clientName = `${invoice.client_first_name || ""} ${invoice.client_last_name || ""}`.trim() || invoice.client_name || "Client";
  const formattedDate = invoice.invoice_date
    ? new Date(invoice.invoice_date).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })
    : "-";
  const formattedDue = invoice.due_date
    ? new Date(invoice.due_date).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })
    : "Due upon receipt";

  const handlePrint = () => {
    window.print();
  };

  const statusColor = invoice.status === "PAID"
    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
    : invoice.status === "PARTIAL"
    ? "text-amber-700 bg-amber-50 border-amber-200"
    : "text-rose-700 bg-rose-50 border-rose-200";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tax Invoice Preview" size="xl">
      <div className="space-y-4">
        {/* Actions bar */}
        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200 print:hidden">
          <div className="text-sm text-slate-600">
            Print ready A4 document layout with tax breakdown and authorized seal.
          </div>
          <div className="flex gap-2">
            <a
              href={`http://localhost:5000/api/billing/invoices/${invoice.id}/print`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-md hover:bg-teal-100 transition-colors"
            >
              Open Print Window ↗
            </a>
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Invoice
            </button>
          </div>
        </div>

        {/* Printable Paper Canvas */}
        <div id="printable-invoice" className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm text-slate-800">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start pb-6 border-b-2 border-blue-600 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded bg-blue-600 text-white font-black text-sm flex items-center justify-center tracking-tight">VGT</span>
                <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                  {(invoice.organization_name || invoice.branch_name || "VGT WELLNESS CENTRE MANAGEMENT").toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {invoice.branch_name || "VGT Flagship Centre"}<br />
                {invoice.branch_address || "12th Main, Indiranagar, Bengaluru, Karnataka"}<br />
                GSTIN: 29AABCU9603R1ZM | Phone: {invoice.branch_phone || "+91 80 4123 4568"}
              </p>
            </div>
            <div className="sm:text-right">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-wide uppercase">Tax Invoice</h2>
              <p className="text-sm font-bold text-teal-600 mt-0.5"># {invoice.invoice_number}</p>
              <div className={`inline-block mt-2 px-3 py-1 text-xs font-bold rounded-full border ${statusColor}`}>
                {invoice.status}
              </div>
            </div>
          </div>

          {/* Meta Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6 border-b border-slate-200 text-xs">
            <div>
              <p className="text-slate-400 font-semibold uppercase tracking-wider mb-1">Billed To:</p>
              <p className="text-sm font-bold text-slate-900">{clientName}</p>
              <p className="text-slate-600 mt-0.5">Client Code: <span className="font-semibold text-slate-800">{invoice.client_code || "WC-2026-0001"}</span></p>
              <p className="text-slate-600">Mobile: {invoice.client_mobile || "-"}</p>
              <p className="text-slate-600">Email: {invoice.client_email || "-"}</p>
            </div>
            <div className="sm:text-right space-y-1">
              <p><span className="text-slate-500">Invoice Date:</span> <span className="font-semibold text-slate-800 ml-2">{formattedDate}</span></p>
              <p><span className="text-slate-500">Due Date:</span> <span className="font-semibold text-slate-800 ml-2">{formattedDue}</span></p>
              <p><span className="text-slate-500">Place of Supply:</span> <span className="font-semibold text-slate-800 ml-2">Karnataka (29)</span></p>
              <p><span className="text-slate-500">Payment Mode:</span> <span className="font-semibold text-teal-700 ml-2">Verified Digital / Cash</span></p>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-6 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200 text-slate-600 font-bold uppercase tracking-wider bg-slate-50">
                  <th className="py-2.5 px-3 text-center w-10">#</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-center w-16">Qty</th>
                  <th className="py-2.5 px-3 text-right w-24">Rate</th>
                  <th className="py-2.5 px-3 text-right w-16">GST</th>
                  <th className="py-2.5 px-3 text-right w-28">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((it, idx) => (
                    <tr key={it.id || idx}>
                      <td className="py-3 px-3 text-center text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{it.description}</div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider">{it.item_type}</div>
                      </td>
                      <td className="py-3 px-3 text-center font-medium">{it.quantity}</td>
                      <td className="py-3 px-3 text-right text-slate-600">₹{parseFloat(it.unit_price).toFixed(2)}</td>
                      <td className="py-3 px-3 text-right text-slate-500">{parseFloat(it.tax_rate || 0)}%</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">₹{parseFloat(it.total_amount).toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-4 text-center text-slate-400">No items on this invoice</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Calculation & Payment breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-200 text-xs">
            <div>
              <p className="font-bold text-slate-700 uppercase tracking-wider mb-2">Payment Receipts</p>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                {invoice.payments && invoice.payments.length > 0 ? (
                  invoice.payments.map((p) => (
                    <div key={p.id} className="flex justify-between items-center text-[11px] text-slate-700">
                      <div>
                        <span className="font-semibold text-slate-900">{p.payment_number}</span> ({p.payment_method}) - {new Date(p.payment_date).toLocaleDateString("en-IN")}
                      </div>
                      <span className="font-bold text-emerald-600">- ₹{parseFloat(p.allocated_amount || p.amount).toFixed(2)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 italic">No payments logged yet.</p>
                )}
              </div>
              {invoice.notes && (
                <p className="mt-3 text-[11px] text-slate-500 italic">Note: {invoice.notes}</p>
              )}
            </div>

            <div className="space-y-2 text-right">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold">₹{parseFloat(invoice.subtotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST (CGST + SGST):</span>
                <span className="font-semibold">₹{parseFloat(invoice.tax || 0).toFixed(2)}</span>
              </div>
              {parseFloat(invoice.discount || 0) > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount:</span>
                  <span className="font-semibold">- ₹{parseFloat(invoice.discount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                <span>Grand Total:</span>
                <span className="text-teal-700">₹{parseFloat(invoice.total_amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Paid Amount:</span>
                <span>₹{parseFloat(invoice.paid_amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-rose-600 font-bold text-sm pt-1 border-t border-dashed border-slate-200">
                <span>Balance Due:</span>
                <span>₹{parseFloat(invoice.balance_amount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer Terms & Signature */}
          <div className="mt-10 pt-6 border-t border-slate-200 flex justify-between items-end text-[10px] text-slate-400">
            <div>
              <p className="font-bold text-slate-600">Terms & Conditions:</p>
              <p>1. Thank you for choosing {invoice.organization_name || "VGT Wellness Centre Management"}.</p>
              <p>2. Computer generated document, valid without physical seal.</p>
            </div>
            <div className="text-center w-48">
              <div className="h-10 border-b border-slate-300 mb-1"></div>
              <p className="font-bold text-slate-700">Authorized Signatory</p>
              <p>{invoice.organization_name || "VGT Wellness Centre Management"}</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
