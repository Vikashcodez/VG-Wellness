import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { LayoutProvider, useLayout } from "../context/LayoutContext.jsx";

function DashboardLayoutContent() {
  const { user, loading } = useAuth();
  const { sidebarOpen, closeSidebar } = useLayout();

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#f4f6f8] text-slate-800">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">Initializing Workspace...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-[#f4f6f8] text-slate-800 antialiased font-sans">
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          onClick={closeSidebar}
          aria-hidden="true"
          className="fixed inset-0 bg-slate-900/40 z-30 lg:hidden backdrop-blur-xs transition-opacity duration-200"
        />
      )}

      {/* Enterprise Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default function DashboardLayout() {
  return (
    <LayoutProvider>
      <DashboardLayoutContent />
    </LayoutProvider>
  );
}
