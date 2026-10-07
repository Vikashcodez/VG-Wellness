import React, { useEffect, useState } from "react";
import Header from "../components/Header.jsx";
import Modal from "../components/Modal.jsx";
import { appointmentService } from "../services/appointmentService.js";
import { clientService } from "../services/clientService.js";
import api from "../services/api.js";
import { Calendar as CalendarIcon, Plus, CheckCircle, Clock, XCircle, AlertCircle, Search, UserCheck } from "lucide-react";

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  // Form states
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [practitioners, setPractitioners] = useState([]);
  const [clientId, setClientId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [practitionerId, setPractitionerId] = useState("");
  const [appointmentDate, setAppointmentDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("10:00");
  const [notes, setNotes] = useState("");
  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState("");

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await appointmentService.getAll({ status: statusFilter });
      if (res.success) {
        setAppointments(res.data);
      }
    } catch (err) {
      console.error("Appointments fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter]);

  // Load clients, services, and practitioners for modal
  useEffect(() => {
    async function loadMeta() {
      try {
        const cRes = await clientService.getAll({ limit: 100 });
        if (cRes.success) setClients(cRes.data);

        const sRes = await api.get("/services");
        if (sRes.data.success) setServices(sRes.data.data);

        const pRes = await api.get("/practitioners");
        if (pRes.data.success) setPractitioners(pRes.data.data);
      } catch (err) {
        console.error("Meta loading error:", err);
      }
    }
    loadMeta();
  }, []);

  const handleBook = async (e) => {
    e.preventDefault();
    setBooking(true);
    setBookError("");
    try {
      const res = await appointmentService.create({
        clientId: parseInt(clientId),
        serviceId: parseInt(serviceId),
        practitionerId: parseInt(practitionerId),
        appointmentDate,
        startTime,
        bookingSource: "RECEPTION",
        notes
      });
      if (res.success) {
        setIsBookModalOpen(false);
        setNotes("");
        fetchAppointments();
      }
    } catch (err) {
      setBookError(err.response?.data?.message || err.message || "Failed to book appointment");
    } finally {
      setBooking(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await appointmentService.updateStatus(id, newStatus);
      fetchAppointments();
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to update appointment");
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Appointment Master & Schedule"
        subtitle="Manage slots, check-ins, double-booking prevention, and patient appointments"
        actions={
          <button
            onClick={() => setIsBookModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Appointment</span>
          </button>
        }
      />

      <div className="p-8 space-y-6 flex-1">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Status:</span>
            {["", "BOOKED", "CONFIRMED", "CHECKED_IN", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  statusFilter === st
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {st === "" ? "ALL" : st}
              </button>
            ))}
          </div>
          <div className="text-xs text-slate-500">
            Total <span className="font-bold text-slate-900">{appointments.length}</span> appointments
          </div>
        </div>

        {/* Appointment List Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2" />
              Loading schedule...
            </div>
          ) : appointments.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              <CalendarIcon className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              No appointments found for the selected filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 font-bold uppercase text-slate-500">
                    <th className="py-3 px-6">Appt ID & Date</th>
                    <th className="py-3 px-6">Client</th>
                    <th className="py-3 px-6">Service</th>
                    <th className="py-3 px-6">Practitioner</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6 text-right">Quick Status Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appointments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-4 px-6">
                        <span className="font-mono font-bold text-slate-900">{a.appointment_number}</span>
                        <p className="text-slate-500 mt-0.5">{a.appointment_date} @ {a.start_time?.slice(0, 5)} - {a.end_time?.slice(0, 5)}</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-bold text-slate-900">{a.client_first_name} {a.client_last_name}</p>
                        <p className="text-slate-400">{a.client_mobile}</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-semibold text-slate-800">{a.service_name}</p>
                        <p className="text-slate-500">{a.duration_minutes} mins • ₹{a.service_price}</p>
                      </td>
                      <td className="py-4 px-6 text-slate-700 font-medium">
                        Dr. {a.practitioner_first_name} {a.practitioner_last_name}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          a.status === "COMPLETED" ? "bg-emerald-100 text-emerald-800" :
                          a.status === "CONFIRMED" ? "bg-blue-100 text-blue-800" :
                          a.status === "CHECKED_IN" ? "bg-amber-100 text-amber-800" :
                          a.status === "IN_PROGRESS" ? "bg-purple-100 text-purple-800" :
                          a.status === "CANCELLED" ? "bg-rose-100 text-rose-800" :
                          "bg-slate-200 text-slate-800"
                        }`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-1.5">
                        {a.status === "BOOKED" && (
                          <button
                            onClick={() => handleUpdateStatus(a.id, "CONFIRMED")}
                            className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold cursor-pointer"
                          >
                            Confirm
                          </button>
                        )}
                        {(a.status === "BOOKED" || a.status === "CONFIRMED") && (
                          <button
                            onClick={() => handleUpdateStatus(a.id, "CHECKED_IN")}
                            className="px-2.5 py-1 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 font-semibold cursor-pointer"
                          >
                            Check-In
                          </button>
                        )}
                        {a.status === "CHECKED_IN" && (
                          <button
                            onClick={() => handleUpdateStatus(a.id, "IN_PROGRESS")}
                            className="px-2.5 py-1 rounded bg-purple-50 text-purple-700 hover:bg-purple-100 font-semibold cursor-pointer"
                          >
                            Start
                          </button>
                        )}
                        {a.status === "IN_PROGRESS" && (
                          <button
                            onClick={() => handleUpdateStatus(a.id, "COMPLETED")}
                            className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold cursor-pointer"
                          >
                            Complete
                          </button>
                        )}
                        {a.status !== "COMPLETED" && a.status !== "CANCELLED" && (
                          <button
                            onClick={() => handleUpdateStatus(a.id, "CANCELLED")}
                            className="px-2 py-1 rounded text-rose-600 hover:bg-rose-50 cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Book Appointment Modal */}
      <Modal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        title="Schedule Centre Appointment"
      >
        {bookError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {bookError}
          </div>
        )}
        <form onSubmit={handleBook} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Client *</label>
            <select
              required
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            >
              <option value="">-- Choose Patient / Client --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name} ({c.client_code}) - {c.mobile}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Service *</label>
              <select
                required
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              >
                <option value="">-- Choose Service --</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.duration_minutes}m) - ₹{s.price}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Practitioner *</label>
              <select
                required
                value={practitionerId}
                onChange={(e) => setPractitionerId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              >
                <option value="">-- Choose Doctor / Therapist --</option>
                {practitioners.map((p) => (
                  <option key={p.id} value={p.id}>
                    Dr. {p.first_name} {p.last_name} ({p.qualification || "Physician"})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Appointment Date *</label>
              <input
                type="date"
                required
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Start Time (HH:MM) *</label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Appointment Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
              placeholder="Primary symptoms, request, special notes..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsBookModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={booking}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {booking ? "Checking Conflict & Booking..." : "Confirm Booking"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
