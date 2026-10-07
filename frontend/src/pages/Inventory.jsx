import React, { useEffect, useState } from "react";
import Header from "../components/Header.jsx";
import Modal from "../components/Modal.jsx";
import { inventoryService } from "../services/inventoryService.js";
import { productService } from "../services/productService.js";
import { Boxes, Plus, AlertTriangle, ArrowUpDown, History, Truck } from "lucide-react";

export default function Inventory() {
  const [stock, setStock] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("stock");

  // Adjust stock modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustForm, setAdjustForm] = useState({
    productId: "",
    adjustmentType: "INCREASE",
    quantity: "10",
    reason: "New stock shipment received"
  });
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sRes, tRes, pRes, supRes] = await Promise.all([
        inventoryService.getStock(),
        inventoryService.getTransactions(),
        productService.getAll(),
        inventoryService.getSuppliers()
      ]);
      if (sRes.success) setStock(sRes.data);
      if (tRes.success) setTransactions(tRes.data);
      if (pRes.success) setProducts(pRes.data);
      if (supRes.success) setSuppliers(supRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdjust = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await inventoryService.adjustStock({
        productId: parseInt(adjustForm.productId),
        adjustmentType: adjustForm.adjustmentType,
        quantity: parseInt(adjustForm.quantity),
        reason: adjustForm.reason
      });
      setIsAdjustModalOpen(false);
      loadData();
      alert("Inventory updated successfully!");
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to adjust stock");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Inventory & Stock Management"
        subtitle="Batch-level inventory tracking, expiry monitoring, adjustments, and supplier purchases"
        actions={
          <button
            onClick={() => setIsAdjustModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-xs transition cursor-pointer"
          >
            <ArrowUpDown className="w-4 h-4" />
            <span>Stock Adjustment</span>
          </button>
        }
      />

      <div className="p-8 space-y-6 flex-1">
        {/* Tab Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("stock")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "stock" ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            Stock Levels by Batch ({stock.length})
          </button>
          <button
            onClick={() => setActiveTab("transactions")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "transactions" ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            Transaction Movement Ledger ({transactions.length})
          </button>
          <button
            onClick={() => setActiveTab("suppliers")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "suppliers" ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            Registered Suppliers ({suppliers.length})
          </button>
        </div>

        {/* Tab 1: Stock Batches */}
        {activeTab === "stock" && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 font-bold uppercase text-slate-500">
                    <th className="py-3 px-6">Product & SKU</th>
                    <th className="py-3 px-6">Batch #</th>
                    <th className="py-3 px-6">Expiry Date</th>
                    <th className="py-3 px-6">Stock In Hand</th>
                    <th className="py-3 px-6">Cost / Retail Price</th>
                    <th className="py-3 px-6">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stock.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <td className="py-4 px-6">
                        <p className="font-bold text-slate-900">{s.product_name}</p>
                        <span className="font-mono text-slate-400">{s.sku}</span>
                      </td>
                      <td className="py-4 px-6 font-mono font-semibold text-slate-800">{s.batch_number}</td>
                      <td className="py-4 px-6 font-medium text-slate-700">{s.expiry_date || "N/A"}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full font-bold ${
                          s.quantity <= 10 ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                        }`}>
                          {s.quantity} units
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-700">
                        ₹{s.purchase_price} / <strong className="text-slate-900">₹{s.selling_price}</strong>
                      </td>
                      <td className="py-4 px-6 text-slate-500">{s.location_name || "Central Store"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Transactions */}
        {activeTab === "transactions" && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 font-bold uppercase text-slate-500">
                    <th className="py-3 px-6">Date & Time</th>
                    <th className="py-3 px-6">Type</th>
                    <th className="py-3 px-6">Product</th>
                    <th className="py-3 px-6">Quantity</th>
                    <th className="py-3 px-6">Notes / Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-6 text-slate-500">{new Date(t.created_at).toLocaleString()}</td>
                      <td className="py-3.5 px-6">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.transaction_type === "SALE" ? "bg-blue-100 text-blue-800" :
                          t.transaction_type === "PURCHASE" ? "bg-emerald-100 text-emerald-800" :
                          "bg-purple-100 text-purple-800"
                        }`}>
                          {t.transaction_type}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 font-semibold text-slate-900">{t.product_name}</td>
                      <td className="py-3.5 px-6 font-bold">{t.quantity > 0 ? `+${t.quantity}` : t.quantity}</td>
                      <td className="py-3.5 px-6 text-slate-600">{t.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Suppliers */}
        {activeTab === "suppliers" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suppliers.map(sup => (
              <div key={sup.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <h4 className="font-bold text-sm text-slate-900">{sup.name}</h4>
                <p className="text-xs text-slate-600">Contact: {sup.contact_person} • {sup.phone}</p>
                <p className="text-xs text-slate-500">Email: {sup.email} • GST: {sup.gst_tax_number}</p>
                <p className="text-xs text-slate-400">Address: {sup.address}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="Inventory Stock Adjustment"
      >
        <form onSubmit={handleAdjust} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Product *</label>
            <select
              required
              value={adjustForm.productId}
              onChange={(e) => setAdjustForm({ ...adjustForm, productId: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            >
              <option value="">-- Choose Product --</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Adjustment Type *</label>
              <select
                value={adjustForm.adjustmentType}
                onChange={(e) => setAdjustForm({ ...adjustForm, adjustmentType: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              >
                <option value="INCREASE">INCREASE (Inward / Restock)</option>
                <option value="DECREASE">DECREASE (Correction / Damage / Expiry)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Quantity *</label>
              <input
                type="number"
                min="1"
                required
                value={adjustForm.quantity}
                onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Reason / Reference *</label>
            <input
              type="text"
              required
              value={adjustForm.reason}
              onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
              placeholder="e.g. Physical inventory count reconciliation"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAdjustModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Processing..." : "Commit Adjustment"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
