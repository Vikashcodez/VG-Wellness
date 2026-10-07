import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  LayoutDashboard, Users, Calendar, UserCheck, Stethoscope,
  Sparkles, Target, FileText, Package, Crown, ShoppingBag,
  Boxes, Receipt, BarChart3, Settings, LogOut
} from "lucide-react";

export default function Sidebar() {
  const location = useLocation();
  const { user, logout, hasRole } = useAuth();

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Clients", href: "/clients", icon: Users },
    { name: "Appointments", href: "/appointments", icon: Calendar },
    { name: "Check-in Queue", href: "/queue", icon: UserCheck },
    { name: "Practitioners", href: "/practitioners", icon: Stethoscope },
    { name: "Services", href: "/services", icon: Sparkles },
    { name: "Assessments", href: "/assessments", icon: FileText },
    { name: "Goal Engine", href: "/goals", icon: Target },
    { name: "Wellness Plans", href: "/wellness-plans", icon: Sparkles },
    { name: "Packages & Tiers", href: "/packages", icon: Package },
    { name: "Products", href: "/products", icon: ShoppingBag },
    { name: "Inventory Stock", href: "/inventory", icon: Boxes },
    { name: "Billing & Invoices", href: "/billing", icon: Receipt },
    { name: "Reports", href: "/reports", icon: BarChart3 },
    { name: "Settings & Audit", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 h-screen sticky top-0 border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-5 flex items-center gap-3 border-b border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-900/30">
          🌿
        </div>
        <div>
          <h1 className="text-base font-bold text-white tracking-wide">AURA LIFE</h1>
          <p className="text-xs text-emerald-400 font-medium">Wellness Centre Staff</p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href || (item.href !== "/" && location.pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <item.icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Current User Profile Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-semibold text-emerald-400">
              {user?.firstName?.[0] || "U"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.firstName} {user?.lastName}</p>
              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-900/60 text-emerald-300 border border-emerald-800">
                {user?.role}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            title="Logout"
            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
