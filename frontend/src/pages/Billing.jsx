import React, { useEffect, useState } from "react";
import Header from "../components/Header.jsx";
import Modal from "../components/Modal.jsx";
import { billingService } from "../services/billingService.js";
import { clientService } from "../services/clientService.js";
import api from "../services/api.js";
import { Receipt, Plus, IndianRupee, CreditCard, CheckCircle, Clock } from "lucide-react";

export default function Billing() {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create invoice modal
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invClient, setInvClient] = useState("");
  const [invItems, setInvItems] = useState([
    { description: "Comprehensive Wellness Assessment", quantity: 1, unitPrice: 2500, taxRate: 18, itemType: "SERVICE" }
  ]);
  const [invDiscount, setInvDiscount] = useState("0");
  const [invNotes, setInvNotes] = useState("");
  const [creatingInv, setCreatingInv] = useState(false);

  // Payment modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("UPI");
  const [payRef, setPayRef] = useState("");
  const [recordingPay, setRecordingPay] = useState(false);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const [iRes, cRes, sRes] = await Promise.all([
        billingService.getInvoices(),
        clientService.getAll({ limit: 100 }),
        api.get("/services")
      ]);
      if (iRes.success) setInvoices(iRes.data);
      if (cRes.success) setClients(cRes.data);
      if (sRes.data.success) setServices(sRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleAddItem = () => {
    setInvItems([...invItems, { description: "Service / Product", quantity: 1, unitPrice: 1000, taxRate: 18, itemType: "SERVICE" }]);
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!invClient || invItems.length === 0) return;
    setCreatingInv(true);
    try {
      await billingService.createInvoice({
        clientId: parseInt(invClient),
        items: invItems,
        discount: parseFloat(invDiscount) || 0,
        notes: invNotes
      });
      setIsInvoiceModalOpen(false);
      fetchInvoices();
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to create invoice");
    } finally {
      setCreatingInv(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!activeInvoice || !payAmount) return;
    setRecordingPay(true);
    try {
      await billingService.recordPayment(activeInvoice.id, {
        amount: parseFloat(payAmount),
        paymentMethod: payMethod,
        transactionReference: payRef
      });
      setIsPayModalOpen(false);
      setPayAmount("");
      setPayRef("");
      fetchInvoices();
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to record payment");
    } finally {
      setRecordingPay(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Unified Billing, Invoices & Collections"
        subtitle="Manage services, packages, products, and multi-method payments with full ledger integrity"
        actions={
          <button
            onClick={() => setIsInvoiceModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Invoice</span>
          </button>
        }
      />

      <div className="p-8 space-y-6 flex-1">
        {/* Invoices Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2" />
              Loading financial records...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 font-bold uppercase text-slate-500">
                    <th className="py-3 px-6">Invoice # & Date</th>
                    <th className="py-3 px-6">Client</th>
                    <th className="py-3 px-6">Subtotal</th>
                    <th className="py-3 px-6">Total Amount</th>
                    <th className="py-3 px-6">Paid</th>
                    <th className="py-3 px-6">Balance Due</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50">
                      <td className="py-4 px-6">
                        <span className="font-mono font-bold text-slate-900">{inv.invoice_number}</span>
                        <p className="text-slate-400 mt-0.5">{inv.invoice_date}</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-bold text-slate-900">{inv.client_first_name} {inv.client_last_name}</p>
                        <span className="font-mono text-slate-400">{inv.client_code}</span>
                      </td>
                      <td className="py-4 px-6 text-slate-600">₹{parseFloat(inv.subtotal).toLocaleString()}</td>
                      <td className="py-4 px-6 font-bold text-slate-900">₹{parseFloat(inv.total_amount).toLocaleString()}</td>
                      <td className="py-4 px-6 font-medium text-emerald-700">₹{parseFloat(inv.paid_amount).toLocaleString()}</td>
                      <td className="py-4 px-6 font-bold text-rose-600">₹{parseFloat(inv.balance_amount).toLocaleString()}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          inv.status === "PAID" ? "bg-emerald-100 text-emerald-800" :
                          inv.status === "PARTIAL" ? "bg-blue-100 text-blue-800" :
                          "bg-amber-100 text-amber-800"
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        {parseFloat(inv.balance_amount) > 0 && (
                          <button
                            onClick={() => {
                              setActiveInvoice(inv);
                              setPayAmount(String(inv.balance_amount));
                              setIsPayModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
                          >
                            Collect Payment
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Invoice Modal */}
      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        title="Generate New Unified Invoice"
      >
        <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Client *</label>
            <select
              required
              value={invClient}
              onChange={(e) => setInvClient(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            >
              <option value="">-- Choose Client --</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.first_name} {c.last_name} ({c.client_code})</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="font-semibold text-slate-700">Line Items</label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs text-emerald-600 font-bold hover:underline"
              >
                + Add Line Item
              </button>
            </div>

            {invItems.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
                <div className="col-span-5">
                  <input
                    type="text"
                    required
                    value={item.description}
                    onChange={(e) => {
                      const updated = [...invItems];
                      updated[index].description = e.target.value;
                      setInvItems(updated);
                    }}
                    placeholder="Description"
                    className="w-full px-2 py-1.5 rounded border border-slate-300 bg-white"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min="1"
                    required
                    value={item.quantity}
                    onChange={(e) => {
                      const updated = [...invItems];
                      updated[index].quantity = parseInt(e.target.value) || 1;
                      setInvItems(updated);
                    }}
                    placeholder="Qty"
                    className="w-full px-2 py-1.5 rounded border border-slate-300 bg-white"
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={item.unitPrice}
                    onChange={(e) => {
                      const updated = [...invItems];
                      updated[index].unitPrice = parseFloat(e.target.value) || 0;
                      setInvItems(updated);
                    }}
                    placeholder="Price"
                    className="w-full px-2 py-1.5 rounded border border-slate-300 bg-white"
                  />
                </div>
                <div className="col-span-2 flex items-center justify-end">
                  <span className="font-bold text-slate-800">
                    ₹{(item.quantity * item.unitPrice).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Discount (₹)</label>
              <input
                type="number"
                value={invDiscount}
                onChange={(e) => setInvDiscount(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Notes</label>
              <input
                type="text"
                value={invNotes}
                onChange={(e) => setInvNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
                placeholder="Optional billing note"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsInvoiceModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creatingInv}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {creatingInv ? "Generating..." : "Generate Invoice"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Collect Payment Modal */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title={`Collect Payment for ${activeInvoice?.invoice_number}`}
      >
        <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Payment Amount (Outstanding: ₹{activeInvoice?.balance_amount}) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              max={activeInvoice?.balance_amount}
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Method *</label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              >
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Credit / Debit Card</option>
                <option value="NET_BANKING">Net Banking</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Transaction Ref #</label>
              <input
                type="text"
                value={payRef}
                onChange={(e) => setPayRef(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
                placeholder="UPI ref or card authorization"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsPayModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={recordingPay}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {recordingPay ? "Allocating..." : "Record Payment & Issue Receipt"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
