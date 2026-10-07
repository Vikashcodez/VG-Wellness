import React, { useEffect, useState } from "react";
import Header from "../components/Header.jsx";
import Modal from "../components/Modal.jsx";
import api from "../services/api.js";
import { Plus, Edit2, Shield, Sparkles, Check, Clock } from "lucide-react";

export default function Packages() {
  const [packages, setPackages] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);

  // Package Modal
  const [isPkgModalOpen, setIsPkgModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState(null);
  const [pkgForm, setPkgForm] = useState({
    name: "",
    durationDays: 30,
    price: "",
    description: "",
    isActive: true
  });

  // Membership Modal
  const [isMemModalOpen, setIsMemModalOpen] = useState(false);
  const [editingMem, setEditingMem] = useState(null);
  const [memForm, setMemForm] = useState({
    name: "",
    tier: "SILVER",
    durationMonths: 12,
    price: "",
    discountPercent: 10,
    benefitsDescription: "",
    isActive: true
  });

  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pRes, mRes] = await Promise.all([
        api.get("/packages"),
        api.get("/memberships")
      ]);
      if (pRes.data.success) setPackages(pRes.data.data);
      if (mRes.data.success) setMemberships(mRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Open Handlers
  const openAddPackage = () => {
    setEditingPkg(null);
    setPkgForm({
      name: "",
      durationDays: 30,
      price: "",
      description: "",
      isActive: true
    });
    setIsPkgModalOpen(true);
  };

  const openEditPackage = (pkg) => {
    setEditingPkg(pkg);
    setPkgForm({
      name: pkg.name || "",
      durationDays: pkg.duration_days || 30,
      price: pkg.price || "",
      description: pkg.description || "",
      isActive: pkg.is_active !== false
    });
    setIsPkgModalOpen(true);
  };

  const openAddMembership = () => {
    setEditingMem(null);
    setMemForm({
      name: "",
      tier: "SILVER",
      durationMonths: 12,
      price: "",
      discountPercent: 10,
      benefitsDescription: "",
      isActive: true
    });
    setIsMemModalOpen(true);
  };

  const openEditMembership = (mem) => {
    setEditingMem(mem);
    setMemForm({
      name: mem.name || "",
      tier: mem.tier || "SILVER",
      durationMonths: mem.duration_months || 12,
      price: mem.price || "",
      discountPercent: mem.discount_percent || 10,
      benefitsDescription: mem.benefits_description || "",
      isActive: mem.is_active !== false
    });
    setIsMemModalOpen(true);
  };

  // Submit Handlers
  const handlePackageSubmit = async (e) => {
    e.preventDefault();
    if (!pkgForm.name || !pkgForm.price) {
      alert("Please provide package title and price");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: pkgForm.name.trim(),
        durationDays: parseInt(pkgForm.durationDays || 30),
        price: parseFloat(pkgForm.price),
        description: pkgForm.description,
        isActive: pkgForm.isActive
      };
      if (editingPkg) {
        await api.put(`/packages/${editingPkg.id}`, payload);
      } else {
        await api.post("/packages", payload);
      }
      setIsPkgModalOpen(false);
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to save package");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMembershipSubmit = async (e) => {
    e.preventDefault();
    if (!memForm.name || !memForm.price) {
      alert("Please provide membership plan name and price");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: memForm.name.trim(),
        tier: memForm.tier,
        durationMonths: parseInt(memForm.durationMonths || 12),
        price: parseFloat(memForm.price),
        discountPercent: parseFloat(memForm.discountPercent || 0),
        benefitsDescription: memForm.benefitsDescription,
        isActive: memForm.isActive
      };
      if (editingMem) {
        await api.put(`/memberships/${editingMem.id}`, payload);
      } else {
        await api.post("/memberships", payload);
      }
      setIsMemModalOpen(false);
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to save membership plan");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#f4f6f8]">
      <Header
        title="Packages & Membership Tiers Master"
        subtitle="Manage multi-session treatment packages, service bundles, and annual tier privileges"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={openAddPackage}
              className="crm-btn-secondary"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Package</span>
            </button>
            <button
              onClick={openAddMembership}
              className="crm-btn-primary"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Add Membership Tier</span>
            </button>
          </div>
        }
      />

      <div className="p-3.5 sm:p-5 space-y-4 flex-1 max-w-full">
        {/* Packages Section */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <span>Multi-Session Bundled Packages</span>
              <span className="crm-badge-neutral text-[10px]">{packages.length}</span>
            </h2>
          </div>

          {loading ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading packages...
            </div>
          ) : packages.length === 0 ? (
            <div className="crm-card p-6 text-center text-slate-400 text-xs">
              No packages created yet. Click "+ Add Package" to create your first bundle.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="crm-card p-3.5 flex flex-col justify-between space-y-3 hover:border-slate-300 transition"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="crm-badge-info text-[10px] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {pkg.duration_days} Days Validity
                      </span>
                      <span className="text-sm font-extrabold text-slate-900">
                        ₹{parseFloat(pkg.price).toLocaleString()}
                      </span>
                    </div>
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900">
                      {pkg.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {pkg.description || "Curated multi-session therapeutic bundle."}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <span className="crm-badge-success text-[10px]">Active</span>
                    <button
                      onClick={() => openEditPackage(pkg)}
                      className="crm-btn-secondary text-[11px] h-7 px-2.5 inline-flex items-center gap-1 text-slate-700 hover:text-blue-700"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Membership Tiers Section */}
        <div className="space-y-2.5 pt-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <span>Annual Membership Tiers</span>
              <span className="crm-badge-neutral text-[10px]">{memberships.length}</span>
            </h2>
          </div>

          {loading ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              Loading membership tiers...
            </div>
          ) : memberships.length === 0 ? (
            <div className="crm-card p-6 text-center text-slate-400 text-xs">
              No membership plans created yet. Click "+ Add Membership Tier" to define tiers.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {memberships.map((mem) => {
                const tierColor =
                  mem.tier === "DIAMOND" || mem.tier === "PLATINUM"
                    ? "border-l-purple-600"
                    : mem.tier === "GOLD"
                    ? "border-l-amber-500"
                    : "border-l-blue-600";

                return (
                  <div
                    key={mem.id}
                    className={`crm-card p-3.5 flex flex-col justify-between space-y-3 hover:border-slate-300 transition border-l-[3px] ${tierColor}`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="crm-badge-warning text-[10px] font-bold">
                          {mem.tier} TIER
                        </span>
                        <span className="text-[11px] font-medium text-slate-500">
                          {mem.duration_months} Months
                        </span>
                      </div>

                      <h3 className="font-bold text-xs sm:text-sm text-slate-900">
                        {mem.name}
                      </h3>

                      <div className="mt-1.5 flex items-baseline">
                        <span className="text-base sm:text-lg font-extrabold text-slate-900">
                          ₹{parseFloat(mem.price).toLocaleString()}
                        </span>
                        <span className="text-[11px] text-slate-400 ml-1">/ year</span>
                      </div>

                      <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                        {mem.benefits_description || "Annual membership tier with exclusive priority booking and savings."}
                      </p>
                    </div>

                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-blue-700">
                        {mem.discount_percent}% Flat Discount
                      </span>
                      <button
                        onClick={() => openEditMembership(mem)}
                        className="crm-btn-secondary text-[11px] h-7 px-2.5 inline-flex items-center gap-1 text-slate-700 hover:text-blue-700"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add/Edit Package */}
      <Modal
        isOpen={isPkgModalOpen}
        onClose={() => setIsPkgModalOpen(false)}
        title={editingPkg ? `Edit Package: ${editingPkg.name}` : "Create Treatment Package"}
      >
        <form onSubmit={handlePackageSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Package Title *</label>
            <input
              type="text"
              required
              value={pkgForm.name}
              onChange={(e) => setPkgForm({ ...pkgForm, name: e.target.value })}
              className="crm-input w-full"
              placeholder="e.g. 5x Panchakarma Detoxification Suite"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Validity (Days) *</label>
              <input
                type="number"
                min="1"
                required
                value={pkgForm.durationDays}
                onChange={(e) => setPkgForm({ ...pkgForm, durationDays: e.target.value })}
                className="crm-input w-full"
                placeholder="30"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Package Price (₹) *</label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={pkgForm.price}
                onChange={(e) => setPkgForm({ ...pkgForm, price: e.target.value })}
                className="crm-input w-full"
                placeholder="e.g. 12000"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Package Description & Included Inclusions</label>
            <textarea
              rows={3}
              value={pkgForm.description}
              onChange={(e) => setPkgForm({ ...pkgForm, description: e.target.value })}
              className="crm-input w-full"
              placeholder="Number of sessions included, complimentary dietary consult, cancellation policy..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="pkgActive"
              checked={pkgForm.isActive}
              onChange={(e) => setPkgForm({ ...pkgForm, isActive: e.target.checked })}
              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="pkgActive" className="text-slate-700 font-medium cursor-pointer">
              Active for Sales
            </label>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsPkgModalOpen(false)}
              className="crm-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="crm-btn-primary"
            >
              {submitting ? "Saving..." : editingPkg ? "Update Package" : "Create Package"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add/Edit Membership Tier */}
      <Modal
        isOpen={isMemModalOpen}
        onClose={() => setIsMemModalOpen(false)}
        title={editingMem ? `Edit Membership Tier: ${editingMem.name}` : "Create Annual Membership Tier"}
      >
        <form onSubmit={handleMembershipSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tier Plan Name *</label>
              <input
                type="text"
                required
                value={memForm.name}
                onChange={(e) => setMemForm({ ...memForm, name: e.target.value })}
                className="crm-input w-full"
                placeholder="e.g. Gold Wellness Annual Club"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tier Classification *</label>
              <select
                value={memForm.tier}
                onChange={(e) => setMemForm({ ...memForm, tier: e.target.value })}
                className="crm-input w-full"
              >
                <option value="SILVER">SILVER</option>
                <option value="GOLD">GOLD</option>
                <option value="PLATINUM">PLATINUM</option>
                <option value="DIAMOND">DIAMOND</option>
                <option value="VIP">VIP</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Annual Fee (₹) *</label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={memForm.price}
                onChange={(e) => setMemForm({ ...memForm, price: e.target.value })}
                className="crm-input w-full"
                placeholder="e.g. 24999"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Validity (Months)</label>
              <input
                type="number"
                min="1"
                value={memForm.durationMonths}
                onChange={(e) => setMemForm({ ...memForm, durationMonths: e.target.value })}
                className="crm-input w-full"
                placeholder="12"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Store & Service Discount (% off standard rates)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={memForm.discountPercent}
                onChange={(e) => setMemForm({ ...memForm, discountPercent: e.target.value })}
                className="crm-input w-full"
                placeholder="e.g. 15"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Privileges & Benefits Summary</label>
              <textarea
                rows={3}
                value={memForm.benefitsDescription}
                onChange={(e) => setMemForm({ ...memForm, benefitsDescription: e.target.value })}
                className="crm-input w-full"
                placeholder="Free quarterly doctor consultation, complimentary access to steam & hydrotherapy..."
              />
            </div>

            <div className="sm:col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="memActive"
                checked={memForm.isActive}
                onChange={(e) => setMemForm({ ...memForm, isActive: e.target.checked })}
                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="memActive" className="text-slate-700 font-medium cursor-pointer">
                Active Tier Plan
              </label>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsMemModalOpen(false)}
              className="crm-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="crm-btn-primary"
            >
              {submitting ? "Saving..." : editingMem ? "Update Tier Plan" : "Create Tier Plan"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
