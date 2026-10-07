import React, { useState, useEffect } from "react";
import Header from "../components/Header.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { centreAdminService } from "../services/centreAdminService.js";
import Modal from "../components/Modal.jsx";
import { Plus, MapPin, Phone, Mail, UserCheck } from "lucide-react";

export default function CentreBranches() {
  const { user } = useAuth();
  const [centre, setCentre] = useState({});
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddBranchOpen, setIsAddBranchOpen] = useState(false);

  const [branchForm, setBranchForm] = useState({
    name: "",
    code: "",
    phone: "",
    email: "",
    address: "",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560034",
    adminFirstName: "",
    adminLastName: "",
    adminEmail: "",
    adminPassword: "password123"
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [cRes, bRes] = await Promise.all([
        centreAdminService.getMyCentreProfile().catch(() => ({ data: null })),
        centreAdminService.getBranches().catch(() => ({ data: [] }))
      ]);
      setCentre(cRes?.data || {});
      setBranches(bRes?.data || []);
    } catch (err) {
      console.error("Error loading branches:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    try {
      await centreAdminService.createBranchWithAdmin(branchForm);
      setIsAddBranchOpen(false);
      setBranchForm({
        name: "", code: "", phone: "", email: "",
        address: "", city: "Bengaluru", state: "Karnataka", pincode: "560034",
        adminFirstName: "", adminLastName: "", adminEmail: "", adminPassword: "password123"
      });
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const orgDisplayName = centre.name || user?.organizationName || "VGT Wellness Centre Management";
  const orgCode = centre.code || "VGT-HQ";
  const orgPlan = centre.plan_type || "ENTERPRISE";

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#f4f6f8]">
      <Header
        title="Branches & Branch Admins"
        subtitle={`Tenant: ${orgDisplayName} • Code: ${orgCode} • Tier: ${orgPlan}`}
        actions={
          <button
            onClick={() => setIsAddBranchOpen(true)}
            className="crm-btn-primary"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Branch</span>
          </button>
        }
      />

      <div className="p-3.5 sm:p-5 space-y-3.5 flex-1 max-w-full">
        {/* LeadSquared KPI Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
          <div className="crm-stat-tile border-l-[3px] border-l-blue-600">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Allocated Branches
            </span>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
              {branches.length} <span className="text-xs font-normal text-slate-400">/ {centre.max_branches || 5} Quota</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Active operational wellness locations
            </p>
          </div>

          <div className="crm-stat-tile border-l-[3px] border-l-emerald-600">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Centre Administrator
            </span>
            <div className="text-base font-bold text-slate-900 mt-0.5 truncate">
              {centre.admin_first_name} {centre.admin_last_name}
            </div>
            <p className="text-[11px] text-blue-700 font-medium mt-0.5 truncate">
              {centre.admin_email}
            </p>
          </div>

          <div className="crm-stat-tile border-l-[3px] border-l-indigo-600">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Tenant Subscription
            </span>
            <div className="text-base font-bold text-emerald-700 mt-0.5">
              {centre.status || "ACTIVE"} ({centre.plan_type || "PRO"})
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Multi-branch enterprise enabled
            </p>
          </div>
        </div>

        {/* Branches High Density Table */}
        <div className="crm-card overflow-hidden">
          <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-white">
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900">Operational Branches</h2>
              <p className="text-[11px] text-slate-500">Each branch is managed by an assigned Branch Administrator</p>
            </div>
            <span className="crm-badge-info">
              {branches.length} Active
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading branches directory...
            </div>
          ) : branches.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No branches configured yet. Click 'Add Branch' above to create your first branch.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Branch Name & Code</th>
                    <th>Location Address</th>
                    <th>Contact Details</th>
                    <th>Assigned Branch Admin</th>
                    <th className="text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {branches.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <div className="font-bold text-slate-900 text-xs">{b.name}</div>
                        <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 mt-0.5 inline-block">
                          {b.code}
                        </span>
                      </td>
                      <td className="text-slate-600">
                        <div>{b.address || "Main Boulevard"}</div>
                        <div className="text-[11px] text-slate-400">{b.city}, {b.state} - {b.pincode}</div>
                      </td>
                      <td>
                        <div className="text-slate-800 font-medium">{b.phone || "—"}</div>
                        <div className="text-[11px] text-slate-500">{b.email || "—"}</div>
                      </td>
                      <td>
                        <div className="font-bold text-slate-900">
                          {b.admin_first_name} {b.admin_last_name}
                        </div>
                        <div className="text-[11px] text-blue-700">{b.admin_email}</div>
                      </td>
                      <td className="text-center">
                        <span className="crm-badge-success">
                          {b.status || "ACTIVE"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add Branch & Branch Admin */}
      <Modal isOpen={isAddBranchOpen} onClose={() => setIsAddBranchOpen(false)} title="Register New Branch & Branch Admin">
        <form onSubmit={handleCreateBranch} className="space-y-3 text-xs">
          <div className="border-b border-slate-200 pb-1.5">
            <span className="font-bold uppercase tracking-wider text-slate-600 text-[10px]">1. Branch Location Details</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Branch Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Koramangala Wellness Hub"
                value={branchForm.name}
                onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                className="crm-input w-full"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Branch Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. KOR-BR-02"
                value={branchForm.code}
                onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
                className="crm-input w-full uppercase"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Branch Phone</label>
              <input
                type="text"
                placeholder="+91 80 4111 2233"
                value={branchForm.phone}
                onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                className="crm-input w-full"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Branch Contact Email</label>
              <input
                type="email"
                placeholder="koramangala@wellness.com"
                value={branchForm.email}
                onChange={(e) => setBranchForm({ ...branchForm, email: e.target.value })}
                className="crm-input w-full"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Street Address</label>
              <input
                type="text"
                placeholder="Building, street name, landmark"
                value={branchForm.address}
                onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                className="crm-input w-full"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={branchForm.city}
                onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })}
                className="crm-input w-full"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">State</label>
              <input
                type="text"
                value={branchForm.state}
                onChange={(e) => setBranchForm({ ...branchForm, state: e.target.value })}
                className="crm-input w-full"
              />
            </div>
          </div>

          <div className="border-b border-slate-200 pb-1.5 pt-2">
            <span className="font-bold uppercase tracking-wider text-slate-600 text-[10px]">2. Branch Administrator Credentials</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Admin First Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Vikram"
                value={branchForm.adminFirstName}
                onChange={(e) => setBranchForm({ ...branchForm, adminFirstName: e.target.value })}
                className="crm-input w-full"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Admin Last Name</label>
              <input
                type="text"
                placeholder="e.g. Singhania"
                value={branchForm.adminLastName}
                onChange={(e) => setBranchForm({ ...branchForm, adminLastName: e.target.value })}
                className="crm-input w-full"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Admin Login Email *</label>
              <input
                type="email"
                required
                placeholder="koramangala.admin@wellness.com"
                value={branchForm.adminEmail}
                onChange={(e) => setBranchForm({ ...branchForm, adminEmail: e.target.value })}
                className="crm-input w-full"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Initial Password *</label>
              <input
                type="password"
                required
                placeholder="manager123"
                value={branchForm.adminPassword}
                onChange={(e) => setBranchForm({ ...branchForm, adminPassword: e.target.value })}
                className="crm-input w-full"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddBranchOpen(false)}
              className="crm-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="crm-btn-primary"
            >
              Create Branch & Admin
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
