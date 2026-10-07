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
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Multi-Disciplinary Wellness Plans"
        subtitle="Holistic 4-12 week structured protocols integrating Nutrition, Yoga, Therapies, and Lifestyle Habits"
      />

      <div className="p-8 space-y-6 flex-1">
        {loading ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2" />
            Loading wellness programs...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div key={plan.id} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                      {plan.duration_weeks} WEEKS DURATION
                    </span>
                    <span className="text-base font-extrabold text-slate-900">
                      ₹{parseFloat(plan.price).toLocaleString()}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-slate-900">{plan.name}</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">{plan.description}</p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Multi-Modality
                  </span>
                  <button
                    onClick={() => {
                      setSelectedPlan(plan);
                      setIsAssignModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition cursor-pointer"
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
