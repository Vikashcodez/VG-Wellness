import React, { useEffect, useState } from "react";
import Header from "../components/Header.jsx";
import Modal from "../components/Modal.jsx";
import { inventoryService } from "../services/inventoryService.js";
import { productService } from "../services/productService.js";
import {
  Boxes,
  Plus,
  ArrowUpDown,
  History,
  Truck,
  FileText,
  Edit2,
  Trash2,
  Calendar,
  DollarSign,
  PackageCheck,
  CheckCircle2,
  Eye
} from "lucide-react";

export default function Inventory() {
  const [stock, setStock] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [grns, setGrns] = useState([]);
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

  // Supplier modal
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [supplierForm, setSupplierForm] = useState({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    gstTaxNumber: "",
    isActive: true
  });

  // GRN Modal
  const [isGrnModalOpen, setIsGrnModalOpen] = useState(false);
  const [grnForm, setGrnForm] = useState({
    supplierId: "",
    invoiceNumber: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    receivedDate: new Date().toISOString().split("T")[0],
    notes: "",
    items: [
      {
        productId: "",
        batchNumber: `BAT-${Date.now().toString().slice(-5)}`,
        expiryDate: "",
        quantity: 10,
        unitCost: 100,
        mrp: 150
      }
    ]
  });

  // GRN Detail View Modal
  const [selectedGrnDetail, setSelectedGrnDetail] = useState(null);
  const [isGrnDetailModalOpen, setIsGrnDetailModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sRes, tRes, pRes, supRes, grnRes] = await Promise.all([
        inventoryService.getStock(),
        inventoryService.getTransactions(),
        productService.getAll(),
        inventoryService.getSuppliers(),
        inventoryService.getGRNs()
      ]);
      if (sRes.success) setStock(sRes.data);
      if (tRes.success) setTransactions(tRes.data);
      if (pRes.success) setProducts(pRes.data);
      if (supRes.success) setSuppliers(supRes.data);
      if (grnRes.success) setGrns(grnRes.data);
    } catch (err) {
      console.error("Error loading inventory data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Stock Adjustment Submit
  const handleAdjust = async (e) => {
    e.preventDefault();
    if (!adjustForm.productId) {
      alert("Please select a product");
      return;
    }
    setSubmitting(true);
    try {
      await inventoryService.adjustStock({
        productId: parseInt(adjustForm.productId),
        adjustmentType: adjustForm.adjustmentType,
        quantity: parseInt(adjustForm.quantity),
        reason: adjustForm.reason
      });
      setIsAdjustModalOpen(false);
      await loadData();
      alert("Inventory updated successfully!");
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to adjust stock");
    } finally {
      setSubmitting(false);
    }
  };

  // Supplier Actions
  const openAddSupplier = () => {
    setEditingSupplier(null);
    setSupplierForm({
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      gstTaxNumber: "",
      isActive: true
    });
    setIsSupplierModalOpen(true);
  };

  const openEditSupplier = (sup) => {
    setEditingSupplier(sup);
    setSupplierForm({
      name: sup.name || "",
      contactPerson: sup.contact_person || "",
      email: sup.email || "",
      phone: sup.phone || "",
      address: sup.address || "",
      gstTaxNumber: sup.gst_tax_number || "",
      isActive: sup.is_active !== false
    });
    setIsSupplierModalOpen(true);
  };

  const handleSupplierSubmit = async (e) => {
    e.preventDefault();
    if (!supplierForm.name || !supplierForm.phone) {
      alert("Supplier name and phone are required.");
      return;
    }
    setSubmitting(true);
    try {
      if (editingSupplier) {
        await inventoryService.updateSupplier(editingSupplier.id, supplierForm);
      } else {
        await inventoryService.createSupplier(supplierForm);
      }
      setIsSupplierModalOpen(false);
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to save supplier");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSupplier = async (id, name) => {
    if (!window.confirm(`Are you sure you want to deactivate supplier "${name}"?`)) return;
    try {
      await inventoryService.deleteSupplier(id);
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to deactivate supplier");
    }
  };

  // GRN Actions
  const openCreateGrn = () => {
    setGrnForm({
      supplierId: suppliers.length > 0 ? suppliers[0].id : "",
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      invoiceDate: new Date().toISOString().split("T")[0],
      receivedDate: new Date().toISOString().split("T")[0],
      notes: "Standard shipment inwards received and quality verified",
      items: [
        {
          productId: products.length > 0 ? products[0].id : "",
          batchNumber: `BAT-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
          expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split("T")[0],
          quantity: 20,
          unitCost: products.length > 0 && products[0].cost_price ? products[0].cost_price : 500,
          mrp: products.length > 0 && products[0].price ? products[0].price : 750
        }
      ]
    });
    setIsGrnModalOpen(true);
  };

  const addGrnItemRow = () => {
    setGrnForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productId: products.length > 0 ? products[0].id : "",
          batchNumber: `BAT-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
          expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split("T")[0],
          quantity: 10,
          unitCost: 200,
          mrp: 350
        }
      ]
    }));
  };

  const removeGrnItemRow = (index) => {
    if (grnForm.items.length <= 1) {
      alert("A GRN entry must have at least one line item.");
      return;
    }
    setGrnForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateGrnItem = (index, field, value) => {
    setGrnForm((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
  };

  const calculateGrnTotal = () => {
    return grnForm.items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const cost = parseFloat(item.unitCost) || 0;
      return sum + qty * cost;
    }, 0);
  };

  const handleGrnSubmit = async (e) => {
    e.preventDefault();
    if (!grnForm.supplierId) {
      alert("Please select a supplier");
      return;
    }
    if (grnForm.items.some((it) => !it.productId || !it.quantity || !it.unitCost)) {
      alert("Please ensure all item rows have a product, quantity, and unit cost specified.");
      return;
    }

    setSubmitting(true);
    try {
      await inventoryService.createGRN({
        supplierId: parseInt(grnForm.supplierId),
        invoiceNumber: grnForm.invoiceNumber,
        invoiceDate: grnForm.invoiceDate,
        receivedDate: grnForm.receivedDate,
        notes: grnForm.notes,
        items: grnForm.items.map((it) => ({
          productId: parseInt(it.productId),
          batchNumber: it.batchNumber,
          expiryDate: it.expiryDate || null,
          quantity: parseInt(it.quantity),
          unitCost: parseFloat(it.unitCost),
          mrp: parseFloat(it.mrp)
        }))
      });

      setIsGrnModalOpen(false);
      await loadData();
      setActiveTab("grn");
      alert("Goods Receipt Note (GRN) created successfully! Inventory stock has been credited.");
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to create GRN");
    } finally {
      setSubmitting(false);
    }
  };

  const viewGrnDetails = async (grnId) => {
    try {
      const res = await inventoryService.getGRNById(grnId);
      if (res.success) {
        setSelectedGrnDetail(res.data);
        setIsGrnDetailModalOpen(true);
      }
    } catch (err) {
      alert("Error fetching GRN details");
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#f4f6f8]">
      <Header
        title="Inventory & Stock Management"
        subtitle="Batch-level inventory tracking, Goods Receipt Notes (GRN), suppliers master & movement ledger"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAdjustModalOpen(true)}
              className="crm-btn-secondary"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Stock Adjustment</span>
            </button>
            <button
              onClick={openCreateGrn}
              className="crm-btn-primary"
            >
              <PackageCheck className="w-3.5 h-3.5" />
              <span>Create GRN Entry</span>
            </button>
          </div>
        }
      />

      <div className="p-3.5 sm:p-5 space-y-3 flex-1 max-w-full">
        {/* Navigation Tabs */}
        <div className="crm-card p-1.5 flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab("stock")}
            className={`px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeTab === "stock"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
            }`}
          >
            Stock Batches ({stock.length})
          </button>
          <button
            onClick={() => setActiveTab("grn")}
            className={`px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeTab === "grn"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
            }`}
          >
            Goods Receipt Notes (GRN) ({grns.length})
          </button>
          <button
            onClick={() => setActiveTab("suppliers")}
            className={`px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeTab === "suppliers"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
            }`}
          >
            Suppliers Master ({suppliers.length})
          </button>
          <button
            onClick={() => setActiveTab("transactions")}
            className={`px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeTab === "transactions"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
            }`}
          >
            Movement Ledger ({transactions.length})
          </button>
        </div>

        {/* Tab 1: Stock Batches */}
        {activeTab === "stock" && (
          <div className="crm-card overflow-hidden">
            {loading ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading inventory stock batches...
              </div>
            ) : stock.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No stock batches found. Inward stock via GRN Entry above.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="crm-table">
                  <thead>
                    <tr>
                      <th>Product & SKU</th>
                      <th>Batch Number</th>
                      <th>Expiry Date</th>
                      <th className="text-center">Stock In Hand</th>
                      <th>Purchase Cost / MRP</th>
                      <th>Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stock.map((s) => (
                      <tr key={s.id}>
                        <td>
                          <div className="font-bold text-slate-900">{s.product_name}</div>
                          <span className="font-mono text-[10px] text-slate-500">{s.sku}</span>
                        </td>
                        <td className="font-mono font-semibold text-slate-800">{s.batch_number}</td>
                        <td className="font-medium text-slate-700">{s.expiry_date ? s.expiry_date.split("T")[0] : "—"}</td>
                        <td className="text-center">
                          <span className={s.quantity <= 10 ? "crm-badge-danger" : "crm-badge-success"}>
                            {s.quantity} units
                          </span>
                        </td>
                        <td className="text-slate-700">
                          ₹{parseFloat(s.purchase_price || 0).toLocaleString()} / <strong className="text-slate-900">₹{parseFloat(s.selling_price || 0).toLocaleString()}</strong>
                        </td>
                        <td className="text-slate-500">{s.location_name || "Central Medical Store"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: GRN Inward Receipts */}
        {activeTab === "grn" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  Goods Receipt Notes (Inward Stock Register)
                </h3>
                <p className="text-[11px] text-slate-500">
                  All inward shipments accepted into pharmacy and clinic stores
                </p>
              </div>
              <button
                onClick={openCreateGrn}
                className="crm-btn-primary"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New GRN Entry</span>
              </button>
            </div>

            <div className="crm-card overflow-hidden">
              {grns.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No Goods Receipt Notes recorded yet. Click "New GRN Entry" to receive stock.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="crm-table">
                    <thead>
                      <tr>
                        <th>GRN #</th>
                        <th>Supplier</th>
                        <th>Invoice Ref</th>
                        <th>Received Date</th>
                        <th className="text-center">Line Items</th>
                        <th className="text-right">Total Inward Value</th>
                        <th className="text-center">Status</th>
                        <th className="text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grns.map((g) => (
                        <tr key={g.id}>
                          <td className="font-mono font-bold text-blue-700">{g.grn_number}</td>
                          <td>
                            <div className="font-bold text-slate-900">{g.supplier_name || "Vendor"}</div>
                            <div className="text-[10px] text-slate-400">{g.contact_person} {g.supplier_phone && `• ${g.supplier_phone}`}</div>
                          </td>
                          <td className="font-mono text-slate-700">
                            <div>{g.invoice_number || "—"}</div>
                            {g.invoice_date && (
                              <div className="text-[10px] text-slate-400">{g.invoice_date.split("T")[0]}</div>
                            )}
                          </td>
                          <td className="text-slate-700">
                            {g.received_date ? g.received_date.split("T")[0] : g.created_at?.split("T")[0]}
                          </td>
                          <td className="text-center font-bold text-slate-800">
                            {g.item_count || 1} items
                          </td>
                          <td className="text-right font-extrabold text-slate-900">
                            ₹{parseFloat(g.total_amount || 0).toLocaleString()}
                          </td>
                          <td className="text-center">
                            <span className="crm-badge-success text-[10px]">
                              {g.status || "RECEIVED"}
                            </span>
                          </td>
                          <td className="text-center">
                            <button
                              onClick={() => viewGrnDetails(g.id)}
                              className="crm-btn-secondary text-[11px] h-7 px-2.5 inline-flex items-center gap-1 text-blue-700 hover:bg-blue-50"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Suppliers Master */}
        {activeTab === "suppliers" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  Approved Suppliers & Pharmaceutical Vendors Master
                </h3>
                <p className="text-[11px] text-slate-500">
                  Directory of herbal raw materials, nutraceuticals, and medical inventory vendors
                </p>
              </div>
              <button
                onClick={openAddSupplier}
                className="crm-btn-primary"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Supplier</span>
              </button>
            </div>

            <div className="crm-card overflow-hidden">
              {suppliers.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No suppliers found. Click "+ Add Supplier" to add vendor contact records.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="crm-table">
                    <thead>
                      <tr>
                        <th>Vendor / Company Name</th>
                        <th>Contact Person</th>
                        <th>Phone & Email</th>
                        <th>GST / Tax ID</th>
                        <th>Address</th>
                        <th className="text-center">Status</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {suppliers.map((sup) => (
                        <tr key={sup.id}>
                          <td>
                            <div className="font-bold text-slate-900">{sup.name}</div>
                          </td>
                          <td className="font-semibold text-slate-800">
                            {sup.contact_person || "—"}
                          </td>
                          <td>
                            <div className="text-blue-700 font-medium">{sup.phone}</div>
                            {sup.email && <div className="text-[10px] text-slate-400">{sup.email}</div>}
                          </td>
                          <td className="font-mono text-slate-700 text-[11px]">
                            {sup.gst_tax_number || "—"}
                          </td>
                          <td className="text-slate-600 text-[11px] max-w-xs truncate">
                            {sup.address || "—"}
                          </td>
                          <td className="text-center">
                            <span className={sup.is_active ? "crm-badge-success" : "crm-badge-neutral"}>
                              {sup.is_active ? "ACTIVE" : "INACTIVE"}
                            </span>
                          </td>
                          <td className="text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => openEditSupplier(sup)}
                                className="crm-btn-secondary text-[11px] h-7 px-2 inline-flex items-center gap-1 text-slate-700 hover:text-blue-700"
                                title="Edit Supplier"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteSupplier(sup.id, sup.name)}
                                className="crm-btn-secondary text-[11px] h-7 px-2 text-rose-600 hover:bg-rose-50"
                                title="Deactivate Supplier"
                              >
                                <Trash2 className="w-3 h-3" />
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
        )}

        {/* Tab 4: Transactions Ledger */}
        {activeTab === "transactions" && (
          <div className="crm-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Transaction Type</th>
                    <th>Product</th>
                    <th className="text-center">Quantity Delta</th>
                    <th>Notes / Audit Reference</th>
                    <th>Handled By</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id}>
                      <td className="text-slate-600 text-[11px]">
                        {new Date(t.created_at).toLocaleString()}
                      </td>
                      <td>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.transaction_type === "SALE"
                              ? "bg-blue-100 text-blue-800"
                              : t.transaction_type === "PURCHASE"
                              ? "bg-emerald-100 text-emerald-800"
                              : t.transaction_type === "RETURN"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {t.transaction_type}
                        </span>
                      </td>
                      <td className="font-semibold text-slate-900">{t.product_name}</td>
                      <td className="text-center font-bold">
                        <span className={t.quantity > 0 ? "text-emerald-700" : "text-rose-700"}>
                          {t.quantity > 0 ? `+${t.quantity}` : t.quantity}
                        </span>
                      </td>
                      <td className="text-slate-600 text-[11px]">{t.notes}</td>
                      <td className="text-slate-500 text-[11px]">
                        {t.first_name ? `${t.first_name} ${t.last_name || ""}` : "System Admin"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Adjust Stock */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="Inventory Stock Adjustment"
      >
        <form onSubmit={handleAdjust} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Product *</label>
            <select
              required
              value={adjustForm.productId}
              onChange={(e) => setAdjustForm({ ...adjustForm, productId: e.target.value })}
              className="crm-input w-full"
            >
              <option value="">-- Choose Product --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Adjustment Type *</label>
              <select
                value={adjustForm.adjustmentType}
                onChange={(e) => setAdjustForm({ ...adjustForm, adjustmentType: e.target.value })}
                className="crm-input w-full"
              >
                <option value="INCREASE">INCREASE (Inward / Restock)</option>
                <option value="DECREASE">DECREASE (Damage / Spoilage / Correction)</option>
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
                className="crm-input w-full"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Reason / Notes *</label>
            <input
              type="text"
              required
              value={adjustForm.reason}
              onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
              className="crm-input w-full"
              placeholder="e.g. Audit correction, supplier replacement..."
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdjustModalOpen(false)}
              className="crm-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="crm-btn-primary"
            >
              {submitting ? "Updating..." : "Commit Stock Adjustment"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add / Edit Supplier */}
      <Modal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        title={editingSupplier ? `Edit Supplier: ${editingSupplier.name}` : "Register New Supplier Vendor"}
      >
        <form onSubmit={handleSupplierSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Supplier / Company Name *</label>
              <input
                type="text"
                required
                value={supplierForm.name}
                onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                className="crm-input w-full"
                placeholder="e.g. Himalaya Wellness Life Sciences Ltd"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Person *</label>
              <input
                type="text"
                required
                value={supplierForm.contactPerson}
                onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
                className="crm-input w-full"
                placeholder="e.g. R. Subramanian"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Phone *</label>
              <input
                type="text"
                required
                value={supplierForm.phone}
                onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                className="crm-input w-full"
                placeholder="+91 98765 43210"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Official Email</label>
              <input
                type="email"
                value={supplierForm.email}
                onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                className="crm-input w-full"
                placeholder="orders@vendor.com"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">GST / Tax Number</label>
              <input
                type="text"
                value={supplierForm.gstTaxNumber}
                onChange={(e) => setSupplierForm({ ...supplierForm, gstTaxNumber: e.target.value })}
                className="crm-input w-full font-mono uppercase"
                placeholder="29AAAAA0000A1Z5"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Registered Address / Warehouse</label>
              <textarea
                rows={2}
                value={supplierForm.address}
                onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                className="crm-input w-full"
                placeholder="Plot 45, Industrial Area, Peenya, Bengaluru, Karnataka"
              />
            </div>

            <div className="sm:col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="supActive"
                checked={supplierForm.isActive}
                onChange={(e) => setSupplierForm({ ...supplierForm, isActive: e.target.checked })}
                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="supActive" className="text-slate-700 font-medium cursor-pointer">
                Active Supplier for Procurement
              </label>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsSupplierModalOpen(false)}
              className="crm-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="crm-btn-primary"
            >
              {submitting ? "Saving..." : editingSupplier ? "Update Supplier" : "Register Supplier"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Create Goods Receipt Note (GRN) Inward */}
      <Modal
        isOpen={isGrnModalOpen}
        onClose={() => setIsGrnModalOpen(false)}
        title="Create Goods Receipt Note (GRN) Inward Entry"
      >
        <form onSubmit={handleGrnSubmit} className="space-y-4 text-xs">
          <div className="bg-blue-50/60 p-3 rounded-lg border border-blue-200 text-blue-900 leading-relaxed">
            Record incoming supplier shipments with invoice metadata, batch numbers, expiry dates, purchase costs, and MRP. Submitting will automatically credit inventory stock and create transaction ledger entries.
          </div>

          {/* Header Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Supplier / Vendor *</label>
              <select
                required
                value={grnForm.supplierId}
                onChange={(e) => setGrnForm({ ...grnForm, supplierId: e.target.value })}
                className="crm-input w-full"
              >
                <option value="">-- Choose Supplier --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Supplier Invoice # *</label>
              <input
                type="text"
                required
                value={grnForm.invoiceNumber}
                onChange={(e) => setGrnForm({ ...grnForm, invoiceNumber: e.target.value })}
                className="crm-input w-full font-mono uppercase"
                placeholder="INV-99238"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Invoice Date</label>
              <input
                type="date"
                value={grnForm.invoiceDate}
                onChange={(e) => setGrnForm({ ...grnForm, invoiceDate: e.target.value })}
                className="crm-input w-full"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Received Date</label>
              <input
                type="date"
                value={grnForm.receivedDate}
                onChange={(e) => setGrnForm({ ...grnForm, receivedDate: e.target.value })}
                className="crm-input w-full"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Receiving Remarks / Carrier Notes</label>
              <input
                type="text"
                value={grnForm.notes}
                onChange={(e) => setGrnForm({ ...grnForm, notes: e.target.value })}
                className="crm-input w-full"
                placeholder="Quality verified, intact seals, LR #..."
              />
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Shipment Products & Batch Details ({grnForm.items.length} lines)
              </label>
              <button
                type="button"
                onClick={addGrnItemRow}
                className="crm-btn-secondary text-[11px] h-7 px-2 inline-flex items-center gap-1 text-blue-700"
              >
                <Plus className="w-3 h-3" />
                <span>Add Item Line</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-64 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] sticky top-0">
                  <tr>
                    <th className="py-2 px-2.5">Product</th>
                    <th className="py-2 px-2">Batch #</th>
                    <th className="py-2 px-2">Expiry</th>
                    <th className="py-2 px-2 text-right">Qty</th>
                    <th className="py-2 px-2 text-right">Cost (₹)</th>
                    <th className="py-2 px-2 text-right">MRP (₹)</th>
                    <th className="py-2 px-2 text-right">Total (₹)</th>
                    <th className="py-2 px-1 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {grnForm.items.map((item, idx) => {
                    const rowTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unitCost) || 0);
                    return (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="py-2 px-2.5 min-w-[160px]">
                          <select
                            required
                            value={item.productId}
                            onChange={(e) => updateGrnItem(idx, "productId", e.target.value)}
                            className="crm-input py-1 text-xs w-full"
                          >
                            <option value="">-- Product --</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-2 min-w-[110px]">
                          <input
                            type="text"
                            required
                            value={item.batchNumber}
                            onChange={(e) => updateGrnItem(idx, "batchNumber", e.target.value)}
                            className="crm-input py-1 text-xs font-mono w-full"
                            placeholder="BAT-01"
                          />
                        </td>
                        <td className="py-2 px-2 min-w-[120px]">
                          <input
                            type="date"
                            value={item.expiryDate}
                            onChange={(e) => updateGrnItem(idx, "expiryDate", e.target.value)}
                            className="crm-input py-1 text-xs w-full"
                          />
                        </td>
                        <td className="py-2 px-2 w-20">
                          <input
                            type="number"
                            min="1"
                            required
                            value={item.quantity}
                            onChange={(e) => updateGrnItem(idx, "quantity", e.target.value)}
                            className="crm-input py-1 text-xs text-right w-full"
                          />
                        </td>
                        <td className="py-2 px-2 w-24">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            required
                            value={item.unitCost}
                            onChange={(e) => updateGrnItem(idx, "unitCost", e.target.value)}
                            className="crm-input py-1 text-xs text-right w-full"
                          />
                        </td>
                        <td className="py-2 px-2 w-24">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.mrp}
                            onChange={(e) => updateGrnItem(idx, "mrp", e.target.value)}
                            className="crm-input py-1 text-xs text-right w-full"
                          />
                        </td>
                        <td className="py-2 px-2 text-right font-bold text-slate-900 whitespace-nowrap">
                          ₹{rowTotal.toLocaleString()}
                        </td>
                        <td className="py-2 px-1 text-center">
                          <button
                            type="button"
                            onClick={() => removeGrnItemRow(idx)}
                            className="text-rose-500 hover:text-rose-700 p-1 rounded"
                            title="Remove row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Total summary */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
              <span className="font-semibold text-slate-700">Total Inward GRN Amount:</span>
              <span className="text-base font-extrabold text-slate-900">
                ₹{calculateGrnTotal().toLocaleString()}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsGrnModalOpen(false)}
              className="crm-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="crm-btn-primary"
            >
              {submitting ? "Processing GRN..." : "Confirm & Inward Stock"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: View GRN Details */}
      {selectedGrnDetail && (
        <Modal
          isOpen={isGrnDetailModalOpen}
          onClose={() => setIsGrnDetailModalOpen(false)}
          title={`GRN Details: ${selectedGrnDetail.grn_number}`}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Supplier</span>
                <span className="font-bold text-slate-900">{selectedGrnDetail.supplier_name}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Invoice #</span>
                <span className="font-mono font-semibold text-slate-800">{selectedGrnDetail.invoice_number || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Received Date</span>
                <span className="font-medium text-slate-700">{selectedGrnDetail.received_date?.split("T")[0]}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Amount</span>
                <span className="font-extrabold text-blue-700">₹{parseFloat(selectedGrnDetail.total_amount || 0).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Status</span>
                <span className="crm-badge-success text-[10px]">{selectedGrnDetail.status}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Received By</span>
                <span className="text-slate-700">{selectedGrnDetail.received_by_first} {selectedGrnDetail.received_by_last}</span>
              </div>
            </div>

            {selectedGrnDetail.notes && (
              <p className="text-[11px] text-slate-600 bg-white p-2 border border-slate-200 rounded">
                <strong>Remarks:</strong> {selectedGrnDetail.notes}
              </p>
            )}

            <div>
              <h4 className="font-bold text-slate-900 mb-1.5 uppercase text-[11px]">Received Items</h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="crm-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Batch</th>
                      <th>Expiry</th>
                      <th className="text-right">Qty</th>
                      <th className="text-right">Unit Cost</th>
                      <th className="text-right">MRP</th>
                      <th className="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedGrnDetail.items || []).map((it) => (
                      <tr key={it.id}>
                        <td>
                          <div className="font-bold text-slate-900">{it.product_name}</div>
                          <div className="text-[10px] font-mono text-slate-400">{it.sku}</div>
                        </td>
                        <td className="font-mono text-slate-800">{it.batch_number}</td>
                        <td className="text-slate-600">{it.expiry_date ? it.expiry_date.split("T")[0] : "—"}</td>
                        <td className="text-right font-bold">{it.quantity}</td>
                        <td className="text-right">₹{parseFloat(it.unit_cost).toLocaleString()}</td>
                        <td className="text-right font-semibold">₹{parseFloat(it.mrp).toLocaleString()}</td>
                        <td className="text-right font-extrabold text-slate-900">₹{parseFloat(it.total_cost).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsGrnDetailModalOpen(false)}
                className="crm-btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
