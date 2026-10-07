import React, { useEffect, useState } from "react";
import Header from "../components/Header.jsx";
import Modal from "../components/Modal.jsx";
import api from "../services/api.js";
import { clientService } from "../services/clientService.js";
import { FileText, Plus, Activity, Heart, Shield, Sparkles } from "lucide-react";

export default function Assessments() {
  const [assessments, setAssessments] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New assessment form
  const [formData, setFormData] = useState({
    clientId: "",
    weight: "85",
    height: "175",
    bodyFatPct: "28",
    muscleMassKg: "42",
    waistCircumferenceCm: "94",
    waterIntakeL: "2",
    sleepHours: "6",
    exerciseFreqWeekly: "3",
    stressLevel: "MODERATE",
    lifestyleNotes: "",
    nutritionNotes: "",
    clinicalNotes: ""
  });
  const [saving, setSaving] = useState(false);

  const loadAssessments = async (cId) => {
    setLoading(true);
    try {
      const res = await api.get("/assessments", { params: { clientId: cId } });
      if (res.data.success) {
        setAssessments(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function init() {
      const cRes = await clientService.getAll({ limit: 100 });
      if (cRes.success && cRes.data.length > 0) {
        setClients(cRes.data);
        const first = cRes.data[0].id;
        setSelectedClientId(first);
        loadAssessments(first);
      }
    }
    init();
  }, []);

  const handleClientChange = (cId) => {
    setSelectedClientId(cId);
    loadAssessments(cId);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post("/assessments", {
        ...formData,
        clientId: formData.clientId || selectedClientId
      });
      if (res.data.success) {
        setIsModalOpen(false);
        loadAssessments(formData.clientId || selectedClientId);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to record assessment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Biometric & Wellness Assessments"
        subtitle="Objective diagnostic measurements, BMI tracking, body composition, and clinical observations"
        actions={
          <button
            onClick={() => {
              setFormData(prev => ({ ...prev, clientId: selectedClientId }));
              setIsModalOpen(true);
            }}
            className="crm-btn-primary"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Perform Diagnostic Scan</span>
          </button>
        }
      />

      <div className="p-3.5 sm:p-5 space-y-3 flex-1 max-w-full">
        {/* Client selector filter */}
        <div className="crm-card p-2 sm:p-2.5 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-700">Patient / Client:</span>
            <select
              value={selectedClientId}
              onChange={(e) => handleClientChange(e.target.value)}
              className="crm-input w-64"
            >
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name} ({c.client_code})
                </option>
              ))}
            </select>
          </div>
          <div className="text-[11px] font-medium text-slate-500">
            <span className="font-bold text-slate-900">{assessments.length}</span> historical assessments
          </div>
        </div>

        {/* Assessment Cards */}
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading assessment logs...
          </div>
        ) : assessments.length === 0 ? (
          <div className="crm-card p-12 text-center text-slate-400 text-xs">
            No wellness assessments on record for this client.
          </div>
        ) : (
          <div className="space-y-3">
            {assessments.map((a) => (
              <div key={a.id} className="crm-card p-3.5 space-y-3 hover:border-slate-300 transition">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div>
                    <span className="text-xs font-bold text-slate-900">
                      Assessment Record • {a.assessment_date}
                    </span>
                    <p className="text-xs text-slate-500">
                      Practitioner: Dr. {a.practitioner_first_name} {a.practitioner_last_name || "Aura Medical Team"}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    BMI: {a.bmi} • Stress: {a.stress_level}
                  </span>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Weight</span>
                    <span className="text-base font-extrabold text-slate-900">{a.weight} kg</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Height</span>
                    <span className="text-base font-extrabold text-slate-900">{a.height} cm</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Body Fat</span>
                    <span className="text-base font-extrabold text-slate-900">{a.body_fat_pct}%</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Muscle Mass</span>
                    <span className="text-base font-extrabold text-slate-900">{a.muscle_mass_kg} kg</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Hydration</span>
                    <span className="text-base font-extrabold text-slate-900">{a.water_intake_l} L</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Sleep Avg</span>
                    <span className="text-base font-extrabold text-slate-900">{a.sleep_hours} hrs</span>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2 text-xs">
                  {a.lifestyle_notes && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <strong className="text-slate-800">Lifestyle & Habits:</strong> {a.lifestyle_notes}
                    </div>
                  )}
                  {a.nutrition_notes && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <strong className="text-slate-800">Nutritional Intake:</strong> {a.nutrition_notes}
                    </div>
                  )}
                  {a.clinical_notes && (
                    <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 text-emerald-900">
                      <strong className="text-emerald-950">Clinical Recommendations:</strong> {a.clinical_notes}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Record Assessment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Perform Wellness Diagnostic Evaluation"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Client *</label>
            <select
              required
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            >
              <option value="">-- Choose Client --</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.first_name} {c.last_name} ({c.client_code})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Weight (kg) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Height (cm) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Body Fat %</label>
              <input
                type="number"
                step="0.01"
                value={formData.bodyFatPct}
                onChange={(e) => setFormData({ ...formData, bodyFatPct: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Muscle Mass (kg)</label>
              <input
                type="number"
                step="0.01"
                value={formData.muscleMassKg}
                onChange={(e) => setFormData({ ...formData, muscleMassKg: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Water Intake (L)</label>
              <input
                type="number"
                step="0.1"
                value={formData.waterIntakeL}
                onChange={(e) => setFormData({ ...formData, waterIntakeL: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Stress Level</label>
              <select
                value={formData.stressLevel}
                onChange={(e) => setFormData({ ...formData, stressLevel: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              >
                <option value="LOW">LOW</option>
                <option value="MODERATE">MODERATE</option>
                <option value="HIGH">HIGH</option>
                <option value="SEVERE">SEVERE</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Clinical Observations & Plan Rationale</label>
            <textarea
              rows={3}
              value={formData.clinicalNotes}
              onChange={(e) => setFormData({ ...formData, clinicalNotes: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
              placeholder="Biometric insights, posture notes, target plan recommendation..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {saving ? "Saving Scan..." : "Save Assessment Record"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
