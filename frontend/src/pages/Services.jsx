import React, { useEffect, useState } from "react";
import Header from "../components/Header.jsx";
import api from "../services/api.js";
import { Sparkles, Clock, IndianRupee, Tag } from "lucide-react";

export default function Services() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [sRes, cRes] = await Promise.all([
          api.get("/services"),
          api.get("/services/categories")
        ]);
        if (sRes.data.success) setServices(sRes.data.data);
        if (cRes.data.success) setCategories(cRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = selectedCat
    ? services.filter(s => s.category_id === parseInt(selectedCat))
    : services;

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Wellness Clinical Services Master"
        subtitle="Consultations, Mind-Body sessions, Bodywork therapies, and diagnostic assessments"
      />

      <div className="p-8 space-y-6 flex-1">
        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCat("")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedCat === "" ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            All Services ({services.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCat(c.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedCat === c.id ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        {loading ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2" />
            Loading clinical services catalog...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((s) => (
              <div key={s.id} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {s.category_name}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {s.duration_minutes} mins
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-slate-900">{s.name}</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">{s.description}</p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Standard Fee</span>
                    <span className="text-lg font-extrabold text-slate-900">₹{parseFloat(s.price).toLocaleString()}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">+{s.tax_rate}% GST</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
