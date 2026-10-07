import React, { useEffect, useState } from "react";
import Header from "../components/Header.jsx";
import api from "../services/api.js";
import { Package as PackageIcon, Crown, Check, Sparkles } from "lucide-react";

export default function Packages() {
  const [packages, setPackages] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [pRes, mRes] = await Promise.all([
          api.get("/packages"),
          api.get("/memberships")
        ]);
        if (pRes.data.success) setPackages(pRes.data.data);
        if (mRes.data.success) setMemberships(mRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Wellness Packages & Membership Tiers"
        subtitle="Manage multi-session bundled packages and Silver, Gold, Platinum annual membership benefits"
      />

      <div className="p-8 space-y-8 flex-1">
        {/* Packages Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <PackageIcon className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">Multi-Session Bundled Packages</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div key={pkg.id} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800">
                      {pkg.duration_days} DAYS VALIDITY
                    </span>
                    <span className="text-lg font-bold text-slate-900">₹{parseFloat(pkg.price).toLocaleString()}</span>
                  </div>
                  <h3 className="font-bold text-base text-slate-900">{pkg.name}</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">{pkg.description}</p>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-700">
                  <span>Includes 16 Sessions</span>
                  <span>Active Offer</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Membership Tiers Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900">Aura Life Annual Membership Tiers</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {memberships.map((mem) => (
              <div
                key={mem.id}
                className={`p-6 rounded-2xl border flex flex-col justify-between space-y-5 transition ${
                  mem.tier === "PLATINUM"
                    ? "bg-gradient-to-b from-slate-900 to-slate-800 text-white border-slate-700 shadow-lg"
                    : mem.tier === "GOLD"
                    ? "bg-gradient-to-b from-amber-50/50 to-white border-amber-200 shadow-xs"
                    : "bg-white border-slate-200 shadow-xs"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      mem.tier === "PLATINUM" ? "bg-amber-400 text-slate-900" :
                      mem.tier === "GOLD" ? "bg-amber-100 text-amber-800" :
                      "bg-slate-100 text-slate-700"
                    }`}>
                      {mem.tier} TIER
                    </span>
                    <span className="text-xs font-semibold opacity-75">{mem.duration_months} Months</span>
                  </div>

                  <h3 className={`font-bold text-lg ${mem.tier === "PLATINUM" ? "text-white" : "text-slate-900"}`}>
                    {mem.name}
                  </h3>

                  <div className="mt-3">
                    <span className={`text-2xl font-extrabold ${mem.tier === "PLATINUM" ? "text-white" : "text-slate-900"}`}>
                      ₹{parseFloat(mem.price).toLocaleString()}
                    </span>
                    <span className="text-xs opacity-75 ml-1">/ annual</span>
                  </div>

                  <p className={`text-xs mt-3 leading-relaxed ${mem.tier === "PLATINUM" ? "text-slate-300" : "text-slate-600"}`}>
                    {mem.benefits_description}
                  </p>
                </div>

                <div className={`pt-4 border-t ${mem.tier === "PLATINUM" ? "border-slate-700" : "border-slate-100"} flex items-center justify-between text-xs font-bold`}>
                  <span className={mem.tier === "PLATINUM" ? "text-amber-300" : "text-emerald-700"}>
                    {mem.discount_percent}% Flat Discount Benefit
                  </span>
                  <span className="opacity-75">All Centres</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
