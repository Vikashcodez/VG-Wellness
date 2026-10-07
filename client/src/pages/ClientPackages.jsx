import React, { useEffect, useState } from "react";
import api from "../services/api.js";
import { Package, Crown, CheckCircle2 } from "lucide-react";

export default function ClientPackages() {
  const [packages, setPackages] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [availablePackages, setAvailablePackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [profRes, pkgRes] = await Promise.all([
          api.get("/clients/me/profile"),
          api.get("/packages")
        ]);
        if (profRes.data.success) {
          setPackages(profRes.data.data.packages || []);
          setMemberships(profRes.data.data.memberships || []);
        }
        if (pkgRes.data.success) {
          setAvailablePackages(pkgRes.data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Your Packages & Membership Tiers</h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor your active sessions balance and access premium member wellness benefits
        </p>
      </div>

      {/* Active Enrollments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Package */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Session Package</span>
            <Package className="w-5 h-5 text-emerald-600" />
          </div>

          {packages[0] ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{packages[0].package_name}</h3>
                <p className="text-xs text-slate-500 mt-1">{packages[0].package_description}</p>
              </div>

              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-900 block">Remaining Sessions</span>
                  <span className="text-2xl font-extrabold text-emerald-800">
                    {packages[0].total_sessions - packages[0].used_sessions}
                  </span>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p>Total: {packages[0].total_sessions} sessions</p>
                  <p>Used: {packages[0].used_sessions} sessions</p>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">Valid until {packages[0].expiry_date}</p>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6">You do not have an active session package.</p>
          )}
        </div>

        {/* Active Membership */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Annual Membership</span>
            <Crown className="w-5 h-5 text-amber-500" />
          </div>

          {memberships[0] ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{memberships[0].plan_name}</h3>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">
                    {memberships[0].tier} TIER
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-extrabold text-amber-600">
                    {memberships[0].discount_percent}% OFF
                  </span>
                  <span className="block text-[10px] text-slate-400">Every visit</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{memberships[0].benefits_description}</p>
              <p className="text-[11px] text-slate-400">Valid through {memberships[0].end_date}</p>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6">No active annual membership tier.</p>
          )}
        </div>
      </div>
    </div>
  );
}
