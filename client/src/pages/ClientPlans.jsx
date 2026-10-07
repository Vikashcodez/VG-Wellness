import React, { useEffect, useState } from "react";
import api from "../services/api.js";
import { Sparkles, Calendar, CheckCircle2, Clock } from "lucide-react";

export default function ClientPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/clients/me/profile");
        if (res.data.success) {
          setPlans(res.data.data.plans || []);
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
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Your Prescribed Wellness Plans</h1>
        <p className="text-xs text-slate-500 mt-1">
          Structured 12-week protocols combining consultations, yoga therapy, and daily habit routines
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500 text-xs">
          Loading assigned plans...
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 text-sm">
          <Sparkles className="w-12 h-12 mx-auto mb-2 text-slate-300" />
          No wellness plans currently enrolled. Speak with your doctor during your next visit.
        </div>
      ) : (
        <div className="space-y-6">
          {plans.map((p) => (
            <div key={p.id} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                    {p.status} PROTOCOL
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 mt-2">{p.plan_name}</h2>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p className="font-semibold text-slate-800">{p.start_date} to {p.end_date}</p>
                  <p className="text-teal-700 font-medium">Dr. {p.practitioner_first_name} {p.practitioner_last_name}</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{p.plan_description}</p>

              {/* Standard Included components */}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Nutrition</span>
                  <p className="font-semibold text-slate-800 mt-0.5">4 Personal Consultations</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Yoga & Breathwork</span>
                  <p className="font-semibold text-slate-800 mt-0.5">12 Private Studio Sessions</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Restorative Bodywork</span>
                  <p className="font-semibold text-slate-800 mt-0.5">6 Myofascial Therapies</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
