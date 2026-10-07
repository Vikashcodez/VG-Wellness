import React, { useState, useEffect } from "react";
import Header from "../components/Header.jsx";
import { financeService } from "../services/financeService.js";
import Modal from "../components/Modal.jsx";
import { Plus, Search } from "lucide-react";

export default function Finance() {
  const [overview, setOverview] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  const [categoryFilter, setCategoryFilter] = useState("");
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    title: "",
    categoryId: "",
    amount: "",
    taxAmount: "0",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "BANK_TRANSFER",
    vendorPayee: "",
    referenceNumber: "",
    notes: ""
  });

  const loadFinanceData = async () => {
    setLoading(true);
    try {
      const [overviewRes, expRes, catRes] = await Promise.all([
        financeService.getOverview(),
        financeService.getExpenses({
          categoryId: categoryFilter || undefined,
          search: search || undefined
        }),
        financeService.getCategories()
      ]);
      setOverview(overviewRes.data || null);
      setExpenses(expRes.data || []);
      setCategories(catRes.data || []);
      if (!form.categoryId && catRes.data?.length > 0) {
        setForm((prev) => ({ ...prev, categoryId: catRes.data[0].id }));
      }
    } catch (err) {
      console.error("Error loading financial data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinanceData();
  }, [categoryFilter, search]);

  const handleRecordExpense = async (e) => {
    e.preventDefault();
    try {
      await financeService.createExpense({
        ...form,
        amount: parseFloat(form.amount || 0),
        taxAmount: parseFloat(form.taxAmount || 0),
        categoryId: parseInt(form.categoryId)
      });
      setIsAddExpenseOpen(false);
      setForm({
        title: "", categoryId: categories[0]?.id || "",
        amount: "", taxAmount: "0", paymentDate: new Date().toISOString().split("T")[0],
        paymentMethod: "BANK_TRANSFER", vendorPayee: "", referenceNumber: "", notes: ""
      });
      loadFinanceData();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const summary = overview?.summary || {
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
    accountsReceivable: 0
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#f4f6f8]">
      <Header
        title="Financial Ledger & P&L"
        subtitle="Gross revenue inflow, operational expenditure ledger, and receivables management"
        actions={
          <button
            onClick={() => setIsAddExpenseOpen(true)}
            className="crm-btn-primary"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Expense</span>
          </button>
        }
      />

      <div className="p-3.5 sm:p-5 space-y-3.5 flex-1 max-w-full">
        {/* High-density LeadSquared Financial Metric Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <div className="crm-stat-tile border-l-[3px] border-l-emerald-600">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Gross Inflow (Revenue)
            </span>
            <div className="text-xl sm:text-2xl font-bold text-emerald-700 mt-0.5">
              ₹{summary.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Realized receipts from client billing
            </p>
          </div>

          <div className="crm-stat-tile border-l-[3px] border-l-rose-600">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Operating Expenses
            </span>
            <div className="text-xl sm:text-2xl font-bold text-rose-600 mt-0.5">
              ₹{summary.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Lease, payroll, clinic utilities & stock
            </p>
          </div>

          <div className="crm-stat-tile border-l-[3px] border-l-blue-600">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Net Profit / Margin
            </span>
            <div className={`text-xl sm:text-2xl font-bold mt-0.5 ${summary.netProfit >= 0 ? "text-slate-900" : "text-amber-600"}`}>
              ₹{summary.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-blue-700 font-medium mt-0.5">
              Operating Margin: <span className="font-bold">{summary.profitMargin}%</span>
            </p>
          </div>

          <div className="crm-stat-tile border-l-[3px] border-l-amber-600">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Accounts Receivable
            </span>
            <div className="text-xl sm:text-2xl font-bold text-amber-700 mt-0.5">
              ₹{summary.accountsReceivable.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Unpaid patient ledger balance
            </p>
          </div>
        </div>

        {/* Expense Categories Breakdown */}
        {overview?.expenseByCategory && overview.expenseByCategory.length > 0 && (
          <div className="crm-card p-3 sm:p-3.5 space-y-2.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Expense Distribution by Category
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {overview.expenseByCategory.map((c, i) => {
                const pct = summary.totalExpenses > 0 ? ((parseFloat(c.total_amount) / summary.totalExpenses) * 100).toFixed(1) : 0;
                return (
                  <div key={i} className="p-2 rounded bg-slate-50 border border-slate-200">
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                      <span className="truncate">{c.category_name}</span>
                      <span className="text-slate-900 font-bold ml-1">₹{parseFloat(c.total_amount).toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 text-right font-medium">{pct}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filters & Expense Ledger Table */}
        <div className="crm-card overflow-hidden">
          <div className="p-2.5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-white">
            <span className="text-xs font-bold text-slate-900">Operational Expenses Ledger</span>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search title, payee, ref..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="crm-input pl-8 w-full sm:w-56"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="crm-input w-full sm:w-44"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading expenses ledger...
            </div>
          ) : expenses.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No expenses recorded matching criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Expense Code</th>
                    <th>Title & Description</th>
                    <th>Category</th>
                    <th>Payee / Vendor</th>
                    <th>Date & Mode</th>
                    <th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp) => (
                    <tr key={exp.id}>
                      <td className="font-mono font-bold text-slate-900 text-xs">
                        {exp.expense_code}
                      </td>
                      <td>
                        <div className="font-bold text-slate-900">{exp.title}</div>
                        {exp.notes && <div className="text-[11px] text-slate-500">{exp.notes}</div>}
                      </td>
                      <td>
                        <span className="crm-badge-neutral text-[10px]">
                          {exp.category_name || "General"}
                        </span>
                      </td>
                      <td className="text-slate-800 font-medium">
                        {exp.vendor_payee || "—"}
                      </td>
                      <td>
                        <div className="text-slate-800">{exp.payment_date}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{exp.payment_method}</div>
                      </td>
                      <td className="text-right font-bold text-slate-900">
                        ₹{parseFloat(exp.amount).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add Expense */}
      <Modal isOpen={isAddExpenseOpen} onClose={() => setIsAddExpenseOpen(false)} title="Record Operational Expense">
        <form onSubmit={handleRecordExpense} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Expense Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. October Facility Rent & Utilities"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="crm-input w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category *</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="crm-input w-full"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Net Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="45000"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="crm-input w-full font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tax / GST (₹)</label>
              <input
                type="number"
                step="0.01"
                value={form.taxAmount}
                onChange={(e) => setForm({ ...form, taxAmount: e.target.value })}
                className="crm-input w-full"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Vendor / Payee Name</label>
              <input
                type="text"
                placeholder="Landlord / Supplier"
                value={form.vendorPayee}
                onChange={(e) => setForm({ ...form, vendorPayee: e.target.value })}
                className="crm-input w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                className="crm-input w-full"
              >
                <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                <option value="UPI">UPI Digital Payment</option>
                <option value="CREDIT_CARD">Credit / Debit Card</option>
                <option value="CASH">Petty Cash</option>
                <option value="CHEQUE">Bank Cheque</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Date</label>
              <input
                type="date"
                value={form.paymentDate}
                onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
                className="crm-input w-full"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Reference / UTR / Cheque #</label>
            <input
              type="text"
              placeholder="UTR-HDFC-991823"
              value={form.referenceNumber}
              onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })}
              className="crm-input w-full font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Notes / Description</label>
            <textarea
              rows={2}
              placeholder="Purchased 20L medicated kshirabala oil"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="bg-white border border-slate-300 rounded text-xs text-slate-800 px-3 py-1.5 w-full focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddExpenseOpen(false)}
              className="crm-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="crm-btn-primary"
            >
              Save Expense
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
