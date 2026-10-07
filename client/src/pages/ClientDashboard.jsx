import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";
import { useClientAuth } from "../context/ClientAuthContext.jsx";
import {
  Calendar, Target, Sparkles, Package, Crown, ShoppingBag,
  TrendingUp, TrendingDown, ArrowRight, Clock, CheckCircle2,
  AlertCircle, ShieldCheck
} from "lucide-react";

export default function ClientDashboard() {
  const { user } = useClientAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/dashboard/client");
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error("Client dashboard error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center text-slate-500 text-sm">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mr-3" />
        <span>Loading your personalized wellness journey...</span>
      </div>
    );
  }

  const {
    nextAppointment, goals = [], wellnessPlan, package: clientPkg,
    membership, recommendedProducts = [], outstandingBalance = 0, recentInvoices = []
  } = data || {};

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            Aura Life Journey Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-emerald-100/80 text-xs sm:text-sm leading-relaxed">
            Track your biometrics, target milestones, assigned nutrition & yoga plans, and clinical practitioner recommendations in real-time.
          </p>
        </div>
      </div>

      {/* Primary Highlights: Upcoming Appt & Active Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Appointment Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Next Session</span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Calendar className="w-4 h-4" />
              </div>
            </div>

            {nextAppointment ? (
              <div className="space-y-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{nextAppointment.service_name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Dr. {nextAppointment.practitioner_first_name} {nextAppointment.practitioner_last_name} ({nextAppointment.qualification})
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-700">{nextAppointment.appointment_date}</span>
                  <span className="text-emerald-700 font-bold">{nextAppointment.start_time?.slice(0, 5)}</span>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 text-xs">
                <p>No upcoming appointments scheduled.</p>
                <Link to="/appointments" className="mt-2 inline-block text-emerald-600 font-bold hover:underline">
                  Book a consultation
                </Link>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <Link
              to="/appointments"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center justify-between"
            >
              <span>Manage Appointments</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Primary Goal Progress Card */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Active Health Goal Progress</h2>
            </div>
            <Link to="/goals" className="text-xs font-bold text-emerald-600 hover:underline">
              View Detailed Graph
            </Link>
          </div>

          {goals.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No active wellness goals recorded. Consult your practitioner to begin your custom protocol.
            </div>
          ) : (
            goals.map((g) => {
              const p = g.progress || {};
              return (
                <div key={g.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{g.goal_name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Baseline: {g.target?.starting_value} {g.target?.unit} → Target: {g.target?.target_value} {g.target?.unit}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-extrabold text-emerald-700">
                        {g.target?.current_value} {g.target?.unit}
                      </span>
                      <span className="block text-[10px] text-emerald-600 font-bold uppercase">
                        Current
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-600">Adherence Progress</span>
                      <span className="text-emerald-700">{p.progressPercentage || 0}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-400 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(5, p.progressPercentage || 0))}%` }}
                      />
                    </div>
                  </div>

                  {/* Milestones bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {g.milestones?.map((m) => (
                      <div
                        key={m.id}
                        className={`p-2 rounded-lg text-xs border ${
                          m.status === "ACHIEVED"
                            ? "bg-emerald-100/70 border-emerald-300 text-emerald-900 font-bold"
                            : "bg-white border-slate-200 text-slate-600"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{m.target_value} {g.target?.unit}</span>
                          {m.status === "ACHIEVED" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        </div>
                        <span className="text-[10px] opacity-75">{m.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Wellness Plan & Packages Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Wellness Plan */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Plan</span>
            <Sparkles className="w-4 h-4 text-teal-600" />
          </div>
          {wellnessPlan ? (
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-sm">{wellnessPlan.plan_name}</h3>
              <p className="text-xs text-slate-600 line-clamp-2">{wellnessPlan.plan_description}</p>
              <p className="text-[11px] text-teal-700 font-semibold">
                Supervised by Dr. {wellnessPlan.practitioner_first_name} {wellnessPlan.practitioner_last_name}
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-4">No active plan assigned.</p>
          )}
          <Link to="/wellness-plans" className="text-xs font-bold text-teal-600 hover:underline block pt-2">
            View Prescribed Schedule →
          </Link>
        </div>

        {/* Package Balance */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Session Package</span>
            <Package className="w-4 h-4 text-emerald-600" />
          </div>
          {clientPkg ? (
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-sm">{clientPkg.package_name}</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900">
                  {clientPkg.total_sessions - clientPkg.used_sessions}
                </span>
                <span className="text-xs text-slate-500">of {clientPkg.total_sessions} sessions left</span>
              </div>
              <p className="text-[11px] text-slate-400">Expires: {clientPkg.expiry_date}</p>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-4">No session package enrolled.</p>
          )}
          <Link to="/packages" className="text-xs font-bold text-emerald-600 hover:underline block pt-2">
            Explore Wellness Packages →
          </Link>
        </div>

        {/* Membership Tier */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Membership Status</span>
            <Crown className="w-4 h-4 text-amber-500" />
          </div>
          {membership ? (
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-sm">{membership.plan_name}</h3>
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                {membership.tier} MEMBER
              </span>
              <p className="text-xs text-slate-600">{membership.discount_percent}% off on all services & store products</p>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-4">Standard Guest Tier.</p>
          )}
          <Link to="/packages" className="text-xs font-bold text-amber-600 hover:underline block pt-2">
            Upgrade Membership Tier →
          </Link>
        </div>
      </div>

      {/* Practitioner Recommended Products */}
      {recommendedProducts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recommended for Your Plan</h2>
              <p className="text-xs text-slate-500">Clinically curated formulations prescribed by your practitioners</p>
            </div>
            <Link to="/store" className="text-xs font-bold text-emerald-600 hover:underline">
              Visit Wellness Store →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedProducts.map((p) => (
              <div key={p.id} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3">
                <div className="flex gap-3">
                  <img
                    src={p.image_url || "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=300&q=80"}
                    alt={p.product_name}
                    className="w-20 h-20 object-cover rounded-xl bg-slate-100"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      Prescribed
                    </span>
                    <h3 className="font-bold text-slate-900 text-xs mt-1 truncate">{p.product_name}</h3>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{p.reason}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">₹{parseFloat(p.price).toLocaleString()}</span>
                  <Link
                    to="/store"
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                  >
                    View & Order
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
