import React from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { Bell, MapPin, Building2 } from "lucide-react";

export default function Header({ title, subtitle, actions }) {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-20 flex items-center justify-between shadow-xs">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Branch indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-600 font-medium">
          <Building2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>{user?.branchName || "Aura Life Flagship Centre"}</span>
        </div>

        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
