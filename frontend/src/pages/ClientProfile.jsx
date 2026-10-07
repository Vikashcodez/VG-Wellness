import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "../components/Header.jsx";
import Modal from "../components/Modal.jsx";
import { clientService } from "../services/clientService.js";
import { goalService } from "../services/goalService.js";
import {
  User, Calendar, FileText, Target, TrendingUp, Sparkles,
  Package, Crown, ShoppingBag, ShoppingCart, Receipt, IndianRupee,
  Activity, ArrowLeft, Plus, CheckCircle, Clock, AlertCircle, ShieldAlert
} from "lucide-react";

export default function ClientProfile() {
  const { id } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Measurement Modal State
  const [isMeasurementModalOpen, setIsMeasurementModalOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState(null);
  const [measureVal, setMeasureVal] = useState("");
  const [measureNotes, setMeasureNotes] = useState("");
  const [measureDate, setMeasureDate] = useState(new Date().toISOString().split("T")[0]);
  const [savingMeasure, setSavingMeasure] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await clientService.getById(id);
      if (res.success) {
        setProfileData(res.data);
      }
    } catch (err) {
      console.error("Error fetching client profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const handleRecordMeasurement = async (e) => {
    e.preventDefault();
    if (!selectedGoalId || !measureVal) return;
    setSavingMeasure(true);
    try {
      await goalService.recordMeasurement(selectedGoalId, {
        recordedValue: parseFloat(measureVal),
        recordedDate: measureDate,
        notes: measureNotes
      });
      setIsMeasurementModalOpen(false);
      setMeasureVal("");
      setMeasureNotes("");
      fetchProfile();
    } catch (err) {
      alert(err.message || "Failed to record measurement");
    } finally {
      setSavingMeasure(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-12 flex items-center justify-center text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mr-3" />
        <span>Loading comprehensive client profile...</span>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex-1 p-12 text-center text-slate-500">
        <p className="font-semibold text-lg text-slate-800">Client profile not found</p>
        <Link to="/clients" className="mt-3 inline-block text-sm text-emerald-600 underline">
          Return to clients list
        </Link>
      </div>
    );
  }

  const {
    profile, addresses, emergencyContacts, appointments,
    assessments, goals, plans, packages, memberships,
    recommendations, orders, invoices, payments, activities, activityLogs
  } = profileData;

  const tabs = [
    { id: "overview", label: "Overview", icon: User },
    { id: "appointments", label: "Appointments", icon: Calendar, badge: appointments.length },
    { id: "assessments", label: "Assessments", icon: FileText, badge: assessments.length },
    { id: "goals", label: "Goals & Progress", icon: Target, badge: goals.length },
    { id: "plans", label: "Wellness Plans", icon: Sparkles, badge: plans.length },
    { id: "packages", label: "Packages & Tiers", icon: Package, badge: packages.length + memberships.length },
    { id: "products", label: "Recommendations & Orders", icon: ShoppingBag, badge: orders.length },
    { id: "billing", label: "Invoices & Payments", icon: Receipt, badge: invoices.length },
    { id: "activities", label: "Daily Habits", icon: Activity, badge: activityLogs.length },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title={`${profile.first_name} ${profile.last_name}`}
        subtitle={`Client ID: ${profile.client_code} • ${profile.gender} • ${profile.age || "N/A"} years`}
        actions={
          <Link
            to="/clients"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Clients</span>
          </Link>
        }
      />

      <div className="p-8 space-y-6 flex-1">
        {/* Client Top Identity Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white font-extrabold flex items-center justify-center text-2xl shadow-md shadow-emerald-900/20">
              {profile.first_name[0]}{profile.last_name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{profile.first_name} {profile.last_name}</h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                  {profile.is_active ? "ACTIVE CLIENT" : "INACTIVE"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                <span className="font-mono font-semibold text-emerald-700">{profile.client_code}</span> • Mobile: {profile.mobile} • Email: {profile.email || "N/A"}
              </p>
              {addresses[0] && (
                <p className="text-xs text-slate-400 mt-0.5">
                  📍 {addresses[0].address_line1}, {addresses[0].city}, {addresses[0].pincode}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
            <div className="text-center">
              <span className="block text-[11px] font-semibold text-slate-400 uppercase">Sessions</span>
              <span className="text-lg font-bold text-slate-900">{appointments.length}</span>
            </div>
            <div className="text-center">
              <span className="block text-[11px] font-semibold text-slate-400 uppercase">Active Goals</span>
              <span className="text-lg font-bold text-emerald-600">{goals.filter(g => g.status === "ACTIVE").length}</span>
            </div>
            <div className="text-center">
              <span className="block text-[11px] font-semibold text-slate-400 uppercase">Balance Due</span>
              <span className="text-lg font-bold text-rose-600">
                ₹{invoices.filter(i => i.status !== "PAID" && i.status !== "CANCELLED").reduce((acc, curr) => acc + parseFloat(curr.balance_amount || 0), 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* 15-Tab Navigation Bar */}
        <div className="border-b border-slate-200 flex gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeTab === tab.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <tab.icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? "text-emerald-400" : "text-slate-400"}`} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === tab.id ? "bg-slate-800 text-emerald-300" : "bg-slate-100 text-slate-600"
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Active Goals Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-bold text-slate-900">Active Goals & Progress</h3>
                  </div>
                  <span className="text-xs text-slate-400">{goals.length} Goals Registered</span>
                </div>

                {goals.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4">No wellness goals initiated for this client yet.</p>
                ) : (
                  goals.map((g) => (
                    <div key={g.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{g.goal_name}</h4>
                          <p className="text-xs text-slate-500">
                            Baseline: {g.target?.starting_value} {g.target?.unit} → Target: {g.target?.target_value} {g.target?.unit}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-base font-extrabold text-emerald-700">
                            {g.target?.current_value} {g.target?.unit}
                          </span>
                          <span className="block text-[10px] uppercase font-bold text-emerald-600">
                            Current Value
                          </span>
                        </div>
                      </div>

                      {/* Milestones checklist */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/60">
                        {g.milestones?.map((m) => (
                          <div key={m.id} className={`p-2 rounded-lg text-xs border ${
                            m.status === "ACHIEVED"
                              ? "bg-emerald-50/80 border-emerald-200 text-emerald-800"
                              : "bg-white border-slate-200 text-slate-600"
                          }`}>
                            <div className="flex items-center justify-between">
                              <span className="font-bold">{m.target_value} {g.target?.unit}</span>
                              {m.status === "ACHIEVED" ? (
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 block mt-0.5">{m.status}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          onClick={() => {
                            setSelectedGoalId(g.id);
                            setIsMeasurementModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition cursor-pointer"
                        >
                          + Log New Measurement
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Current Wellness Plan Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    <h3 className="text-sm font-bold text-slate-900">Current Wellness Plan</h3>
                  </div>
                </div>

                {plans.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4">No plan assigned to client.</p>
                ) : (
                  plans.map((p) => (
                    <div key={p.id} className="p-4 rounded-xl border border-teal-100 bg-teal-50/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-900 text-sm">{p.plan_name}</h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800">
                          {p.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{p.plan_description}</p>
                      <p className="text-[11px] text-teal-700 font-medium">
                        Period: {p.start_date} to {p.end_date} • Supervised by Dr. {p.practitioner_first_name} {p.practitioner_last_name}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Column: Upcoming & Emergency info */}
            <div className="space-y-6">
              {/* Emergency Contact */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Emergency Contact</h3>
                {emergencyContacts.length > 0 ? (
                  emergencyContacts.map((c) => (
                    <div key={c.id} className="text-xs text-slate-700 space-y-1">
                      <p className="font-bold text-slate-900">{c.contact_name} ({c.relationship})</p>
                      <p>📞 {c.mobile}</p>
                      {c.email && <p>✉️ {c.email}</p>}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">None specified</p>
                )}
              </div>

              {/* Latest Biometric Assessment Snapshot */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Latest Biometric Scan</h3>
                {assessments[0] ? (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">Weight</span>
                      <span className="font-bold text-slate-900 text-sm">{assessments[0].weight} kg</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">BMI Score</span>
                      <span className="font-bold text-slate-900 text-sm">{assessments[0].bmi}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">Body Fat</span>
                      <span className="font-bold text-slate-900 text-sm">{assessments[0].body_fat_pct}%</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">Sleep Avg</span>
                      <span className="font-bold text-slate-900 text-sm">{assessments[0].sleep_hours} hrs</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No assessments recorded yet</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: APPOINTMENTS */}
        {activeTab === "appointments" && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Appointment History</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-bold uppercase">
                    <th className="py-2.5 px-4">Appt #</th>
                    <th className="py-2.5 px-4">Date & Time</th>
                    <th className="py-2.5 px-4">Service</th>
                    <th className="py-2.5 px-4">Practitioner</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appointments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">{a.appointment_number}</td>
                      <td className="py-3 px-4">{a.appointment_date} at {a.start_time?.slice(0, 5)}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{a.service_name}</td>
                      <td className="py-3 px-4">Dr. {a.practitioner_first_name} {a.practitioner_last_name}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: ASSESSMENTS */}
        {activeTab === "assessments" && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Historical Assessments & Clinical Evaluations</h3>
            <div className="space-y-4">
              {assessments.map((a) => (
                <div key={a.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900">Assessment on {a.assessment_date}</span>
                      <p className="text-[11px] text-slate-500">Conducted by Dr. {a.practitioner_first_name} {a.practitioner_last_name}</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-700">BMI {a.bmi} • Stress {a.stress_level}</span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs">
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">Weight</span>
                      <span className="font-bold">{a.weight} kg</span>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">Height</span>
                      <span className="font-bold">{a.height} cm</span>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">Body Fat</span>
                      <span className="font-bold">{a.body_fat_pct}%</span>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">Muscle Mass</span>
                      <span className="font-bold">{a.muscle_mass_kg} kg</span>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">Hydration</span>
                      <span className="font-bold">{a.water_intake_l} L/day</span>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">Sleep</span>
                      <span className="font-bold">{a.sleep_hours} hrs</span>
                    </div>
                  </div>
                  {a.clinical_notes && (
                    <p className="text-xs text-slate-600 bg-white p-2.5 rounded border border-slate-200">
                      <strong className="text-slate-800">Clinical Observations:</strong> {a.clinical_notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: GOALS */}
        {activeTab === "goals" && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
            <h3 className="text-sm font-bold text-slate-900">Generic Goal Engine Metrics & Historical Progression</h3>
            {goals.map((g) => (
              <div key={g.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-base text-slate-900">{g.goal_name}</h4>
                    <p className="text-xs text-slate-500">{g.description}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    {g.status}
                  </span>
                </div>

                {/* Historical measurements table */}
                <div>
                  <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Historical Measurement Records</h5>
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-bold">
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3">Recorded Value</th>
                          <th className="py-2 px-3">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {g.measurements?.map((m) => (
                          <tr key={m.id}>
                            <td className="py-2 px-3 font-medium text-slate-900">{m.recorded_date}</td>
                            <td className="py-2 px-3 font-bold text-emerald-700">{m.recorded_value} {g.target?.unit}</td>
                            <td className="py-2 px-3 text-slate-600">{m.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 8: BILLING */}
        {activeTab === "billing" && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Invoices & Financial Ledger</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-bold uppercase">
                    <th className="py-2.5 px-4">Invoice #</th>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Total Amount</th>
                    <th className="py-2.5 px-4">Paid</th>
                    <th className="py-2.5 px-4">Balance</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">{inv.invoice_number}</td>
                      <td className="py-3 px-4">{inv.invoice_date}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">₹{parseFloat(inv.total_amount).toLocaleString()}</td>
                      <td className="py-3 px-4 text-emerald-600 font-medium">₹{parseFloat(inv.paid_amount).toLocaleString()}</td>
                      <td className="py-3 px-4 text-rose-600 font-bold">₹{parseFloat(inv.balance_amount).toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          inv.status === "PAID" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Record Measurement Modal */}
      <Modal
        isOpen={isMeasurementModalOpen}
        onClose={() => setIsMeasurementModalOpen(false)}
        title="Record Goal Progress Measurement"
      >
        <form onSubmit={handleRecordMeasurement} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Measurement Date *</label>
            <input
              type="date"
              required
              value={measureDate}
              onChange={(e) => setMeasureDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Recorded Value *</label>
            <input
              type="number"
              step="0.01"
              required
              value={measureVal}
              onChange={(e) => setMeasureVal(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
              placeholder="e.g. 82.4"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Progress Notes</label>
            <textarea
              rows={3}
              value={measureNotes}
              onChange={(e) => setMeasureNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
              placeholder="Weekly progress note, patient feedback, adherence..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsMeasurementModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingMeasure}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {savingMeasure ? "Saving..." : "Record Measurement"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
