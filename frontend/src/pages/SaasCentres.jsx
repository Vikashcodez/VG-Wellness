import React, { useState, useEffect } from "react";
import Header from "../components/Header.jsx";
import { saasService } from "../services/saasService.js";
import Modal from "../components/Modal.jsx";
import { Plus } from "lucide-react";

export default function SaasCentres() {
  const [centres, setCentres] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAddCentreOpen, setIsAddCentreOpen] = useState(false);

  const [centreForm, setCentreForm] = useState({
    name: "",
    code: "",
    slug: "",
    email: "",
    phone: "",
    address: "",
    website: "",
    planType: "PRO",
    maxBranches: 5,
    taxNumber: "",
    adminFirstName: "",
    adminLastName: "",
    adminEmail: "",
    adminPassword: "admin123",
    adminPhone: ""
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [centresRes, metricsRes] = await Promise.all([
        saasService.getCentres(),
        saasService.getPlatformMetrics()
      ]);
      setCentres(centresRes.data || []);
      setMetrics(metricsRes.data || null);
    } catch (err) {
      console.error("Error loading SaaS centres:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCentre = async (e) => {
    e.preventDefault();
    try {
      await saasService.createCentre(centreForm);
      setIsAddCentreOpen(false);
      setCentreForm({
        name: "", code: "", slug: "", email: "", phone: "", address: "", website: "",
        planType: "PRO", maxBranches: 5, taxNumber: "", adminFirstName: "", adminLastName: "",
        adminEmail: "", adminPassword: "admin123", adminPhone: ""
      });
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#f4f6f8]">
      <Header
        title="SaaS Wellness Centres"
        subtitle="Super Administrator multi-tenant management: provision centres, configure quotas, and assign admins"
        actions={
          <button
            onClick={() => setIsAddCentreOpen(true)}
            className="crm-btn-primary"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Centre</span>
          </button>
        }
      />

      <div className="p-3.5 sm:p-5 space-y-3.5 flex-1 max-w-full">
        {/* Global SaaS Platform Metrics Ribbon - No Bloated Emojis */}
        {metrics && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="crm-stat-tile border-l-[3px] border-l-blue-600">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Total Centres
              </span>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
                {metrics.totalCentres}
              </div>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
                {metrics.activeCentres} Active Tenants
              </p>
            </div>

            <div className="crm-stat-tile border-l-[3px] border-l-indigo-600">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Total Branches
              </span>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
                {metrics.totalBranches}
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Across all wellness groups
              </p>
            </div>

            <div className="crm-stat-tile border-l-[3px] border-l-slate-600">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Staff / Employees
              </span>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
                {metrics.totalEmployees}
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Clinical, therapy & front desk
              </p>
            </div>

            <div className="crm-stat-tile border-l-[3px] border-l-emerald-600">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Platform Revenue
              </span>
              <div className="text-xl sm:text-2xl font-bold text-emerald-700 mt-0.5">
                ₹{metrics.totalPlatformRevenue?.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Total collected via invoices
              </p>
            </div>
          </div>
        )}

        {/* Wellness Centres Table */}
        <div className="crm-card overflow-hidden">
          <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-white">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900">
              Enrolled Wellness Centres & Hospital Tenants
            </h2>
            <span className="crm-badge-neutral">
              {centres.length} Tenants Active
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading wellness centres...
            </div>
          ) : centres.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No wellness centres found. Click 'Add Centre' above to create one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Centre Name</th>
                    <th>Code / Slug</th>
                    <th>Centre Admin</th>
                    <th>Branches</th>
                    <th>Plan / Tier</th>
                    <th className="text-right">Revenue</th>
                    <th className="text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {centres.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div className="font-bold text-slate-900 text-xs">{c.name}</div>
                        <div className="text-[11px] text-slate-500">{c.email}</div>
                      </td>
                      <td>
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                          {c.code}
                        </span>
                      </td>
                      <td>
                        <div className="font-bold text-slate-900">
                          {c.admin_first_name} {c.admin_last_name}
                        </div>
                        <div className="text-[11px] text-blue-700">{c.admin_email}</div>
                      </td>
                      <td>
                        <span className="font-bold text-slate-900">{c.branch_count || 0}</span>
                        <span className="text-slate-400 text-[11px]"> / {c.max_branches} Quota</span>
                      </td>
                      <td>
                        <span className="crm-badge-info text-[10px]">
                          {c.plan_type}
                        </span>
                      </td>
                      <td className="text-right font-bold text-slate-900">
                        ₹{parseFloat(c.total_revenue || 0).toLocaleString()}
                      </td>
                      <td className="text-center">
                        <span className="crm-badge-success">
                          {c.status || "ACTIVE"}
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

      {/* Modal: Add Wellness Centre */}
      <Modal isOpen={isAddCentreOpen} onClose={() => setIsAddCentreOpen(false)} title="Provision New Wellness Centre (Tenant)">
        <form onSubmit={handleCreateCentre} className="space-y-3 text-xs">
          <div className="border-b border-slate-200 pb-1.5">
            <span className="text-[10px] font-bold uppercase text-slate-600 tracking-wider">1. Wellness Centre Profile</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Centre Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Nirvana Integrative Wellness"
                value={centreForm.name}
                onChange={(e) => setCentreForm({ ...centreForm, name: e.target.value })}
                className="crm-input w-full"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tenant Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. NIRVANA-BLR"
                value={centreForm.code}
                onChange={(e) => setCentreForm({ ...centreForm, code: e.target.value })}
                className="crm-input w-full uppercase"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Email *</label>
              <input
                type="email"
                required
                placeholder="contact@nirvanawellness.com"
                value={centreForm.email}
                onChange={(e) => setCentreForm({ ...centreForm, email: e.target.value })}
                className="crm-input w-full"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="+91 80 4000 1122"
                value={centreForm.phone}
                onChange={(e) => setCentreForm({ ...centreForm, phone: e.target.value })}
                className="crm-input w-full"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Subscription Plan</label>
              <select
                value={centreForm.planType}
                onChange={(e) => setCentreForm({ ...centreForm, planType: e.target.value })}
                className="crm-input w-full"
              >
                <option value="STARTER">Starter (1 Branch)</option>
                <option value="PRO">Professional (Up to 5 Branches)</option>
                <option value="ENTERPRISE">Enterprise (Unlimited)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tax / GSTIN Number</label>
              <input
                type="text"
                placeholder="29AABCU9603R1ZM"
                value={centreForm.taxNumber}
                onChange={(e) => setCentreForm({ ...centreForm, taxNumber: e.target.value })}
                className="crm-input w-full"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Primary Centre Address</label>
              <input
                type="text"
                placeholder="Full street address and city"
                value={centreForm.address}
                onChange={(e) => setCentreForm({ ...centreForm, address: e.target.value })}
                className="crm-input w-full"
              />
            </div>
          </div>

          <div className="border-b border-slate-200 pb-1.5 pt-2">
            <span className="text-[10px] font-bold uppercase text-slate-600 tracking-wider">2. Centre Administrator Account</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Admin First Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh"
                value={centreForm.adminFirstName}
                onChange={(e) => setCentreForm({ ...centreForm, adminFirstName: e.target.value })}
                className="crm-input w-full"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Admin Last Name</label>
              <input
                type="text"
                placeholder="e.g. Rao"
                value={centreForm.adminLastName}
                onChange={(e) => setCentreForm({ ...centreForm, adminLastName: e.target.value })}
                className="crm-input w-full"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Admin Login Email *</label>
              <input
                type="email"
                required
                placeholder="admin@nirvanawellness.com"
                value={centreForm.adminEmail}
                onChange={(e) => setCentreForm({ ...centreForm, adminEmail: e.target.value })}
                className="crm-input w-full"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Initial Password *</label>
              <input
                type="password"
                required
                placeholder="admin123"
                value={centreForm.adminPassword}
                onChange={(e) => setCentreForm({ ...centreForm, adminPassword: e.target.value })}
                className="crm-input w-full"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddCentreOpen(false)}
              className="crm-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="crm-btn-primary"
            >
              Provision Centre & Admin
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
