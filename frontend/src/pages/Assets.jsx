import React, { useState, useEffect } from "react";
import Header from "../components/Header.jsx";
import { assetService } from "../services/assetService.js";
import Modal from "../components/Modal.jsx";
import { Plus, Search, Wrench } from "lucide-react";

export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  const [assetForm, setAssetForm] = useState({
    name: "",
    category: "THERAPY_EQUIPMENT",
    serialNumber: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    purchaseCost: "",
    currentValue: "",
    locationRoom: "",
    vendorName: "",
    warrantyExpiry: "",
    nextServiceDate: "",
    notes: ""
  });

  const [maintenanceForm, setMaintenanceForm] = useState({
    serviceDate: new Date().toISOString().split("T")[0],
    maintenanceType: "PREVENTIVE",
    cost: "",
    performedBy: "",
    nextDueDate: "",
    notes: ""
  });

  const loadAssets = async () => {
    setLoading(true);
    try {
      const res = await assetService.getAssets({
        category: categoryFilter || undefined,
        status: statusFilter || undefined,
        search: search || undefined
      });
      setAssets(res.data || []);
    } catch (err) {
      console.error("Error loading assets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, [categoryFilter, statusFilter, search]);

  const handleCreateAsset = async (e) => {
    e.preventDefault();
    try {
      await assetService.createAsset({
        ...assetForm,
        purchaseCost: parseFloat(assetForm.purchaseCost || 0),
        currentValue: parseFloat(assetForm.currentValue || assetForm.purchaseCost || 0)
      });
      setIsAddModalOpen(false);
      setAssetForm({
        name: "", category: "THERAPY_EQUIPMENT", serialNumber: "",
        purchaseDate: new Date().toISOString().split("T")[0], purchaseCost: "",
        currentValue: "", locationRoom: "", vendorName: "", warrantyExpiry: "",
        nextServiceDate: "", notes: ""
      });
      loadAssets();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleRecordMaintenance = async (e) => {
    e.preventDefault();
    if (!selectedAsset) return;
    try {
      await assetService.addMaintenanceLog(selectedAsset.id, {
        ...maintenanceForm,
        cost: parseFloat(maintenanceForm.cost || 0)
      });
      setIsMaintenanceModalOpen(false);
      setMaintenanceForm({
        serviceDate: new Date().toISOString().split("T")[0],
        maintenanceType: "PREVENTIVE",
        cost: "",
        performedBy: "",
        nextDueDate: "",
        notes: ""
      });
      loadAssets();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const totalValuation = assets.reduce((sum, a) => sum + parseFloat(a.current_value || 0), 0);
  const operationalCount = assets.filter((a) => a.status === "OPERATIONAL").length;
  const maintenanceCount = assets.filter((a) => a.status === "UNDER_MAINTENANCE" || a.status === "REPAIR_NEEDED").length;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#f4f6f8]">
      <Header
        title="Asset & Equipment Register"
        subtitle="Capitalized therapy machinery, diagnostic scanners, warranty tracking, and maintenance logs"
        actions={
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="crm-btn-primary"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Asset</span>
          </button>
        }
      />

      <div className="p-3.5 sm:p-5 space-y-3.5 flex-1 max-w-full">
        {/* LeadSquared KPI Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
          <div className="crm-stat-tile border-l-[3px] border-l-blue-600">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Equipment Valuation
            </span>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
              ₹{totalValuation.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              {assets.length} capitalized assets tracked
            </p>
          </div>

          <div className="crm-stat-tile border-l-[3px] border-l-emerald-600">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Operational In-Service
            </span>
            <div className="text-xl sm:text-2xl font-bold text-emerald-700 mt-0.5">
              {operationalCount}
            </div>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
              Available for clinical sessions
            </p>
          </div>

          <div className="crm-stat-tile border-l-[3px] border-l-amber-600">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Under Service / Repair
            </span>
            <div className={`text-xl sm:text-2xl font-bold mt-0.5 ${maintenanceCount > 0 ? "text-amber-700" : "text-slate-900"}`}>
              {maintenanceCount}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Scheduled maintenance or repair
            </p>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="crm-card p-2 sm:p-2.5 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex flex-1 w-full sm:w-auto items-center gap-2 flex-wrap">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, code, serial #, vendor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="crm-input pl-8 w-full"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="crm-input w-40"
            >
              <option value="">All Categories</option>
              <option value="THERAPY_EQUIPMENT">Therapy Equipment</option>
              <option value="DIAGNOSTIC">Diagnostic & Lab</option>
              <option value="WELLNESS_MACHINE">Sauna / Pods</option>
              <option value="IT_HARDWARE">IT Workstations</option>
              <option value="FACILITY">Facility Equipment</option>
              <option value="FURNITURE">Furniture & Fixtures</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="crm-input w-36"
            >
              <option value="">All Statuses</option>
              <option value="OPERATIONAL">Operational</option>
              <option value="UNDER_MAINTENANCE">In Maintenance</option>
              <option value="REPAIR_NEEDED">Repair Needed</option>
              <option value="RETIRED">Retired</option>
            </select>
          </div>
          <div className="text-[11px] font-medium text-slate-500 self-end sm:self-center">
            Total <span className="font-bold text-slate-900">{assets.length}</span> assets
          </div>
        </div>

        {/* Assets High Density Table */}
        <div className="crm-card overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading asset register...
            </div>
          ) : assets.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No assets found matching your filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Asset Code</th>
                    <th>Equipment Name</th>
                    <th>Category</th>
                    <th>Room / Branch</th>
                    <th className="text-right">Valuation</th>
                    <th className="text-center">Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((ast) => (
                    <tr key={ast.id}>
                      <td className="font-mono font-bold text-slate-900 text-xs">
                        {ast.asset_code}
                      </td>
                      <td>
                        <div className="font-bold text-slate-900">{ast.name}</div>
                        <div className="text-[11px] text-slate-500">
                          SN: {ast.serial_number || "—"} • Vendor: {ast.vendor_name || "—"}
                        </div>
                      </td>
                      <td>
                        <span className="crm-badge-neutral text-[10px]">
                          {ast.category.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td>
                        <div className="font-medium text-slate-800">{ast.location_room || "General Clinic"}</div>
                        <div className="text-[10px] text-slate-400">{ast.branch_name}</div>
                      </td>
                      <td className="text-right font-bold text-slate-900">
                        ₹{parseFloat(ast.current_value || 0).toLocaleString()}
                        <div className="text-[10px] font-normal text-slate-400">
                          Cost: ₹{parseFloat(ast.purchase_cost || 0).toLocaleString()}
                        </div>
                      </td>
                      <td className="text-center">
                        <span className={
                          ast.status === "OPERATIONAL" ? "crm-badge-success" :
                          ast.status === "UNDER_MAINTENANCE" ? "crm-badge-warning" :
                          "crm-badge-danger"
                        }>
                          {ast.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => {
                            setSelectedAsset(ast);
                            setIsMaintenanceModalOpen(true);
                          }}
                          className="crm-btn-secondary h-7 px-2 text-[11px]"
                        >
                          <Wrench className="w-3 h-3 mr-0.5" />
                          <span>Service</span>
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

      {/* Modal: Add Asset */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register Physical Asset">
        <form onSubmit={handleCreateAsset} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Asset Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Hyperbaric Oxygen Pod"
                value={assetForm.name}
                onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                className="crm-input w-full"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category *</label>
              <select
                value={assetForm.category}
                onChange={(e) => setAssetForm({ ...assetForm, category: e.target.value })}
                className="crm-input w-full"
              >
                <option value="THERAPY_EQUIPMENT">Therapy Equipment</option>
                <option value="DIAGNOSTIC">Diagnostic & Lab</option>
                <option value="WELLNESS_MACHINE">Sauna / Pods</option>
                <option value="IT_HARDWARE">IT Workstations</option>
                <option value="FACILITY">Facility Equipment</option>
                <option value="FURNITURE">Furniture & Fixtures</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Serial Number</label>
              <input
                type="text"
                placeholder="SN-980123"
                value={assetForm.serialNumber}
                onChange={(e) => setAssetForm({ ...assetForm, serialNumber: e.target.value })}
                className="crm-input w-full"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Purchase Cost (₹) *</label>
              <input
                type="number"
                required
                placeholder="150000"
                value={assetForm.purchaseCost}
                onChange={(e) => setAssetForm({ ...assetForm, purchaseCost: e.target.value })}
                className="crm-input w-full font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Location Room</label>
              <input
                type="text"
                placeholder="Treatment Room 1"
                value={assetForm.locationRoom}
                onChange={(e) => setAssetForm({ ...assetForm, locationRoom: e.target.value })}
                className="crm-input w-full"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Vendor / Manufacturer</label>
              <input
                type="text"
                placeholder="Apex Medical Tech"
                value={assetForm.vendorName}
                onChange={(e) => setAssetForm({ ...assetForm, vendorName: e.target.value })}
                className="crm-input w-full"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Warranty Expiry</label>
              <input
                type="date"
                value={assetForm.warrantyExpiry}
                onChange={(e) => setAssetForm({ ...assetForm, warrantyExpiry: e.target.value })}
                className="crm-input w-full"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Next Service Date</label>
              <input
                type="date"
                value={assetForm.nextServiceDate}
                onChange={(e) => setAssetForm({ ...assetForm, nextServiceDate: e.target.value })}
                className="crm-input w-full"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="crm-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="crm-btn-primary"
            >
              Register Asset
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Log Maintenance */}
      <Modal isOpen={isMaintenanceModalOpen} onClose={() => setIsMaintenanceModalOpen(false)} title={`Log Service for ${selectedAsset?.name}`}>
        <form onSubmit={handleRecordMaintenance} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Maintenance Type</label>
              <select
                value={maintenanceForm.maintenanceType}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, maintenanceType: e.target.value })}
                className="crm-input w-full"
              >
                <option value="PREVENTIVE">Preventive Periodic Check</option>
                <option value="CORRECTIVE">Corrective Repair</option>
                <option value="CALIBRATION">Sensor Calibration</option>
                <option value="PARTS_REPLACEMENT">Parts Replacement</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Service Cost (₹)</label>
              <input
                type="number"
                placeholder="2500"
                value={maintenanceForm.cost}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, cost: e.target.value })}
                className="crm-input w-full"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Service Engineer / Vendor</label>
              <input
                type="text"
                placeholder="Authorized Engineer"
                value={maintenanceForm.performedBy}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, performedBy: e.target.value })}
                className="crm-input w-full"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Next Service Due Date</label>
              <input
                type="date"
                value={maintenanceForm.nextDueDate}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, nextDueDate: e.target.value })}
                className="crm-input w-full"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Maintenance Remarks</label>
              <textarea
                rows={2}
                placeholder="Replaced hydraulic seal and tested pressure chamber"
                value={maintenanceForm.notes}
                onChange={(e) => setMaintenanceForm({ ...maintenanceForm, notes: e.target.value })}
                className="bg-white border border-slate-300 rounded text-xs text-slate-800 px-3 py-1.5 w-full focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsMaintenanceModalOpen(false)}
              className="crm-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="crm-btn-primary"
            >
              Save Service Log
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
