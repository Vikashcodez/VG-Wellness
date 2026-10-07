import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useLayout } from "../context/LayoutContext.jsx";
import {
  LayoutDashboard, Users, Calendar, UserCheck, Stethoscope,
  Sparkles, Target, FileText, Package, ShoppingBag,
  Boxes, Receipt, BarChart3, Settings, LogOut, Building2,
  Users2, Wrench, Landmark, X
} from "lucide-react";

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { sidebarOpen, closeSidebar } = useLayout();
  const role = user?.role;

  let navigation = [];
  let portalTitle = "WELLNESS CRM";
  let portalSubtitle = "Operations Hub";

  if (role === "SUPER_ADMIN") {
    portalTitle = "SUPER ADMIN";
    portalSubtitle = "SaaS Platform Owner";
    navigation = [
      { name: "Wellness Centres", href: "/saas/centres", icon: Building2 },
      { name: "Platform Audit Logs", href: "/settings", icon: Settings },
    ];
  } else if (role === "CENTRE_ADMIN" || role === "ADMIN") {
    portalTitle = user?.organizationName || "CENTRE ADMIN";
    portalSubtitle = "Wellness Centre HQ";
    navigation = [
      { name: "Branches & Admins", href: "/branches", icon: LayoutDashboard },
      { name: "Staff Directory", href: "/employees", icon: Users2 },
      { name: "Centre Financials", href: "/finance", icon: Landmark },
      { name: "Consolidated Reports", href: "/reports", icon: BarChart3 },
      { name: "Centre Settings", href: "/settings", icon: Settings },
    ];
  } else if (role === "BRANCH_ADMIN" || role === "MANAGER") {
    portalTitle = user?.branchName || "BRANCH ADMIN";
    portalSubtitle = "Branch Operations";
    navigation = [
      { name: "Branch Dashboard", href: "/", icon: LayoutDashboard },
      { name: "Staff & Employees", href: "/employees", icon: Users2 },
      { name: "Services Master", href: "/services", icon: Sparkles },
      { name: "Packages & Tiers", href: "/packages", icon: Package },
      { name: "Products Master", href: "/products", icon: ShoppingBag },
      { name: "Inventory Stock", href: "/inventory", icon: Boxes },
      { name: "Asset Management", href: "/assets", icon: Wrench },
      { name: "Appointments Schedule", href: "/appointments", icon: Calendar },
      { name: "Front Desk Queue", href: "/queue", icon: UserCheck },
      { name: "Clients Directory", href: "/clients", icon: Users },
      { name: "Goal Engine", href: "/goals", icon: Target },
      { name: "Wellness Plans", href: "/wellness-plans", icon: Sparkles },
      { name: "Biometric Assessments", href: "/assessments", icon: FileText },
      { name: "Practitioners", href: "/practitioners", icon: Stethoscope },
      { name: "Billing & Invoices", href: "/billing", icon: Receipt },
      { name: "Accounts & Ledger", href: "/finance", icon: Landmark },
      { name: "Operational Reports", href: "/reports", icon: BarChart3 },
    ];
  } else if (["PRACTITIONER", "DOCTOR", "NUTRITIONIST", "THERAPIST"].includes(role)) {
    portalTitle = "CLINICAL PORTAL";
    portalSubtitle = `${user?.firstName || "Doctor"} (Clinical)`;
    navigation = [
      { name: "Consultation Board", href: "/", icon: LayoutDashboard },
      { name: "Assigned Clients", href: "/clients", icon: Users },
      { name: "My Appointments", href: "/appointments", icon: Calendar },
      { name: "Biometric Assessments", href: "/assessments", icon: FileText },
      { name: "Goal Engine", href: "/goals", icon: Target },
      { name: "Wellness Plans", href: "/wellness-plans", icon: Sparkles },
      { name: "Prescription Products", href: "/products", icon: ShoppingBag },
    ];
  } else if (role === "RECEPTIONIST") {
    portalTitle = "FRONT DESK";
    portalSubtitle = "Reception Desk";
    navigation = [
      { name: "Check-in Queue", href: "/queue", icon: UserCheck },
      { name: "Appointments Calendar", href: "/appointments", icon: Calendar },
      { name: "Client Intake", href: "/clients", icon: Users },
      { name: "Quick Billing", href: "/billing", icon: Receipt },
    ];
  } else if (["BILLING_STAFF", "ACCOUNTANT"].includes(role)) {
    portalTitle = "ACCOUNTS & BILLING";
    portalSubtitle = "Billing & Ledger";
    navigation = [
      { name: "Billing & Invoices", href: "/billing", icon: Receipt },
      { name: "Accounts & Finance", href: "/finance", icon: Landmark },
      { name: "Financial Reports", href: "/reports", icon: BarChart3 },
    ];
  } else {
    navigation = [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
      { name: "Clients", href: "/clients", icon: Users },
      { name: "Appointments", href: "/appointments", icon: Calendar },
      { name: "Front Desk Queue", href: "/queue", icon: UserCheck },
      { name: "Billing", href: "/billing", icon: Receipt },
    ];
  }

  // If employee has specific assigned permissions, override and display ONLY assigned tabs
  const userPermissions = Array.isArray(user?.permissions) ? user.permissions : [];
  if (userPermissions.length > 0 && !["SUPER_ADMIN", "CENTRE_ADMIN", "ADMIN"].includes(role)) {
    const allModulesMap = {
      dashboard: { name: "Branch Dashboard", href: "/", icon: LayoutDashboard },
      queue: { name: "Front Desk Queue", href: "/queue", icon: UserCheck },
      appointments: { name: "Appointments Schedule", href: "/appointments", icon: Calendar },
      clients: { name: "Clients Directory", href: "/clients", icon: Users },
      billing: { name: "Billing & Invoices", href: "/billing", icon: Receipt },
      services: { name: "Services Master", href: "/services", icon: Sparkles },
      packages: { name: "Packages & Tiers", href: "/packages", icon: Package },
      products: { name: "Products Master", href: "/products", icon: ShoppingBag },
      inventory: { name: "Inventory Stock", href: "/inventory", icon: Boxes },
      finance: { name: "Accounts & Ledger", href: "/finance", icon: Landmark },
      assets: { name: "Asset Management", href: "/assets", icon: Wrench },
      goals: { name: "Goal Engine", href: "/goals", icon: Target },
      "wellness-plans": { name: "Wellness Plans", href: "/wellness-plans", icon: Sparkles },
      assessments: { name: "Biometric Assessments", href: "/assessments", icon: FileText },
      practitioners: { name: "Practitioners", href: "/practitioners", icon: Stethoscope },
      employees: { name: "Staff & Employees", href: "/employees", icon: Users2 },
      reports: { name: "Operational Reports", href: "/reports", icon: BarChart3 },
      branches: { name: "Branches Directory", href: "/branches", icon: Building2 },
      settings: { name: "Settings", href: "/settings", icon: Settings },
    };

    const permittedList = userPermissions
      .filter((k) => allModulesMap[k])
      .map((k) => allModulesMap[k]);

    if (permittedList.length > 0) {
      navigation = permittedList;
      portalSubtitle = `${user?.firstName || "Employee"} (Assigned Access)`;
    }
  }

  return (
    <aside
      className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-60 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 transition-transform duration-200 ease-in-out ${
        sidebarOpen ? "translate-x-0 shadow-2xl lg:shadow-none" : "-translate-x-full lg:translate-x-0"
      }`}
    >
      {/* VGT Wellness CRM Brand Header */}
      <div className="h-12 px-3.5 flex items-center justify-between border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6.5 h-6.5 rounded bg-blue-600 flex items-center justify-center text-white text-[10px] font-black flex-shrink-0 tracking-wider">
            VGT
          </div>
          <div className="min-w-0 leading-tight">
            <h1 className="text-xs font-bold text-slate-900 tracking-tight truncate uppercase">
              {portalTitle || "VGT WELLNESS"}
            </h1>
            <p className="text-[10px] text-slate-500 font-medium truncate">
              {portalSubtitle || "Centre Management"}
            </p>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={closeSidebar}
          aria-label="Close menu"
          className="lg:hidden p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Links - LeadSquared High Density Theme */}
      <nav className="flex-1 overflow-y-auto py-2 px-1.5 space-y-0.5">
        <div className="px-2 pt-1 pb-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
          Navigation
        </div>
        {navigation.map((item) => {
          const isActive =
            location.pathname === item.href ||
            (item.href !== "/" && location.pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={closeSidebar}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs transition-colors duration-150 ${
                isActive
                  ? "bg-blue-50/80 text-blue-700 font-semibold border-l-[3px] border-blue-600 -ml-[1.5px]"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50/80 font-medium"
              }`}
            >
              <item.icon
                className={`w-3.5 h-3.5 flex-shrink-0 ${
                  isActive ? "text-blue-600" : "text-slate-400"
                }`}
              />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Footer Profile */}
      <div className="p-2.5 border-t border-slate-200 bg-slate-50/60">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center text-[11px] font-bold flex-shrink-0">
              {user?.firstName?.[0] || "U"}
            </div>
            <div className="min-w-0 leading-tight">
              <p className="text-xs font-semibold text-slate-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <span className="inline-block text-[9px] font-medium text-slate-500 uppercase tracking-wide truncate">
                {user?.role?.replace("_", " ")}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
