import React, { useEffect, useState } from "react";
import api from "../services/api.js";
import { Receipt, CheckCircle, Clock, IndianRupee, FileText } from "lucide-react";

export default function ClientInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/clients/me/profile");
        if (res.data.success) {
          setInvoices(res.data.data.invoices || []);
          setPayments(res.data.data.payments || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Invoices & Financial Receipts</h1>
        <p className="text-xs text-slate-500 mt-1">Review clinical billing statements and official payment receipts</p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500 text-xs">
          Loading billing statements...
        </div>
      ) : (
        <div className="space-y-8">
          {/* Invoices list */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Your Invoices</h2>
              <span className="text-xs text-slate-400">{invoices.length} Invoices</span>
            </div>

            {invoices.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No invoices issued for your account.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {invoices.map((inv) => (
                  <div key={inv.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{inv.invoice_number}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          inv.status === "PAID" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {inv.status}
                        </span>
                      </div>
                      <p className="text-slate-500">Date: {inv.invoice_date} • {inv.notes || "Wellness services"}</p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Total</span>
                        <span className="font-extrabold text-slate-900 text-sm">₹{parseFloat(inv.total_amount).toLocaleString()}</span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Balance Due</span>
                        <span className={`font-extrabold text-sm ${parseFloat(inv.balance_amount) > 0 ? "text-rose-600" : "text-emerald-700"}`}>
                          ₹{parseFloat(inv.balance_amount).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Receipts */}
          {payments.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900">Payment Transactions</h2>
                <span className="text-xs text-slate-400">{payments.length} Payments</span>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {payments.map((p) => (
                  <div key={p.id} className="p-5 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-slate-900">{p.payment_number}</span>
                      <p className="text-slate-500 mt-0.5">Paid on {p.payment_date} via {p.payment_method}</p>
                      {p.transaction_reference && <p className="text-[11px] text-slate-400 font-mono">Ref: {p.transaction_reference}</p>}
                    </div>

                    <div className="text-right">
                      <span className="text-emerald-700 font-extrabold text-base">₹{parseFloat(p.amount).toLocaleString()}</span>
                      <span className="block text-[10px] text-emerald-600 font-bold">CLEARED RECEIPT</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
