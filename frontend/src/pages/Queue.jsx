import React, { useEffect, useState } from "react";
import Header from "../components/Header.jsx";
import { appointmentService } from "../services/appointmentService.js";
import { UserCheck, Clock, CheckCircle2, PlayCircle, AlertCircle, RefreshCw } from "lucide-react";

export default function Queue() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await appointmentService.getQueue();
      if (res.success) {
        setQueue(res.data);
      }
    } catch (err) {
      console.error("Queue load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdate = async (id, status) => {
    try {
      await appointmentService.updateStatus(id, status);
      fetchQueue();
    } catch (err) {
      alert(err.message || "Failed to update status");
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Reception & Practitioner Live Queue"
        subtitle="Real-time client arrival check-in, waiting room queue, and active therapy session monitoring"
        actions={
          <button
            onClick={fetchQueue}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Queue</span>
          </button>
        }
      />

      <div className="p-8 space-y-6 flex-1">
        {/* Queue Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-400 uppercase font-semibold">Total Scheduled Today</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">{queue.length}</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-amber-200 bg-amber-50/20 shadow-xs">
            <span className="text-xs text-amber-700 uppercase font-semibold">In Waiting Lounge</span>
            <p className="text-2xl font-bold text-amber-800 mt-1">
              {queue.filter(q => q.status === "CHECKED_IN").length}
            </p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-purple-200 bg-purple-50/20 shadow-xs">
            <span className="text-xs text-purple-700 uppercase font-semibold">In Therapy Session</span>
            <p className="text-2xl font-bold text-purple-800 mt-1">
              {queue.filter(q => q.status === "IN_PROGRESS").length}
            </p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-blue-200 bg-blue-50/20 shadow-xs">
            <span className="text-xs text-blue-700 uppercase font-semibold">Confirmed / Expected</span>
            <p className="text-2xl font-bold text-blue-800 mt-1">
              {queue.filter(q => q.status === "CONFIRMED" || q.status === "BOOKED").length}
            </p>
          </div>
        </div>

        {/* Live Queue Cards */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Today's Appointment Queue Order</h3>

          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Refreshing live queue...
            </div>
          ) : queue.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No clients currently in queue for today.
            </div>
          ) : (
            <div className="space-y-3">
              {queue.map((item, idx) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition ${
                    item.status === "IN_PROGRESS"
                      ? "border-purple-200 bg-purple-50/40"
                      : item.status === "CHECKED_IN"
                      ? "border-amber-200 bg-amber-50/40"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 font-bold text-slate-700 flex items-center justify-center text-sm">
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-900 text-sm">
                          {item.client_first_name} {item.client_last_name}
                        </p>
                        <span className="font-mono text-xs text-slate-400">({item.client_code})</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.status === "IN_PROGRESS" ? "bg-purple-100 text-purple-800" :
                          item.status === "CHECKED_IN" ? "bg-amber-100 text-amber-800" :
                          "bg-blue-100 text-blue-800"
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {item.service_name} • Dr. {item.practitioner_first_name} {item.practitioner_last_name} • Slot: {item.start_time?.slice(0, 5)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {(item.status === "BOOKED" || item.status === "CONFIRMED") && (
                      <button
                        onClick={() => handleUpdate(item.id, "CHECKED_IN")}
                        className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>Client Arrived (Check-In)</span>
                      </button>
                    )}

                    {item.status === "CHECKED_IN" && (
                      <button
                        onClick={() => handleUpdate(item.id, "IN_PROGRESS")}
                        className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <PlayCircle className="w-4 h-4" />
                        <span>Start Practitioner Session</span>
                      </button>
                    )}

                    {item.status === "IN_PROGRESS" && (
                      <button
                        onClick={() => handleUpdate(item.id, "COMPLETED")}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Complete Session</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
