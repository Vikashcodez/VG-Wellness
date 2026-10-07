import React, { useEffect, useState } from "react";
import Header from "../components/Header.jsx";
import Modal from "../components/Modal.jsx";
import api from "../services/api.js";
import { Plus, Edit2, Trash2, Search, CheckCircle2, Clock } from "lucide-react";

export default function Services() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [creatingCat, setCreatingCat] = useState(false);

  const [form, setForm] = useState({
    name: "",
    categoryId: "",
    durationMinutes: 45,
    price: "",
    taxRate: 18,
    description: "",
    isOnline: false,
    isActive: true
  });

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    setCreatingCat(true);
    try {
      const res = await api.post("/services/categories", { name: newCatName.trim() });
      if (res.data.success) {
        const created = res.data.data;
        setCategories((prev) => [...prev, created]);
        setForm((prev) => ({ ...prev, categoryId: created.id }));
        setNewCatName("");
        setShowNewCat(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to create category");
    } finally {
      setCreatingCat(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [sRes, cRes] = await Promise.all([
        api.get("/services"),
        api.get("/services/categories")
      ]);
      if (sRes.data.success) setServices(sRes.data.data);
      if (cRes.data.success) setCategories(cRes.data.data);
    } catch (err) {
      console.error("Error loading services:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingService(null);
    setForm({
      name: "",
      categoryId: categories.length > 0 ? categories[0].id : "",
      durationMinutes: 45,
      price: "",
      taxRate: 18,
      description: "",
      isOnline: false,
      isActive: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (service) => {
    setEditingService(service);
    setForm({
      name: service.name || "",
      categoryId: service.category_id || (categories.length > 0 ? categories[0].id : ""),
      durationMinutes: service.duration_minutes || 45,
      price: service.price || "",
      taxRate: service.tax_rate ?? 18,
      description: service.description || "",
      isOnline: !!service.is_online,
      isActive: service.is_active !== false
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.durationMinutes) {
      alert("Please fill in the required fields: Name, Standard Fee, and Duration.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        categoryId: form.categoryId ? parseInt(form.categoryId) : null,
        durationMinutes: parseInt(form.durationMinutes),
        price: parseFloat(form.price),
        taxRate: parseFloat(form.taxRate || 0),
        description: form.description,
        isOnline: form.isOnline,
        isActive: form.isActive
      };

      if (editingService) {
        await api.put(`/services/${editingService.id}`, payload);
      } else {
        await api.post("/services", payload);
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to save service");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to deactivate service "${name}"?`)) return;
    try {
      await api.delete(`/services/${id}`);
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to deactivate service");
    }
  };

  const filtered = services.filter((s) => {
    const matchesCat = !selectedCat || s.category_id === parseInt(selectedCat);
    const matchesSearch = !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(search.toLowerCase())) ||
      (s.category_name && s.category_name.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#f4f6f8]">
      <Header
        title="Services Master"
        subtitle="Clinical consultations, therapies, mind-body sessions, and diagnostic assessments"
        actions={
          <button
            onClick={openAddModal}
            className="crm-btn-primary"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Service</span>
          </button>
        }
      />

      <div className="p-3.5 sm:p-5 space-y-3 flex-1 max-w-full">
        {/* Controls Bar: Search & Category Filter */}
        <div className="crm-card p-2 sm:p-2.5 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex flex-1 w-full sm:w-auto items-center gap-2">
            <div className="relative flex-1 sm:w-80">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search services by title, description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="crm-input pl-8 w-full"
              />
            </div>
          </div>
          <div className="text-[11px] font-medium text-slate-500 self-end sm:self-center">
            Showing <span className="font-bold text-slate-900">{filtered.length}</span> of {services.length} services
          </div>
        </div>

        {/* Category Pills */}
        <div className="crm-card p-2 sm:p-2.5 flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setSelectedCat("")}
            className={`px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              selectedCat === ""
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
            }`}
          >
            All Services ({services.length})
          </button>
          {categories.map((c) => {
            const count = services.filter((s) => s.category_id === c.id).length;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCat(c.id)}
                className={`px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedCat === c.id
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                }`}
              >
                {c.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Services Grid */}
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading clinical services catalog...
          </div>
        ) : filtered.length === 0 ? (
          <div className="crm-card py-12 text-center text-slate-400 text-xs">
            No clinical services match your filter criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((s) => (
              <div
                key={s.id}
                className="crm-card p-3.5 flex flex-col justify-between space-y-3 hover:border-slate-300 transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="crm-badge-info text-[10px]">
                      {s.category_name || "General"}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {s.is_online && (
                        <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[9px] font-bold px-1.5 py-0.5 rounded">
                          Online
                        </span>
                      )}
                      <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {s.duration_minutes}m
                      </span>
                    </div>
                  </div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                    {s.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {s.description || "Comprehensive clinical session with experienced practitioner."}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider">
                      Standard Fee
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm sm:text-base font-extrabold text-slate-900">
                        ₹{parseFloat(s.price).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        +{s.tax_rate}% GST
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(s)}
                      className="crm-btn-secondary text-[11px] h-7 px-2.5 inline-flex items-center gap-1 text-slate-700 hover:text-blue-700 hover:border-blue-300"
                      title="Edit Service Details"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(s.id, s.name)}
                      className="crm-btn-secondary text-[11px] h-7 px-2 text-rose-600 hover:bg-rose-50 hover:border-rose-200"
                      title="Deactivate Service"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Service Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingService ? `Edit Service: ${editingService.name}` : "Create New Clinical Service"}
      >
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Service Title *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="crm-input w-full"
                placeholder="e.g. Ayurvedic Abhyanga Full Body Therapy"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">Category *</label>
                <button
                  type="button"
                  onClick={() => setShowNewCat(!showNewCat)}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold"
                >
                  {showNewCat ? "Cancel" : "+ New Category"}
                </button>
              </div>

              {showNewCat ? (
                <div className="flex items-center gap-1.5 mb-1.5">
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="New category name..."
                    className="crm-input flex-1 py-1 text-xs"
                  />
                  <button
                    type="button"
                    disabled={creatingCat || !newCatName.trim()}
                    onClick={handleCreateCategory}
                    className="crm-btn-primary py-1 px-2.5 text-xs h-7"
                  >
                    {creatingCat ? "Adding..." : "Add"}
                  </button>
                </div>
              ) : null}

              <select
                required
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="crm-input w-full"
              >
                <option value="">-- Select Category ({categories.length} available) --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Session Duration (Minutes) *</label>
              <select
                value={form.durationMinutes}
                onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                className="crm-input w-full"
              >
                <option value="15">15 Minutes (Express)</option>
                <option value="30">30 Minutes (Consultation)</option>
                <option value="45">45 Minutes</option>
                <option value="60">60 Minutes (Standard Therapy)</option>
                <option value="75">75 Minutes</option>
                <option value="90">90 Minutes (Deep Session)</option>
                <option value="120">120 Minutes (Full Protocol)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Standard Fee (₹) *</label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="crm-input w-full"
                placeholder="e.g. 2500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tax Rate (GST %)</label>
              <select
                value={form.taxRate}
                onChange={(e) => setForm({ ...form, taxRate: e.target.value })}
                className="crm-input w-full"
              >
                <option value="0">0% (Exempt)</option>
                <option value="5">5% GST</option>
                <option value="12">12% GST</option>
                <option value="18">18% GST (Standard)</option>
                <option value="28">28% GST</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Description & Protocol Scope</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="crm-input w-full"
                placeholder="Clinical procedure notes, therapeutic scope, recommended preparation..."
              />
            </div>

            <div className="sm:col-span-2 flex items-center gap-6 pt-1">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={form.isOnline}
                  onChange={(e) => setForm({ ...form, isOnline: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <span>Online Video Consultation Eligible</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <span>Active Service</span>
              </label>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="crm-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="crm-btn-primary"
            >
              {submitting ? "Saving..." : editingService ? "Update Service" : "Create Service"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
