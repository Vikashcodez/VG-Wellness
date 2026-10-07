import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useClientAuth } from "../context/ClientAuthContext.jsx";
import { Sparkles, ArrowRight, ShieldCheck, Heart } from "lucide-react";

export default function ClientLogin() {
  const [email, setEmail] = useState("rahul@example.com");
  const [password, setPassword] = useState("client123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useClientAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Invalid login credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-3xl font-extrabold text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-900/50">
          🌿
        </div>
        <h2 className="mt-4 text-3xl font-extrabold text-white tracking-tight">
          Aura Life Wellness
        </h2>
        <p className="mt-1 text-sm text-emerald-400 font-medium">
          Client Portal • Your Personal Health Journey
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/95 backdrop-blur-md py-8 px-6 shadow-2xl rounded-2xl border border-slate-100 sm:px-10">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Your Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Signing in..." : "Enter Client Dashboard"}
              </button>
            </div>
          </form>

          {/* Demo credential notice */}
          <div className="mt-6 p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-900 flex items-center justify-between">
            <div>
              <p className="font-bold">Demo Client Account:</p>
              <p className="font-mono text-[11px] text-emerald-700">rahul@example.com / client123</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEmail("rahul@example.com");
                setPassword("client123");
              }}
              className="text-xs text-emerald-700 font-bold underline cursor-pointer"
            >
              Autofill
            </button>
          </div>

          <div className="mt-6 text-center text-xs text-slate-600">
            Don't have an account yet?{" "}
            <Link to="/register" className="font-bold text-emerald-600 hover:underline">
              Register New Client
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
