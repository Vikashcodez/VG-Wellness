import React, { useEffect, useState } from "react";
import Header from "../components/Header.jsx";
import Modal from "../components/Modal.jsx";
import PrintInvoiceModal from "../components/PrintInvoiceModal.jsx";
import { billingService } from "../services/billingService.js";
import { clientService } from "../services/clientService.js";
import api from "../services/api.js";
import { Plus, Printer, Trash2, ShoppingBag, Stethoscope, Package, Edit3, DollarSign } from "lucide-react";

export default function Billing() {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Print invoice modal
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printInvoiceData, setPrintInvoiceData] = useState(null);

  // Create invoice modal
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invClient, setInvClient] = useState("");
  const [invItems, setInvItems] = useState([
    {
      itemType: "SERVICE",
      selectedId: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      taxRate: 18,
      referenceId: null
    }
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
      const [iRes, cRes, sRes, pRes, pkgRes] = await Promise.all([
        billingService.getInvoices(),
        clientService.getAll({ limit: 100 }),
        api.get("/services"),
        api.get("/products"),
        api.get("/packages")
      ]);
      if (iRes.success) setInvoices(iRes.data);
      if (cRes.success) setClients(cRes.data);
      if (sRes.data.success) {
        setServices(sRes.data.data);
        // Pre-fill initial item if empty
        if (sRes.data.data.length > 0 && (!invItems[0]?.selectedId && !invItems[0]?.description)) {
          const s = sRes.data.data[0];
          setInvItems([
            {
              itemType: "SERVICE",
              selectedId: s.id,
              description: s.name,
              quantity: 1,
              unitPrice: parseFloat(s.price),
              taxRate: parseFloat(s.tax_rate ?? 18),
              referenceId: s.id
            }
          ]);
        }
      }
      if (pRes.data.success) setProducts(pRes.data.data);
      if (pkgRes.data.success) setPackages(pkgRes.data.data);
    } catch (err) {
      console.error("Error fetching billing data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleAddItem = () => {
    const defaultService = services.length > 0 ? services[0] : null;
    setInvItems([
      ...invItems,
      {
        itemType: "SERVICE",
        selectedId: defaultService ? defaultService.id : "",
        description: defaultService ? defaultService.name : "Clinical Consultation",
        quantity: 1,
        unitPrice: defaultService ? parseFloat(defaultService.price) : 1000,
        taxRate: defaultService ? parseFloat(defaultService.tax_rate ?? 18) : 18,
        referenceId: defaultService ? defaultService.id : null
      }
    ]);
  };

  const handleItemTypeChange = (index, newType) => {
    const updated = [...invItems];
    let selectedId = "";
    let description = "";
    let unitPrice = 0;
    let taxRate = 18;
    let referenceId = null;

    if (newType === "SERVICE" && services.length > 0) {
      const s = services[0];
      selectedId = s.id;
      description = s.name;
      unitPrice = parseFloat(s.price);
      taxRate = parseFloat(s.tax_rate ?? 18);
      referenceId = s.id;
    } else if (newType === "PRODUCT" && products.length > 0) {
      const p = products[0];
      selectedId = p.id;
      description = `${p.name} [SKU: ${p.sku}]`;
      unitPrice = parseFloat(p.price);
      taxRate = parseFloat(p.tax_rate ?? 12);
      referenceId = p.id;
    } else if (newType === "PACKAGE" && packages.length > 0) {
      const pkg = packages[0];
      selectedId = pkg.id;
      description = `${pkg.name} (Package)`;
      unitPrice = parseFloat(pkg.price);
      taxRate = 18;
      referenceId = pkg.id;
    } else if (newType === "CUSTOM") {
      description = "Custom Fee / Service";
      unitPrice = 500;
      taxRate = 18;
    }

    updated[index] = {
      ...updated[index],
      itemType: newType,
      selectedId,
      description,
      unitPrice,
      taxRate,
      referenceId
    };
    setInvItems(updated);
  };

  const handleItemSelect = (index, selectedId) => {
    const updated = [...invItems];
    const item = updated[index];
    if (item.itemType === "SERVICE") {
      const s = services.find((x) => String(x.id) === String(selectedId));
      if (s) {
        item.selectedId = s.id;
        item.description = s.name;
        item.unitPrice = parseFloat(s.price);
        item.taxRate = parseFloat(s.tax_rate ?? 18);
        item.referenceId = s.id;
      }
    } else if (item.itemType === "PRODUCT") {
      const p = products.find((x) => String(x.id) === String(selectedId));
      if (p) {
        item.selectedId = p.id;
        item.description = `${p.name} [SKU: ${p.sku}]`;
        item.unitPrice = parseFloat(p.price);
        item.taxRate = parseFloat(p.tax_rate ?? 12);
        item.referenceId = p.id;
      }
    } else if (item.itemType === "PACKAGE") {
      const pkg = packages.find((x) => String(x.id) === String(selectedId));
      if (pkg) {
        item.selectedId = pkg.id;
        item.description = `${pkg.name} (Package)`;
        item.unitPrice = parseFloat(pkg.price);
        item.taxRate = 18;
        item.referenceId = pkg.id;
      }
    }
    setInvItems(updated);
  };

  const handleRemoveItem = (index) => {
    if (invItems.length <= 1) {
      alert("An invoice must contain at least one line item.");
      return;
    }
    setInvItems(invItems.filter((_, i) => i !== index));
  };

  const handleOpenPrint = async (inv) => {
    try {
      const res = await billingService.getInvoiceById(inv.id);
      setPrintInvoiceData(res.data || inv);
    } catch {
      setPrintInvoiceData(inv);
    }
    setIsPrintModalOpen(true);
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!invClient || invItems.length === 0) {
      alert("Please select a client and provide line items.");
      return;
    }
    setCreatingInv(true);
    try {
      await billingService.createInvoice({
        clientId: parseInt(invClient),
        items: invItems.map((it) => ({
          description: it.description || "Service item",
          quantity: parseInt(it.quantity) || 1,
          unitPrice: parseFloat(it.unitPrice) || 0,
          taxRate: parseFloat(it.taxRate) || 0,
          itemType: it.itemType || "SERVICE",
          referenceId: it.referenceId || null
        })),
        discount: parseFloat(invDiscount) || 0,
        notes: invNotes
      });
      setIsInvoiceModalOpen(false);
      await fetchInvoices();
      alert("Tax Invoice generated successfully!");
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
      await fetchInvoices();
      alert("Payment recorded successfully!");
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to record payment");
    } finally {
      setRecordingPay(false);
    }
  };

  // Calculations for Create Modal
  const subtotalCalc = invItems.reduce(
    (acc, it) => acc + (parseFloat(it.unitPrice) || 0) * (parseInt(it.quantity) || 1),
    0
  );
  const taxCalc = invItems.reduce((acc, it) => {
    const lineSub = (parseFloat(it.unitPrice) || 0) * (parseInt(it.quantity) || 1);
    return acc + lineSub * ((parseFloat(it.taxRate) || 0) / 100);
  }, 0);
  const discountCalc = parseFloat(invDiscount) || 0;
  const grandTotalCalc = Math.max(0, subtotalCalc + taxCalc - discountCalc);

  // Overall metrics
  const totalBilled = invoices.reduce((acc, i) => acc + (parseFloat(i.total_amount) || 0), 0);
  const totalPaid = invoices.reduce((acc, i) => acc + (parseFloat(i.paid_amount) || 0), 0);
  const totalBalance = invoices.reduce((acc, i) => acc + (parseFloat(i.balance_amount) || 0), 0);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#f4f6f8]">
      <Header
        title="Billing & Invoices Ledger"
        subtitle="Tax invoice generation, payments collection, and accounts ledger"
        actions={
          <button
            onClick={() => setIsInvoiceModalOpen(true)}
            className="crm-btn-primary"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Generate Invoice</span>
          </button>
        }
      />

      <div className="p-3.5 sm:p-5 space-y-3 flex-1 max-w-full">
        {/* Metric Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <div className="crm-stat-tile border-l-[3px] border-l-blue-600">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Total Invoiced
            </span>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
              ₹{totalBilled.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              {invoices.length} invoices generated
            </p>
          </div>

          <div className="crm-stat-tile border-l-[3px] border-l-emerald-600">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Collected Revenue
            </span>
            <div className="text-xl sm:text-2xl font-bold text-emerald-700 mt-0.5">
              ₹{totalPaid.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Realized receipts
            </p>
          </div>

          <div className="crm-stat-tile border-l-[3px] border-l-rose-500">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Outstanding Balance
            </span>
            <div className="text-xl sm:text-2xl font-bold text-rose-600 mt-0.5">
              ₹{totalBalance.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Pending client dues
            </p>
          </div>

          <div className="crm-stat-tile border-l-[3px] border-l-indigo-600">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Catalog Available
            </span>
            <div className="text-xl sm:text-2xl font-bold text-indigo-700 mt-0.5">
              {services.length + products.length}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              {services.length} services • {products.length} products
            </p>
          </div>
        </div>

        {/* Invoices Ledger Table */}
        <div className="crm-card overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading invoices ledger...
            </div>
          ) : invoices.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No invoices generated yet. Click "Generate Invoice" above to create your first bill.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Client Name</th>
                    <th>Date</th>
                    <th className="text-right">Total (₹)</th>
                    <th className="text-right">Paid (₹)</th>
                    <th className="text-right">Balance (₹)</th>
                    <th className="text-center">Status</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="font-mono font-bold text-blue-700 text-xs">
                        {inv.invoice_number}
                      </td>
                      <td>
                        <div className="font-bold text-slate-900">
                          {inv.client_first_name} {inv.client_last_name}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {inv.client_code} {inv.client_mobile && `• ${inv.client_mobile}`}
                        </span>
                      </td>
                      <td className="text-slate-600 text-[11px]">
                        {inv.invoice_date ? inv.invoice_date.split("T")[0] : inv.created_at?.split("T")[0]}
                      </td>
                      <td className="text-right font-extrabold text-slate-900">
                        ₹{parseFloat(inv.total_amount).toLocaleString()}
                      </td>
                      <td className="text-right font-semibold text-emerald-700">
                        ₹{parseFloat(inv.paid_amount || 0).toLocaleString()}
                      </td>
                      <td className="text-right font-bold text-rose-600">
                        ₹{parseFloat(inv.balance_amount || 0).toLocaleString()}
                      </td>
                      <td className="text-center">
                        <span
                          className={
                            inv.status === "PAID"
                              ? "crm-badge-success"
                              : inv.status === "PARTIAL"
                              ? "crm-badge-warning"
                              : "crm-badge-neutral"
                          }
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="inline-flex items-center gap-1.5">
                          {parseFloat(inv.balance_amount) > 0 && (
                            <button
                              onClick={() => {
                                setActiveInvoice(inv);
                                setPayAmount(inv.balance_amount);
                                setIsPayModalOpen(true);
                              }}
                              className="crm-btn-primary text-[10px] py-1 px-2.5 h-6"
                              title="Collect Payment"
                            >
                              Collect
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenPrint(inv)}
                            className="crm-btn-secondary text-[10px] py-1 px-2.5 h-6 inline-flex items-center gap-1 text-slate-700"
                            title="Print Tax Invoice"
                          >
                            <Printer className="w-3 h-3 text-slate-500" />
                            <span>Print</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Tax Invoice Modal */}
      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        title="Generate Official Tax Invoice"
      >
        <form onSubmit={handleCreateInvoice} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Client *</label>
            <select
              required
              value={invClient}
              onChange={(e) => setInvClient(e.target.value)}
              className="crm-input w-full"
            >
              <option value="">-- Choose Client ({clients.length} registered) --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name} ({c.client_code}) {c.mobile ? `— ${c.mobile}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Line Items Container */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex justify-between items-center">
              <label className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Invoice Line Items ({invItems.length})
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="crm-btn-secondary text-[11px] h-7 px-2.5 inline-flex items-center gap-1 text-blue-700"
              >
                <Plus className="w-3 h-3" />
                <span>Add Item Line</span>
              </button>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {invItems.map((item, index) => {
                const lineSub = (parseFloat(item.unitPrice) || 0) * (parseInt(item.quantity) || 1);
                const lineTax = lineSub * ((parseFloat(item.taxRate) || 0) / 100);
                const lineTotal = lineSub + lineTax;

                return (
                  <div
                    key={index}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/90 space-y-2 hover:border-slate-300 transition"
                  >
                    {/* Item Type Selector Tabs */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleItemTypeChange(index, "SERVICE")}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                            item.itemType === "SERVICE"
                              ? "bg-blue-600 text-white"
                              : "bg-slate-200/80 text-slate-600 hover:bg-slate-300"
                          }`}
                        >
                          Clinical Service ({services.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => handleItemTypeChange(index, "PRODUCT")}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                            item.itemType === "PRODUCT"
                              ? "bg-blue-600 text-white"
                              : "bg-slate-200/80 text-slate-600 hover:bg-slate-300"
                          }`}
                        >
                          Product ({products.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => handleItemTypeChange(index, "PACKAGE")}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                            item.itemType === "PACKAGE"
                              ? "bg-blue-600 text-white"
                              : "bg-slate-200/80 text-slate-600 hover:bg-slate-300"
                          }`}
                        >
                          Package ({packages.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => handleItemTypeChange(index, "CUSTOM")}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                            item.itemType === "CUSTOM"
                              ? "bg-blue-600 text-white"
                              : "bg-slate-200/80 text-slate-600 hover:bg-slate-300"
                          }`}
                        >
                          Custom
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-rose-500 hover:text-rose-700 p-0.5"
                        title="Remove item line"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Selector & Auto-fill Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <div className="sm:col-span-6">
                        {item.itemType === "SERVICE" ? (
                          <select
                            value={item.selectedId}
                            onChange={(e) => handleItemSelect(index, e.target.value)}
                            className="crm-input w-full py-1 text-xs font-medium"
                          >
                            <option value="">-- Select Service --</option>
                            {services.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} — ₹{parseFloat(s.price).toLocaleString()} ({s.duration_minutes}m)
                              </option>
                            ))}
                          </select>
                        ) : item.itemType === "PRODUCT" ? (
                          <select
                            value={item.selectedId}
                            onChange={(e) => handleItemSelect(index, e.target.value)}
                            className="crm-input w-full py-1 text-xs font-medium"
                          >
                            <option value="">-- Select Product --</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} [{p.sku}] — ₹{parseFloat(p.price).toLocaleString()}
                              </option>
                            ))}
                          </select>
                        ) : item.itemType === "PACKAGE" ? (
                          <select
                            value={item.selectedId}
                            onChange={(e) => handleItemSelect(index, e.target.value)}
                            className="crm-input w-full py-1 text-xs font-medium"
                          >
                            <option value="">-- Select Package --</option>
                            {packages.map((pkg) => (
                              <option key={pkg.id} value={pkg.id}>
                                {pkg.name} — ₹{parseFloat(pkg.price).toLocaleString()} ({pkg.duration_days}d)
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            required
                            value={item.description}
                            onChange={(e) => {
                              const updated = [...invItems];
                              updated[index].description = e.target.value;
                              setInvItems(updated);
                            }}
                            placeholder="Enter custom description..."
                            className="crm-input w-full py-1 text-xs"
                          />
                        )}
                      </div>

                      {/* Quantity */}
                      <div className="sm:col-span-2">
                        <div className="flex items-center">
                          <span className="text-[10px] text-slate-400 mr-1 font-semibold">Qty:</span>
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
                            className="crm-input w-full py-1 text-xs text-center"
                          />
                        </div>
                      </div>

                      {/* Unit Price (Auto-filled but editable) */}
                      <div className="sm:col-span-2">
                        <div className="flex items-center">
                          <span className="text-[10px] text-slate-400 mr-1 font-semibold">₹:</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            required
                            value={item.unitPrice}
                            onChange={(e) => {
                              const updated = [...invItems];
                              updated[index].unitPrice = parseFloat(e.target.value) || 0;
                              setInvItems(updated);
                            }}
                            className="crm-input w-full py-1 text-xs text-right font-semibold"
                            placeholder="Price"
                          />
                        </div>
                      </div>

                      {/* GST % */}
                      <div className="sm:col-span-2">
                        <div className="flex items-center">
                          <span className="text-[10px] text-slate-400 mr-1 font-semibold">GST%:</span>
                          <input
                            type="number"
                            min="0"
                            value={item.taxRate}
                            onChange={(e) => {
                              const updated = [...invItems];
                              updated[index].taxRate = parseFloat(e.target.value) || 0;
                              setInvItems(updated);
                            }}
                            className="crm-input w-full py-1 text-xs text-center"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Row Summary */}
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60 text-slate-500">
                      <span>{item.description || "Item line"}</span>
                      <span>
                        Subtotal: ₹{lineSub.toLocaleString()} + GST: ₹{lineTax.toFixed(2)} ={" "}
                        <strong className="text-slate-900 font-bold">₹{lineTotal.toFixed(2)}</strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Calculations Breakdown */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5 text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal:</span>
                <span className="font-semibold text-slate-800">₹{subtotalCalc.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Estimated Taxes (GST):</span>
                <span className="font-semibold text-slate-800">₹{taxCalc.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-200/60">
                <span>Direct Bill Discount (₹):</span>
                <input
                  type="number"
                  min="0"
                  value={invDiscount}
                  onChange={(e) => setInvDiscount(e.target.value)}
                  className="crm-input w-28 py-0.5 text-right font-bold text-xs"
                  placeholder="0"
                />
              </div>
              <div className="flex justify-between text-slate-900 font-extrabold text-xs sm:text-sm pt-1.5 border-t border-slate-200">
                <span>Net Grand Total Payable:</span>
                <span className="text-blue-700 text-base">₹{grandTotalCalc.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Billing Remarks & Payment Terms</label>
            <input
              type="text"
              value={invNotes}
              onChange={(e) => setInvNotes(e.target.value)}
              className="crm-input w-full"
              placeholder="e.g. Payment due in 7 days, include complimentary consultation voucher..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsInvoiceModalOpen(false)}
              className="crm-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creatingInv}
              className="crm-btn-primary"
            >
              {creatingInv ? "Generating..." : `Generate Tax Invoice (₹${grandTotalCalc.toLocaleString()})`}
            </button>
          </div>
        </form>
      </Modal>

      {/* Collect Payment Modal */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title={`Collect Payment (${activeInvoice?.invoice_number})`}
      >
        <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Payment Amount (Due: ₹{activeInvoice?.balance_amount}) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              max={activeInvoice?.balance_amount}
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              className="crm-input w-full font-bold text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Method *</label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="crm-input w-full"
              >
                <option value="UPI">UPI / Net Banking</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Credit / Debit Card</option>
                <option value="NET_BANKING">Bank Transfer</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reference #</label>
              <input
                type="text"
                value={payRef}
                onChange={(e) => setPayRef(e.target.value)}
                placeholder="UPI UTR / Cheque #"
                className="crm-input w-full"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsPayModalOpen(false)}
              className="crm-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={recordingPay}
              className="crm-btn-primary"
            >
              {recordingPay ? "Saving..." : "Record Payment Receipt"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Print Tax Invoice Modal */}
      <PrintInvoiceModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        invoice={printInvoiceData}
      />
    </div>
  );
}
