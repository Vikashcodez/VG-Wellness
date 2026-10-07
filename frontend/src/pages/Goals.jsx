import React, { useEffect, useState } from "react";
import Header from "../components/Header.jsx";
import Modal from "../components/Modal.jsx";
import { goalService } from "../services/goalService.js";
import { clientService } from "../services/clientService.js";
import { Target, Plus, TrendingDown, TrendingUp, CheckCircle2, Clock, Calendar, AlertCircle } from "lucide-react";

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [meta, setMeta] = useState({ categories: [], types: [] });
  const [selectedClientId, setSelectedClientId] = useState("");

  // Create Goal Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    clientId: "",
    goalTypeId: "",
    goalName: "Weight Loss Protocol",
    metricName: "Weight",
    startingValue: "85",
    targetValue: "72",
    unit: "kg",
    direction: "DECREASE",
    startDate: new Date().toISOString().split("T")[0],
    targetDate: "2027-01-07",
    priority: "HIGH",
    description: "Personalized metabolic and body recomposition protocol."
  });

  // Record Measurement Modal
  const [isMeasureModalOpen, setIsMeasureModalOpen] = useState(false);
  const [activeGoal, setActiveGoal] = useState(null);
  const [measureVal, setMeasureVal] = useState("");
  const [measureDate, setMeasureDate] = useState(new Date().toISOString().split("T")[0]);
  const [measureNotes, setMeasureNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const cRes = await clientService.getAll({ limit: 100 });
        if (cRes.success) setClients(cRes.data);

        const mRes = await goalService.getMeta();
        if (mRes.success) setMeta(mRes.data);

        // Load demo client goals by default if clients exist
        const firstClient = cRes.data?.[0]?.id;
        if (firstClient) {
          setSelectedClientId(firstClient);
          const gRes = await goalService.getClientGoals(firstClient);
          if (gRes.success) setGoals(gRes.data);
        }
      } catch (err) {
        console.error("Goals load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleClientChange = async (cId) => {
    setSelectedClientId(cId);
    if (!cId) return;
    setLoading(true);
    try {
      const gRes = await goalService.getClientGoals(cId);
      if (gRes.success) setGoals(gRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoalTypeSelect = (typeId) => {
    const selected = meta.types.find(t => t.id === parseInt(typeId));
    if (selected) {
      setFormData(prev => ({
        ...prev,
        goalTypeId: selected.id,
        goalName: `${selected.name} Target`,
        metricName: selected.default_metric,
        unit: selected.default_unit,
        direction: selected.target_direction
      }));
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await goalService.create(formData);
      if (res.success) {
        setIsCreateModalOpen(false);
        handleClientChange(formData.clientId || selectedClientId);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to create goal");
    } finally {
      setSaving(false);
    }
  };

  const handleRecordMeasurement = async (e) => {
    e.preventDefault();
    if (!activeGoal) return;
    setSaving(true);
    try {
      await goalService.recordMeasurement(activeGoal.id, {
        recordedValue: parseFloat(measureVal),
        recordedDate: measureDate,
        notes: measureNotes
      });
      setIsMeasureModalOpen(false);
      setMeasureVal("");
      setMeasureNotes("");
      handleClientChange(selectedClientId);
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to record measurement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Generic Goal & Progress Engine"
        subtitle="Universal framework supporting Weight Loss, Muscle Gain, Sleep, Meditation, Hydration, and Vitality Targets"
        actions={
          <button
            onClick={() => {
              setFormData(prev => ({ ...prev, clientId: selectedClientId }));
              setIsCreateModalOpen(true);
            }}
            className="crm-btn-primary"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Client Goal</span>
          </button>
        }
      />

      <div className="p-3.5 sm:p-5 space-y-3 flex-1 max-w-full">
        {/* Client selector filter */}
        <div className="crm-card p-2 sm:p-2.5 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[11px] font-bold text-slate-700 whitespace-nowrap">Filter Client:</span>
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
            <span className="font-bold text-slate-900">{goals.length}</span> active wellness goals
          </div>
        </div>

        {/* Goal Cards */}
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading goal metrics...
          </div>
        ) : goals.length === 0 ? (
          <div className="crm-card p-12 text-center text-slate-400 text-xs">
            No wellness goals set for this client yet. Click <strong>Create Client Goal</strong> to start one.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {goals.map((g) => {
              const p = g.progress || {};
              return (
                <div key={g.id} className="crm-card p-3.5 space-y-3 hover:border-slate-300 transition">
                  {/* Top Bar */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-slate-900">{g.goal_name}</h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          g.status === "ACHIEVED" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                        }`}>
                          {g.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{g.description}</p>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                      {g.target?.direction === "DECREASE" ? (
                        <TrendingDown className="w-3.5 h-3.5 text-blue-600" />
                      ) : (
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                      <span>{g.target?.direction}</span>
                    </div>
                  </div>

                  {/* Progress Statistics Box */}
                  <div className="grid grid-cols-4 gap-2 p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Starting</span>
                      <p className="text-sm font-bold text-slate-700">{g.target?.starting_value} {g.target?.unit}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-600 uppercase font-semibold">Current</span>
                      <p className="text-sm font-extrabold text-emerald-700">{g.target?.current_value} {g.target?.unit}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Target</span>
                      <p className="text-sm font-bold text-slate-700">{g.target?.target_value} {g.target?.unit}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Remaining</span>
                      <p className="text-sm font-bold text-slate-700">{p.remaining || 0} {g.target?.unit}</p>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-600">Calculated Journey Progress</span>
                      <span className="text-emerald-700 font-extrabold">{p.progressPercentage || 0}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-400 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(5, p.progressPercentage || 0))}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Total Change to Date: <span className="font-semibold text-slate-700">{p.totalChange || 0} {g.target?.unit}</span> • Target Date: {g.target_date}
                    </p>
                  </div>

                  {/* Milestones Progress List */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Milestone Checkpoints</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {g.milestones?.map((m) => (
                        <div
                          key={m.id}
                          className={`p-2.5 rounded-xl border text-xs ${
                            m.status === "ACHIEVED"
                              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                              : "bg-white border-slate-200 text-slate-600"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold">{m.target_value} {g.target?.unit}</span>
                            {m.status === "ACHIEVED" ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </div>
                          <span className="text-[10px] block mt-0.5 opacity-80">{m.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Historical Log snippet & Action */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      {g.measurements?.length || 0} measurements logged historically
                    </span>
                    <button
                      onClick={() => {
                        setActiveGoal(g);
                        setIsMeasureModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition cursor-pointer"
                    >
                      + Record Measurement
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Goal Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Configure Generic Wellness Goal"
      >
        <form onSubmit={handleCreateGoal} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Client *</label>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Preset Goal Archetype</label>
              <select
                value={formData.goalTypeId}
                onChange={(e) => handleGoalTypeSelect(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              >
                <option value="">-- Select Goal Archetype --</option>
                {meta.types?.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.default_metric})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Goal Name *</label>
              <input
                type="text"
                required
                value={formData.goalName}
                onChange={(e) => setFormData({ ...formData, goalName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Starting Baseline *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.startingValue}
                onChange={(e) => setFormData({ ...formData, startingValue: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Value *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.targetValue}
                onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Unit of Measure *</label>
              <input
                type="text"
                required
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
                placeholder="kg, %, hours, steps"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Direction *</label>
              <select
                value={formData.direction}
                onChange={(e) => setFormData({ ...formData, direction: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              >
                <option value="DECREASE">DECREASE (e.g. Weight/Fat Loss)</option>
                <option value="INCREASE">INCREASE (e.g. Muscle/Sleep/Steps)</option>
                <option value="MAINTAIN">MAINTAIN</option>
                <option value="ACHIEVE">ACHIEVE</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Date *</label>
              <input
                type="date"
                required
                value={formData.targetDate}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Clinical Rationale & Notes</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {saving ? "Creating Engine Goal..." : "Initialize Goal"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Measurement Modal */}
      <Modal
        isOpen={isMeasureModalOpen}
        onClose={() => setIsMeasureModalOpen(false)}
        title={`Record Measurement for ${activeGoal?.goal_name}`}
      >
        <form onSubmit={handleRecordMeasurement} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Date *</label>
            <input
              type="date"
              required
              value={measureDate}
              onChange={(e) => setMeasureDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              New Measurement Value ({activeGoal?.target?.unit}) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={measureVal}
              onChange={(e) => setMeasureVal(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
              placeholder={`Current reading in ${activeGoal?.target?.unit}`}
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Clinical Observation Notes</label>
            <textarea
              rows={2}
              value={measureNotes}
              onChange={(e) => setMeasureNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
              placeholder="Adherence note, patient response..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsMeasureModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {saving ? "Saving..." : "Record Measurement"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
