import React, { useEffect, useState } from "react";
import api from "../services/api.js";
import { useClientAuth } from "../context/ClientAuthContext.jsx";
import { Target, TrendingDown, TrendingUp, CheckCircle2, Clock, Calendar, Plus } from "lucide-react";

export default function ClientGoals() {
  const { user } = useClientAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick log measurement
  const [activeGoal, setActiveGoal] = useState(null);
  const [measureVal, setMeasureVal] = useState("");
  const [measureDate, setMeasureDate] = useState(new Date().toISOString().split("T")[0]);
  const [measureNotes, setMeasureNotes] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await api.get("/goals");
      if (res.data.success) {
        setGoals(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleLogMeasurement = async (e) => {
    e.preventDefault();
    if (!activeGoal || !measureVal) return;
    setSaving(true);
    try {
      await api.post(`/goals/${activeGoal.id}/measurements`, {
        recordedValue: parseFloat(measureVal),
        recordedDate: measureDate,
        notes: measureNotes
      });
      setIsModalOpen(false);
      setMeasureVal("");
      setMeasureNotes("");
      fetchGoals();
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to log measurement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Your Health & Vitality Goals</h1>
        <p className="text-xs text-slate-500 mt-1">
          Visual milestone tracker, historical progress graph, and daily biomarker logs
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500 text-sm">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading your clinical goal progress...
        </div>
      ) : goals.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-sm">
          <Target className="w-12 h-12 mx-auto mb-2 text-slate-300" />
          No health goals assigned to your profile yet.
        </div>
      ) : (
        <div className="space-y-8">
          {goals.map((g) => {
            const p = g.progress || {};
            const measurements = g.measurements || [];
            return (
              <div key={g.id} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-900">{g.goal_name}</h2>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        g.status === "ACHIEVED" ? "bg-emerald-100 text-emerald-800" :
                        g.status === "ON_TRACK" ? "bg-teal-100 text-teal-800" :
                        "bg-blue-100 text-blue-800"
                      }`}>
                        {p.status || g.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{g.description}</p>
                  </div>

                  <button
                    onClick={() => {
                      setActiveGoal(g);
                      setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition self-start cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Log Daily Reading</span>
                  </button>
                </div>

                {/* 5-Metric Vital Dashboard (Section 32 Specification) */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Starting</span>
                    <p className="text-lg font-bold text-slate-800 mt-1">{g.target?.starting_value} {g.target?.unit}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-center">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">Current</span>
                    <p className="text-xl font-extrabold text-emerald-800 mt-1">{g.target?.current_value} {g.target?.unit}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Target</span>
                    <p className="text-lg font-bold text-slate-800 mt-1">{g.target?.target_value} {g.target?.unit}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Remaining</span>
                    <p className="text-lg font-bold text-slate-800 mt-1">{p.remaining || 0} {g.target?.unit}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 text-white text-center col-span-2 sm:col-span-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Total Progress</span>
                    <p className="text-xl font-extrabold text-emerald-400 mt-1">{p.progressPercentage || 0}%</p>
                  </div>
                </div>

                {/* Main Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-slate-600">
                    <span>Adherence Progress to Goal</span>
                    <span>Target Date: {g.target_date}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden p-0.5">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-3 rounded-full transition-all duration-700 shadow-xs"
                      style={{ width: `${Math.min(100, Math.max(5, p.progressPercentage || 0))}%` }}
                    />
                  </div>
                </div>

                {/* Milestones Checklist (Section 32 Specification) */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Phased Milestone Checkpoints
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {g.milestones?.map((m) => (
                      <div
                        key={m.id}
                        className={`p-3 rounded-2xl border transition ${
                          m.status === "ACHIEVED"
                            ? "bg-emerald-50 border-emerald-300 text-emerald-950 shadow-2xs"
                            : m.status === "ACTIVE"
                            ? "bg-blue-50/70 border-blue-200 text-blue-950"
                            : "bg-slate-50/50 border-slate-200 text-slate-600"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-extrabold text-sm">{m.target_value} {g.target?.unit}</span>
                          {m.status === "ACHIEVED" ? (
                            <span className="text-emerald-600 font-extrabold text-base">✓</span>
                          ) : m.status === "ACTIVE" ? (
                            <span className="text-blue-600 font-bold text-base">●</span>
                          ) : (
                            <span className="text-slate-400 font-bold text-base">○</span>
                          )}
                        </div>
                        <p className="text-[10px] font-semibold opacity-80">{m.notes || m.status}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Historical Measurement Graph / Visual List */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Measurement Timeline History
                  </h3>
                  <div className="overflow-x-auto">
                    <div className="flex gap-3 pb-2">
                      {measurements.map((m) => (
                        <div key={m.id} className="min-w-[140px] p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex-shrink-0">
                          <span className="text-[10px] text-slate-400 block font-medium">{m.recorded_date}</span>
                          <span className="text-base font-extrabold text-slate-900 block mt-0.5">
                            {m.recorded_value} {g.target?.unit}
                          </span>
                          <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">{m.notes || "Check-in log"}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Log Measurement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Log Progress for {activeGoal?.goal_name}
            </h3>
            <form onSubmit={handleLogMeasurement} className="space-y-4 text-xs">
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
                  Recorded Value ({activeGoal?.target?.unit}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={measureVal}
                  onChange={(e) => setMeasureVal(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-bold"
                  placeholder={`Current measurement in ${activeGoal?.target?.unit}`}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Daily Notes / Reflections</label>
                <textarea
                  rows={2}
                  value={measureNotes}
                  onChange={(e) => setMeasureNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  placeholder="How did you feel today? Any dietary notes?"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {saving ? "Saving..." : "Save Measurement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
