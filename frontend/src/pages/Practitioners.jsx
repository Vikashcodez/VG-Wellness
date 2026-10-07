import React, { useEffect, useState } from "react";
import Header from "../components/Header.jsx";
import api from "../services/api.js";

export default function Practitioners() {
  const [practitioners, setPractitioners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/practitioners");
        if (res.data.success) {
          setPractitioners(res.data.data);
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
    <div className="flex-1 flex flex-col min-h-screen bg-[#f4f6f8]">
      <Header
        title="Practitioners & Specialists"
        subtitle="Doctors, nutritionists, yoga therapists, and clinical wellness specialists"
      />

      <div className="p-3.5 sm:p-5 space-y-3.5 flex-1 max-w-full">
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading practitioners...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {practitioners.map((p) => (
              <div
                key={p.id}
                className="crm-card p-3.5 space-y-3 hover:border-slate-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-8 h-8 rounded bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs flex-shrink-0">
                      {p.first_name[0]}{p.last_name[0]}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                        Dr. {p.first_name} {p.last_name}
                      </h3>
                      <p className="text-[11px] text-blue-700 font-medium truncate">
                        {p.qualification}
                      </p>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {p.bio}
                  </p>

                  {/* Specializations badges */}
                  <div className="mt-2.5">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Clinical Focus
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {p.specializations?.map((spec, i) => (
                        <span key={i} className="crm-badge-neutral text-[10px]">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span>Contact: {p.mobile}</span>
                    <span className="font-mono text-[10px] text-slate-400">Lic: {p.license_number}</span>
                  </div>
                  <div className="truncate text-slate-400">
                    {p.email}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
