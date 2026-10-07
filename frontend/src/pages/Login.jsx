import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { ShieldCheck, Stethoscope, UserCheck, Receipt, Boxes, Apple } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("admin@wellness.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const setRoleCredentials = (roleEmail, rolePass) => {
    setEmail(roleEmail);
    setPassword(rolePass);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-3xl shadow-xl shadow-emerald-900/50">
            🌿
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold text-white tracking-tight">
          Aura Life Wellness
        </h2>
        <p className="mt-1 text-center text-sm text-emerald-400 font-medium">
          Hospital & Centre Staff Operations System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white/95 backdrop-blur-md py-8 px-6 shadow-2xl rounded-2xl border border-slate-100 sm:px-10">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Staff Email Address
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 shadow-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                  placeholder="staff@wellness.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 shadow-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Authenticating..." : "Sign In to Staff Portal"}
              </button>
            </div>
          </form>

          {/* Quick Demo Staff Logins */}
          <div className="mt-8 border-t border-slate-200 pt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 text-center">
              Quick Role Sign-In Switcher
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setRoleCredentials("admin@wellness.com", "admin123")}
                className="p-2 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 flex items-center gap-1.5 text-left text-slate-700 font-medium transition cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Admin</span>
              </button>

              <button
                type="button"
                onClick={() => setRoleCredentials("reception@wellness.com", "password123")}
                className="p-2 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 flex items-center gap-1.5 text-left text-slate-700 font-medium transition cursor-pointer"
              >
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span>Reception</span>
              </button>

              <button
                type="button"
                onClick={() => setRoleCredentials("dr.sharma@wellness.com", "password123")}
                className="p-2 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 flex items-center gap-1.5 text-left text-slate-700 font-medium transition cursor-pointer"
              >
                <Stethoscope className="w-4 h-4 text-teal-600" />
                <span>Dr. Sharma (MD)</span>
              </button>

              <button
                type="button"
                onClick={() => setRoleCredentials("nutritionist@wellness.com", "password123")}
                className="p-2 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 flex items-center gap-1.5 text-left text-slate-700 font-medium transition cursor-pointer"
              >
                <Apple className="w-4 h-4 text-amber-600" />
                <span>Nutritionist</span>
              </button>

              <button
                type="button"
                onClick={() => setRoleCredentials("billing@wellness.com", "password123")}
                className="p-2 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 flex items-center gap-1.5 text-left text-slate-700 font-medium transition cursor-pointer"
              >
                <Receipt className="w-4 h-4 text-indigo-600" />
                <span>Billing Staff</span>
              </button>

              <button
                type="button"
                onClick={() => setRoleCredentials("inventory@wellness.com", "password123")}
                className="p-2 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 flex items-center gap-1.5 text-left text-slate-700 font-medium transition cursor-pointer"
              >
                <Boxes className="w-4 h-4 text-purple-600" />
                <span>Inventory</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
