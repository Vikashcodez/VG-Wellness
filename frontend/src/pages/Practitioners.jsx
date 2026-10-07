import React, { useEffect, useState } from "react";
import Header from "../components/Header.jsx";
import api from "../services/api.js";
import { Stethoscope, Award, Mail, Phone, Calendar, Clock } from "lucide-react";

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
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Practitioners & Clinical Specialists"
        subtitle="Physicians, nutritionists, yoga therapists, and holistic health specialists"
      />

      <div className="p-8 space-y-6 flex-1">
        {loading ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2" />
            Loading practitioners...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {practitioners.map((p) => (
              <div key={p.id} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 hover:shadow-md transition">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 font-extrabold flex items-center justify-center text-xl">
                    {p.first_name[0]}{p.last_name[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">{p.first_name} {p.last_name}</h3>
                    <p className="text-xs text-emerald-700 font-semibold">{p.qualification}</p>
                    <span className="inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                      Lic: {p.license_number}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{p.bio}</p>

                {/* Specializations badges */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Clinical Specializations
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {p.specializations?.map((spec, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{p.mobile}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{p.email}</span>
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
