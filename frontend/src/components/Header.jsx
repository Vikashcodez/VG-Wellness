import React from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useLayout } from "../context/LayoutContext.jsx";
import { Menu, Building2 } from "lucide-react";

export default function Header({ title, subtitle, actions }) {
  const { user } = useAuth();
  const { toggleSidebar } = useLayout();

  return (
    <header className="bg-white border-b border-slate-200 px-3.5 sm:px-5 h-12 sticky top-0 z-20 flex items-center justify-between">
      {/* Left: Mobile hamburger + Page Title */}
      <div className="flex items-center min-w-0">
        <button
          onClick={toggleSidebar}
          aria-label="Toggle navigation menu"
          className="lg:hidden p-1.5 -ml-1 mr-2 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex items-baseline min-w-0">
          <h1 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <span className="text-[11px] text-slate-500 hidden md:inline-block border-l border-slate-200 pl-2.5 ml-2.5 truncate font-normal">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {/* Right: Branch Info & Primary Actions */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        {user?.branchName && (
          <div className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100/90 border border-slate-200 text-[11px] font-medium text-slate-700">
            <Building2 className="w-3 h-3 text-blue-600" />
            <span className="truncate max-w-[150px]">{user.branchName}</span>
          </div>
        )}

        {actions && <div className="flex items-center gap-1.5">{actions}</div>}
      </div>
    </header>
  );
}
