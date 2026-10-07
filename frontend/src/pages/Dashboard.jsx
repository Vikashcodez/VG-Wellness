import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header.jsx";
import { dashboardService } from "../services/dashboardService.js";
import {
  Calendar, IndianRupee, Users, Target, CheckCircle2,
  AlertTriangle, ShoppingCart, Sparkles, Clock, ArrowRight,
  TrendingUp, Activity
} from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await dashboardService.getAdminStats();
        if (res.success) {
          setStats(res.data);
        }
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mr-3" />
        <span>Loading operational metrics...</span>
      </div>
    );
  }

  const kpis = stats?.kpis || {};

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Centre Operations Dashboard"
        subtitle="Live snapshot of appointments, clinical goals, revenue, and client journeys"
      />

      <div className="p-8 space-y-8 flex-1">
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Today's Appointments */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Schedule</span>
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-slate-900">{kpis.todayAppointments}</div>
              <p className="text-xs text-blue-600 font-medium mt-1">Confirmed & In-Session</p>
            </div>
          </div>

          {/* Today's Revenue */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Revenue</span>
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                <IndianRupee className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-slate-900">₹{kpis.todayRevenue?.toLocaleString() || 0}</div>
              <p className="text-xs text-emerald-600 font-medium mt-1">₹{kpis.monthlyRevenue?.toLocaleString() || 0} this month</p>
            </div>
          </div>

          {/* Active Clients */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Clients</span>
              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-slate-900">{kpis.activeClients}</div>
              <p className="text-xs text-purple-600 font-medium mt-1">+{kpis.newClientsThisMonth} new this month</p>
            </div>
          </div>

          {/* Active Goals & Achieved */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Goal Engine</span>
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                <Target className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-slate-900">{kpis.activeGoals} Active</div>
              <p className="text-xs text-amber-600 font-medium mt-1">{kpis.achievedGoals} targets achieved</p>
            </div>
          </div>
        </div>

        {/* Secondary KPI Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-900 text-white p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Active Plans</p>
              <p className="text-lg font-bold">{kpis.activeWellnessPlans} Enrolled</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Low Stock SKUs</p>
              <p className="text-lg font-bold">{kpis.lowStockCount} items</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Pending Orders</p>
              <p className="text-lg font-bold">{kpis.pendingOrders} Orders</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Outstanding Invoices</p>
              <p className="text-lg font-bold">₹{kpis.outstandingPayments?.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>

        {/* Two Columns: Revenue Trend & Upcoming Appointments */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Revenue Trend & Distribution */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Revenue Velocity (Recent 7 Days)</h3>
                <p className="text-xs text-slate-500">Breakdown of daily collections across services, packages, and products</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                Live Data
              </span>
            </div>

            {/* Visual Bar representation */}
            <div className="space-y-4">
              {stats?.revenueTrend?.length > 0 ? (
                stats.revenueTrend.map((day, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-600">
                      <span>{day.date}</span>
                      <span className="font-semibold text-slate-900">₹{parseFloat(day.revenue).toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-400 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(15, (parseFloat(day.revenue) / (kpis.todayRevenue || 5000)) * 80))}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400 text-sm">
                  No payment collections recorded yet for this period.
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="border-t border-slate-100 pt-5">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Quick Operational Short-Cuts</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Link to="/appointments" className="p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-xs font-semibold text-slate-700 flex flex-col items-center gap-1.5 transition">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>Book Visit</span>
                </Link>
                <Link to="/queue" className="p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 text-xs font-semibold text-slate-700 flex flex-col items-center gap-1.5 transition">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span>Reception Queue</span>
                </Link>
                <Link to="/goals" className="p-3 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/40 text-xs font-semibold text-slate-700 flex flex-col items-center gap-1.5 transition">
                  <Target className="w-4 h-4 text-amber-600" />
                  <span>Goal Engine</span>
                </Link>
                <Link to="/billing" className="p-3 rounded-xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50/40 text-xs font-semibold text-slate-700 flex flex-col items-center gap-1.5 transition">
                  <IndianRupee className="w-4 h-4 text-purple-600" />
                  <span>New Invoice</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Today's Appointments Queue Preview */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Today's Queue</h3>
                <p className="text-xs text-slate-500">Upcoming sessions</p>
              </div>
              <Link to="/queue" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                Full Queue <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto max-h-[420px]">
              {stats?.upcomingToday?.length > 0 ? (
                stats.upcomingToday.map((appt) => (
                  <div key={appt.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900">{appt.start_time?.slice(0, 5)}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        appt.status === "COMPLETED" ? "bg-emerald-100 text-emerald-800" :
                        appt.status === "CONFIRMED" ? "bg-blue-100 text-blue-800" :
                        appt.status === "CHECKED_IN" ? "bg-amber-100 text-amber-800" :
                        "bg-slate-200 text-slate-700"
                      }`}>
                        {appt.status}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800">{appt.client_first_name} {appt.client_last_name}</p>
                    <p className="text-xs text-slate-500">{appt.service_name}</p>
                    <p className="text-[11px] text-emerald-700 font-medium mt-1">
                      Dr. {appt.practitioner_first_name} {appt.practitioner_last_name}
                    </p>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No further appointments scheduled for today.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
