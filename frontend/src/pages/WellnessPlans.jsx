import React, { useEffect, useState } from "react";
import Header from "../components/Header.jsx";
import Modal from "../components/Modal.jsx";
import api from "../services/api.js";
import { clientService } from "../services/clientService.js";
import { Sparkles, Plus, Calendar, Clock, Check, UserPlus } from "lucide-react";

export default function WellnessPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const [assignForm, setAssignForm] = useState({
    clientId: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "2027-01-07",
    notes: ""
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [pRes, cRes] = await Promise.all([
          api.get("/wellness-plans"),
          clientService.getAll({ limit: 100 })
        ]);
        if (pRes.data.success) setPlans(pRes.data.data);
        if (cRes.success) setClients(cRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedPlan || !assignForm.clientId) return;
    setSubmitting(true);
    try {
      await api.post("/wellness-plans/assign", {
        wellnessPlanId: selectedPlan.id,
        clientId: parseInt(assignForm.clientId),
        startDate: assignForm.startDate,
        endDate: assignForm.endDate,
        notes: assignForm.notes
      });
      setIsAssignModalOpen(false);
      alert(`Plan successfully assigned!`);
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to assign plan");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#f4f6f8]">
      <Header
        title="Wellness Programs & Plans"
        subtitle="Holistic 4-12 week structured protocols integrating Nutrition, Yoga, Therapies, and Lifestyle Habits"
      />

      <div className="p-3.5 sm:p-5 space-y-3.5 flex-1 max-w-full">
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading wellness programs...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {plans.map((plan) => (
              <div key={plan.id} className="crm-card p-3.5 flex flex-col justify-between space-y-3 hover:border-slate-300 transition">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="crm-badge-info text-[10px]">
                      {plan.duration_weeks} Weeks Duration
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-slate-900">
                      ₹{parseFloat(plan.price).toLocaleString()}
                    </span>
                  </div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900">{plan.name}</h3>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{plan.description}</p>
                </div>

                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-blue-700 font-semibold">
                    Multi-Modality Protocol
                  </span>
                  <button
                    onClick={() => {
                      setSelectedPlan(plan);
                      setIsAssignModalOpen(true);
                    }}
                    className="crm-btn-primary h-7 px-2.5 text-[11px]"
                  >
                    Enroll Client
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enroll Client Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title={`Enroll Client in ${selectedPlan?.name}`}
      >
        <form onSubmit={handleAssign} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Client *</label>
            <select
              required
              value={assignForm.clientId}
              onChange={(e) => setAssignForm({ ...assignForm, clientId: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            >
              <option value="">-- Choose Client --</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.first_name} {c.last_name} ({c.client_code})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={assignForm.startDate}
                onChange={(e) => setAssignForm({ ...assignForm, startDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">End Date *</label>
              <input
                type="date"
                required
                value={assignForm.endDate}
                onChange={(e) => setAssignForm({ ...assignForm, endDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Enrollment Instructions</label>
            <textarea
              rows={2}
              value={assignForm.notes}
              onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
              placeholder="Clinical targets, assigned coach notes..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Enrolling..." : "Confirm Enrollment"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
