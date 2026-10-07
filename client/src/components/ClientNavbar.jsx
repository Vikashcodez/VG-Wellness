import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useClientAuth } from "../context/ClientAuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import {
  LayoutDashboard, Calendar, Target, Sparkles, Package,
  ShoppingBag, ShoppingCart, Receipt, User, LogOut, Menu, X
} from "lucide-react";

export default function ClientNavbar() {
  const { user, logout } = useClientAuth();
  const { itemCount } = useCart();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const links = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Appointments", href: "/appointments", icon: Calendar },
    { name: "My Goals", href: "/goals", icon: Target },
    { name: "Wellness Plan", href: "/wellness-plans", icon: Sparkles },
    { name: "Packages & Tier", href: "/packages", icon: Package },
    { name: "Wellness Store", href: "/store", icon: ShoppingBag },
    { name: "Invoices", href: "/invoices", icon: Receipt },
  ];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white text-lg font-bold shadow-xs">
                🌿
              </div>
              <div>
                <span className="text-base font-extrabold text-slate-900 tracking-tight">AURA LIFE</span>
                <span className="hidden sm:inline-block ml-1 text-xs text-emerald-600 font-semibold">• Client Portal</span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center space-x-1">
            {links.map((link) => {
              const active = location.pathname === link.href || (link.href !== "/dashboard" && location.pathname.startsWith(link.href));
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    active
                      ? "bg-emerald-50 text-emerald-800"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <link.icon className={`w-3.5 h-3.5 ${active ? "text-emerald-600" : "text-slate-400"}`} />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Action Icons: Cart & Profile */}
          <div className="flex items-center gap-3">
            <Link
              to="/cart"
              className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
              title="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-600 text-white font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                  {itemCount}
                </span>
              )}
            </Link>

            <Link
              to="/profile"
              className="hidden sm:flex items-center gap-2 p-1.5 pr-3 rounded-full border border-slate-200 hover:border-slate-300 transition text-xs font-semibold text-slate-800"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                {user?.firstName?.[0] || "C"}
              </div>
              <span className="max-w-[100px] truncate">{user?.firstName}</span>
            </Link>

            <button
              onClick={logout}
              title="Sign Out"
              className="hidden sm:flex p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 px-4 pt-2 pb-4 space-y-1 bg-white">
          {links.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
            >
              <link.icon className="w-4 h-4 text-emerald-600" />
              <span>{link.name}</span>
            </Link>
          ))}
          <div className="border-t border-slate-100 pt-2 mt-2">
            <Link
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700"
            >
              <User className="w-4 h-4 text-slate-400" />
              <span>My Profile ({user?.firstName})</span>
            </Link>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
              }}
              className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm font-medium text-rose-600"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
