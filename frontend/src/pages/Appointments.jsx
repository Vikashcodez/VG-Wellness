import React, { useEffect, useState } from "react";
import Header from "../components/Header.jsx";
import Modal from "../components/Modal.jsx";
import { appointmentService } from "../services/appointmentService.js";
import { clientService } from "../services/clientService.js";
import api from "../services/api.js";
import { Plus } from "lucide-react";

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

  const statusBadges = {
    COMPLETED: "crm-badge-success",
    CONFIRMED: "crm-badge-info",
    CHECKED_IN: "crm-badge-warning",
    IN_PROGRESS: "bg-purple-50 text-purple-700 border border-purple-200 inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold",
    CANCELLED: "crm-badge-danger",
    BOOKED: "crm-badge-neutral"
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#f4f6f8]">
      <Header
        title="Appointments Schedule"
        subtitle="Slot booking, doctor allocation, and patient check-in management"
        actions={
          <button
            onClick={() => setIsBookModalOpen(true)}
            className="crm-btn-primary"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Slot</span>
          </button>
        }
      />

      <div className="p-3.5 sm:p-5 space-y-3 flex-1 max-w-full">
        {/* LeadSquared Status Filter Ribbon */}
        <div className="crm-card p-2 sm:p-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Filter:
            </span>
            {["", "BOOKED", "CONFIRMED", "CHECKED_IN", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                  statusFilter === st
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                }`}
              >
                {st === "" ? "ALL" : st.replace("_", " ")}
              </button>
            ))}
          </div>
          <div className="text-[11px] font-medium text-slate-500">
            Total <span className="font-bold text-slate-900">{appointments.length}</span> slots
          </div>
        </div>

        {/* High Density Appointments Table */}
        <div className="crm-card overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading appointments schedule...
            </div>
          ) : appointments.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No appointments found for the selected filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Slot & ID</th>
                    <th>Patient Name</th>
                    <th>Service & Price</th>
                    <th>Practitioner</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <div>
                          <span className="font-mono font-bold text-slate-900">
                            {a.appointment_number}
                          </span>
                          <div className="text-[11px] text-slate-500">
                            {a.appointment_date} • {a.start_time?.slice(0, 5)} - {a.end_time?.slice(0, 5)}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="font-bold text-slate-900">
                          {a.client_first_name} {a.client_last_name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {a.client_mobile}
                        </div>
                      </td>
                      <td>
                        <div className="font-semibold text-slate-800">
                          {a.service_name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {a.duration_minutes}m • ₹{a.service_price}
                        </div>
                      </td>
                      <td>
                        <div className="text-xs font-medium text-slate-800">
                          Dr. {a.practitioner_first_name} {a.practitioner_last_name}
                        </div>
                      </td>
                      <td>
                        <span className={statusBadges[a.status] || "crm-badge-neutral"}>
                          {a.status?.replace("_", " ")}
                        </span>
                      </td>
                      <td className="text-right space-x-1">
                        {a.status === "BOOKED" && (
                          <button
                            onClick={() => handleUpdateStatus(a.id, "CONFIRMED")}
                            className="crm-btn-primary h-7 px-2 text-[11px]"
                          >
                            Confirm
                          </button>
                        )}
                        {(a.status === "BOOKED" || a.status === "CONFIRMED") && (
                          <button
                            onClick={() => handleUpdateStatus(a.id, "CHECKED_IN")}
                            className="crm-btn-secondary h-7 px-2 text-[11px] text-amber-700 border-amber-300 hover:bg-amber-50"
                          >
                            Check-In
                          </button>
                        )}
                        {a.status === "CHECKED_IN" && (
                          <button
                            onClick={() => handleUpdateStatus(a.id, "IN_PROGRESS")}
                            className="crm-btn-secondary h-7 px-2 text-[11px] text-purple-700 border-purple-300 hover:bg-purple-50"
                          >
                            Start Session
                          </button>
                        )}
                        {a.status === "IN_PROGRESS" && (
                          <button
                            onClick={() => handleUpdateStatus(a.id, "COMPLETED")}
                            className="crm-btn-secondary h-7 px-2 text-[11px] text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                          >
                            Complete
                          </button>
                        )}
                        {a.status !== "COMPLETED" && a.status !== "CANCELLED" && (
                          <button
                            onClick={() => handleUpdateStatus(a.id, "CANCELLED")}
                            className="crm-btn-secondary h-7 px-2 text-[11px] text-rose-600 border-slate-200 hover:bg-rose-50"
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
          <div className="mb-3 p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {bookError}
          </div>
        )}
        <form onSubmit={handleBook} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Client *</label>
            <select
              required
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="crm-input w-full"
            >
              <option value="">-- Choose Client / Patient --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name} ({c.client_code}) - {c.mobile}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Service *</label>
              <select
                required
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="crm-input w-full"
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
                className="crm-input w-full"
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

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date *</label>
              <input
                type="date"
                required
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="crm-input w-full"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Start Time *</label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="crm-input w-full"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Appointment Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-white border border-slate-300 rounded text-xs text-slate-800 px-3 py-1.5 w-full focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Primary symptoms, request, special clinical notes..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsBookModalOpen(false)}
              className="crm-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={booking}
              className="crm-btn-primary"
            >
              {booking ? "Checking Conflict & Booking..." : "Confirm Booking"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
