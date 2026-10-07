import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const loggedUser = await login(email, password);
      const role = loggedUser?.role;
      if (role === "SUPER_ADMIN") {
        navigate("/saas/centres");
      } else if (role === "CENTRE_ADMIN" || role === "ADMIN") {
        navigate("/branches");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (fillEmail, fillPass) => {
    setEmail(fillEmail);
    setPassword(fillPass);
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8] flex flex-col justify-center py-10 sm:px-6 lg:px-8 antialiased">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded bg-blue-600 text-white font-black text-sm tracking-widest shadow-xs mb-2">
          VGT
        </div>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          VGT Wellness Centre Management
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Enterprise Multi-Tenant Centre Operations & Clinical Portal
        </p>
      </div>

      <div className="mt-5 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="crm-card p-6 shadow-sm">
          {error && (
            <div className="mb-3.5 p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          <form className="space-y-3.5 text-xs" onSubmit={handleSubmit}>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Official Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="crm-input w-full h-9"
                placeholder="user@wellness.com"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="crm-input w-full h-9"
                placeholder="••••••••"
              />
            </div>

            <div className="pt-1.5">
              <button
                type="submit"
                disabled={loading}
                className="crm-btn-primary w-full h-9 text-xs font-bold"
              >
                {loading ? "Authenticating..." : "Sign In to Workspace"}
              </button>
            </div>
          </form>

          {/* Quick Demo Access Pills */}
          <div className="mt-5 pt-3.5 border-t border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Quick Role Test Logins:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickFill("admin@wellness.com", "Admin@123")}
                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold transition cursor-pointer"
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("admin@vikash.com", "password123")}
                className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-semibold transition cursor-pointer"
              >
                Centre Admin (Vikash)
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("reception@wellness.com", "Reception@123")}
                className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 text-[10px] font-semibold transition cursor-pointer"
              >
                Receptionist
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("doctor@wellness.com", "Staff@123")}
                className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-semibold transition cursor-pointer"
              >
                Doctor / Clinical
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 font-medium">
              VGT Wellness Centre Management System • Enterprise Cloud
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
