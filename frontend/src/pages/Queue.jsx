import React, { useEffect, useState } from "react";
import Header from "../components/Header.jsx";
import { appointmentService } from "../services/appointmentService.js";
import { RefreshCw } from "lucide-react";

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
    <div className="flex-1 flex flex-col min-h-screen bg-[#f4f6f8]">
      <Header
        title="Reception & Check-in Live Queue"
        subtitle="Real-time patient arrival tracking, waiting lounge queue, and practitioner session management"
        actions={
          <button
            onClick={fetchQueue}
            className="crm-btn-secondary"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        }
      />

      <div className="p-3.5 sm:p-5 space-y-3.5 flex-1 max-w-full">
        {/* High-density LeadSquared Metric Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <div className="crm-stat-tile border-l-[3px] border-l-slate-600">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Total Today
            </span>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">{queue.length}</p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Scheduled appointments</p>
          </div>

          <div className="crm-stat-tile border-l-[3px] border-l-amber-600">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
              In Waiting Lounge
            </span>
            <p className="text-xl sm:text-2xl font-bold text-amber-800 mt-0.5">
              {queue.filter(q => q.status === "CHECKED_IN").length}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Arrived & waiting</p>
          </div>

          <div className="crm-stat-tile border-l-[3px] border-l-purple-600">
            <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">
              In Therapy Session
            </span>
            <p className="text-xl sm:text-2xl font-bold text-purple-800 mt-0.5">
              {queue.filter(q => q.status === "IN_PROGRESS").length}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Active consultation</p>
          </div>

          <div className="crm-stat-tile border-l-[3px] border-l-blue-600">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
              Confirmed / Expected
            </span>
            <p className="text-xl sm:text-2xl font-bold text-blue-800 mt-0.5">
              {queue.filter(q => q.status === "CONFIRMED" || q.status === "BOOKED").length}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Yet to arrive</p>
          </div>
        </div>

        {/* Live Queue High Density Card List */}
        <div className="crm-card p-3 sm:p-4 space-y-3">
          <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900">Today's Appointment Queue Order</h2>
              <p className="text-[11px] text-slate-500">Live sequence of scheduled and checked-in patients</p>
            </div>
            <span className="crm-badge-neutral">{queue.length} in queue</span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Refreshing live queue...
            </div>
          ) : queue.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No clients currently in queue for today.
            </div>
          ) : (
            <div className="space-y-2">
              {queue.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded border border-slate-200 bg-white hover:bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded bg-slate-100 border border-slate-200 font-bold text-slate-700 flex items-center justify-center text-xs flex-shrink-0">
                      #{idx + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-xs">
                          {item.client_first_name} {item.client_last_name}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {item.client_code}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${
                            item.status === "IN_PROGRESS"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : item.status === "CHECKED_IN"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : item.status === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {item.service_name} • Dr. {item.practitioner_first_name} {item.practitioner_last_name} • Slot: {item.start_time?.slice(0, 5)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center flex-shrink-0">
                    {(item.status === "BOOKED" || item.status === "CONFIRMED") && (
                      <button
                        onClick={() => handleUpdate(item.id, "CHECKED_IN")}
                        className="crm-btn-primary h-7 px-2.5 text-[11px] bg-amber-600 hover:bg-amber-700"
                      >
                        Client Arrived (Check-In)
                      </button>
                    )}

                    {item.status === "CHECKED_IN" && (
                      <button
                        onClick={() => handleUpdate(item.id, "IN_PROGRESS")}
                        className="crm-btn-primary h-7 px-2.5 text-[11px] bg-purple-600 hover:bg-purple-700"
                      >
                        Start Session
                      </button>
                    )}

                    {item.status === "IN_PROGRESS" && (
                      <button
                        onClick={() => handleUpdate(item.id, "COMPLETED")}
                        className="crm-btn-primary h-7 px-2.5 text-[11px] bg-emerald-600 hover:bg-emerald-700"
                      >
                        Complete Session
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
