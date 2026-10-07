import React, { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import Header from "../components/Header.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { dashboardService } from "../services/dashboardService.js";
import { ChevronRight } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();

  if (user?.role === "SUPER_ADMIN") {
    return <Navigate to="/saas/centres" replace />;
  }
  if (user?.role === "CENTRE_ADMIN") {
    return <Navigate to="/branches" replace />;
  }

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
      <div className="flex-1 p-6 flex items-center justify-center text-slate-500">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
        <span className="text-xs font-semibold text-slate-600">Loading operational analytics...</span>
      </div>
    );
  }

  const kpis = stats?.kpis || {};

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#f4f6f8]">
      <Header
        title="Operations Control Centre"
        subtitle="Real-time KPI metrics, daily appointments queue, and revenue velocity"
        actions={
          <div className="flex items-center gap-1.5">
            <Link to="/appointments" className="crm-btn-primary">
              Schedule Visit
            </Link>
            <Link to="/billing" className="crm-btn-secondary">
              Generate Invoice
            </Link>
          </div>
        }
      />

      <div className="p-3.5 sm:p-5 space-y-3.5 flex-1 max-w-full">
        {/* LeadSquared CRM KPI Ribbon - High Density, No Cartoon Icons */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Today's Appointments */}
          <div className="crm-stat-tile border-l-[3px] border-l-blue-600">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Today's Schedule
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {kpis.todayAppointments || 0}
              </span>
              <span className="crm-badge-info">
                Active Queue
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Confirmed & in-session slots
            </p>
          </div>

          {/* Today's Revenue */}
          <div className="crm-stat-tile border-l-[3px] border-l-emerald-600">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Today's Collections
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                ₹{kpis.todayRevenue?.toLocaleString() || 0}
              </span>
              <span className="crm-badge-success">
                Paid
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              ₹{kpis.monthlyRevenue?.toLocaleString() || 0} this month
            </p>
          </div>

          {/* Active Clients */}
          <div className="crm-stat-tile border-l-[3px] border-l-indigo-600">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Active Clients
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {kpis.activeClients || 0}
              </span>
              <span className="crm-badge-neutral">
                +{kpis.newClientsThisMonth || 0} MTD
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Registered wellness accounts
            </p>
          </div>

          {/* Goal Engine */}
          <div className="crm-stat-tile border-l-[3px] border-l-amber-600">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Goal Tracking
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {kpis.activeGoals || 0}
              </span>
              <span className="crm-badge-warning">
                {kpis.achievedGoals || 0} Done
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Target health transformations
            </p>
          </div>
        </div>

        {/* Secondary Metric Bar - Compact LeadSquared White Strip */}
        <div className="crm-card grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 p-2 sm:p-2.5">
          <div className="px-3 py-1.5 sm:py-0">
            <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">
              Active Plans
            </span>
            <div className="text-sm font-bold text-slate-800">
              {kpis.activeWellnessPlans || 0} Enrolled
            </div>
          </div>
          <div className="px-3 py-1.5 sm:py-0">
            <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">
              Low Stock Alerts
            </span>
            <div className={`text-sm font-bold ${kpis.lowStockCount > 0 ? "text-rose-600" : "text-slate-800"}`}>
              {kpis.lowStockCount || 0} SKUs Critical
            </div>
          </div>
          <div className="px-3 py-1.5 sm:py-0">
            <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">
              Pending Orders
            </span>
            <div className="text-sm font-bold text-slate-800">
              {kpis.pendingOrders || 0} Processing
            </div>
          </div>
          <div className="px-3 py-1.5 sm:py-0">
            <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">
              Outstanding Due
            </span>
            <div className={`text-sm font-bold ${kpis.outstandingPayments > 0 ? "text-amber-700" : "text-slate-800"}`}>
              ₹{kpis.outstandingPayments?.toLocaleString() || 0}
            </div>
          </div>
        </div>

        {/* LeadSquared 2-Column High Density Operations View */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
          {/* Revenue Velocity & Quick Actions */}
          <div className="lg:col-span-2 crm-card p-3.5 sm:p-4 space-y-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <div>
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                    Revenue Velocity (Recent 7 Days)
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Daily collections from services, packages, and clinical retail
                  </p>
                </div>
                <span className="crm-badge-success">
                  Real-Time
                </span>
              </div>

              {/* High-density progress breakdown */}
              <div className="mt-3 space-y-2">
                {stats?.revenueTrend?.length > 0 ? (
                  stats.revenueTrend.map((day, idx) => {
                    const rev = parseFloat(day.revenue) || 0;
                    const maxRev = Math.max(
                      ...stats.revenueTrend.map((d) => parseFloat(d.revenue) || 0),
                      5000
                    );
                    const pct = Math.min(100, Math.max(6, (rev / maxRev) * 100));
                    return (
                      <div key={idx} className="space-y-0.5">
                        <div className="flex justify-between text-[11px]">
                          <span className="font-medium text-slate-600">{day.date}</span>
                          <span className="font-bold text-slate-900">
                            ₹{rev.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    No financial transactions recorded in the recent cycle.
                  </div>
                )}
              </div>
            </div>

            {/* Compact Action Ribbon */}
            <div className="pt-3 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Direct Workflows
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Link
                  to="/appointments"
                  className="crm-btn-secondary text-center justify-center font-medium"
                >
                  Book Visit
                </Link>
                <Link
                  to="/queue"
                  className="crm-btn-secondary text-center justify-center font-medium"
                >
                  Reception Queue
                </Link>
                <Link
                  to="/clients"
                  className="crm-btn-secondary text-center justify-center font-medium"
                >
                  Client Directory
                </Link>
                <Link
                  to="/billing"
                  className="crm-btn-secondary text-center justify-center font-medium"
                >
                  Billing Ledger
                </Link>
              </div>
            </div>
          </div>

          {/* Today's Queue Compact Data List */}
          <div className="crm-card p-3.5 sm:p-4 flex flex-col">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-2">
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                  Today's Queue
                </h2>
                <p className="text-[11px] text-slate-500">Scheduled clinical sessions</p>
              </div>
              <Link
                to="/queue"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center"
              >
                Full Queue <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </Link>
            </div>

            <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[380px]">
              {stats?.upcomingToday?.length > 0 ? (
                stats.upcomingToday.map((appt) => (
                  <div
                    key={appt.id}
                    className="p-2 rounded border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center justify-between text-xs mb-0.5">
                      <span className="font-bold text-slate-900">
                        {appt.start_time?.slice(0, 5)}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${
                          appt.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : appt.status === "CONFIRMED"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : appt.status === "CHECKED_IN"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {appt.status}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-800">
                      {appt.client_first_name} {appt.client_last_name}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {appt.service_name}
                    </div>
                    <div className="text-[10px] font-medium text-blue-700 mt-0.5">
                      Dr. {appt.practitioner_first_name} {appt.practitioner_last_name}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-slate-400 text-xs">
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
