import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import ClientNavbar from "../components/ClientNavbar.jsx";
import { useClientAuth } from "../context/ClientAuthContext.jsx";

export default function ClientLayout() {
  const { user, loading } = useClientAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mr-3" />
        <span className="text-sm font-medium">Connecting to Aura Life Wellness...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <ClientNavbar />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        <p>© 2026 Aura Life Wellness Group. All clinical guidelines & records strictly confidential.</p>
      </footer>
    </div>
  );
}
