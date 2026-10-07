import React, { useEffect, useState } from "react";
import api from "../services/api.js";
import { useClientAuth } from "../context/ClientAuthContext.jsx";
import { Calendar, Plus, Clock, CheckCircle2, AlertCircle, ArrowRight, UserCheck } from "lucide-react";

export default function ClientAppointments() {
  const { user } = useClientAuth();
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [practitioners, setPractitioners] = useState([]);
  const [loading, setLoading] = useState(true);

  // Booking Flow States (5-Step wizard)
  const [isBookingMode, setIsBookingMode] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedPractitionerId, setSelectedPractitionerId] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedTime, setSelectedTime] = useState("10:00");
  const [notes, setNotes] = useState("");
  const [availabilityCheck, setAvailabilityCheck] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [bookError, setBookError] = useState("");

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const [aRes, sRes, pRes] = await Promise.all([
        api.get("/appointments"),
        api.get("/services"),
        api.get("/practitioners")
      ]);
      if (aRes.data.success) setAppointments(aRes.data.data);
      if (sRes.data.success) setServices(sRes.data.data);
      if (pRes.data.success) setPractitioners(pRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  // Check availability when practitioner, date, or time changes
  useEffect(() => {
    async function checkSlot() {
      if (selectedPractitionerId && selectedDate && selectedTime) {
        try {
          const res = await api.get("/appointments/availability", {
            params: {
              practitionerId: selectedPractitionerId,
              appointmentDate: selectedDate,
              startTime: selectedTime,
              serviceId: selectedServiceId
            }
          });
          setAvailabilityCheck(res.data);
        } catch (err) {
          console.error(err);
        }
      }
    }
    checkSlot();
  }, [selectedPractitionerId, selectedDate, selectedTime, selectedServiceId]);

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    if (!selectedServiceId || !selectedPractitionerId || !selectedDate || !selectedTime) return;
    setSubmitting(true);
    setBookError("");
    try {
      const res = await api.post("/appointments", {
        serviceId: parseInt(selectedServiceId),
        practitionerId: parseInt(selectedPractitionerId),
        appointmentDate: selectedDate,
        startTime: selectedTime,
        bookingSource: "CLIENT_PORTAL",
        notes
      });
      if (res.data.success) {
        setIsBookingMode(false);
        setNotes("");
        loadAppointments();
      }
    } catch (err) {
      setBookError(err.response?.data?.message || err.message || "Failed to book appointment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (apptId) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      await api.patch(`/appointments/${apptId}/status`, { status: "CANCELLED", notes: "Cancelled by client" });
      loadAppointments();
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to cancel");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Your Consultations & Sessions</h1>
          <p className="text-xs text-slate-500 mt-1">
            Book appointments, check practitioner availability, or reschedule your upcoming visits
          </p>
        </div>

        {!isBookingMode && (
          <button
            onClick={() => setIsBookingMode(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition self-start cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Book New Appointment</span>
          </button>
        )}
      </div>

      {/* Booking Form (Step 1 to 5) */}
      {isBookingMode && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-emerald-200 shadow-md space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Book a Wellness Session</h2>
              <p className="text-xs text-slate-500">Conflict-free slot booking engine</p>
            </div>
            <button
              onClick={() => setIsBookingMode(false)}
              className="text-xs text-slate-400 hover:text-slate-700 font-semibold cursor-pointer"
            >
              Cancel
            </button>
          </div>

          {bookError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {bookError}
            </div>
          )}

          <form onSubmit={handleBookSubmit} className="space-y-4 text-xs">
            {/* Step 1: Service */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">1. Select Clinical Service *</label>
              <select
                required
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs"
              >
                <option value="">-- Choose Service --</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.duration_minutes} mins) - ₹{s.price}
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Practitioner */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">2. Select Practitioner / Specialist *</label>
              <select
                required
                value={selectedPractitionerId}
                onChange={(e) => setSelectedPractitionerId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs"
              >
                <option value="">-- Choose Specialist --</option>
                {practitioners.map(p => (
                  <option key={p.id} value={p.id}>
                    Dr. {p.first_name} {p.last_name} ({p.qualification})
                  </option>
                ))}
              </select>
            </div>

            {/* Step 3: Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">3. Select Date *</label>
                <input
                  type="date"
                  required
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">4. Select Time *</label>
                <input
                  type="time"
                  required
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            {/* Availability Status Check Badge */}
            {availabilityCheck && (
              <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                availabilityCheck.available
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}>
                {availabilityCheck.available ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold">Slot Available! No conflicting practitioner bookings.</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span className="font-bold">Practitioner already booked for this slot. Please choose another time.</span>
                  </>
                )}
              </div>
            )}

            {/* Step 5: Notes */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">5. Consultation Notes / Reason for Visit</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300"
                placeholder="Mention any symptoms, follow-up questions or special requests..."
              />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsBookingMode(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || (availabilityCheck && !availabilityCheck.available)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Confirming..." : "Confirm & Book Session"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Appointments List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Your Appointment History</h2>
          <span className="text-xs text-slate-400">{appointments.length} total appointments</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            Loading appointments...
          </div>
        ) : appointments.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            You don't have any appointments booked yet. Click <strong>Book New Appointment</strong> above.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {appointments.map((a) => (
              <div key={a.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex flex-col items-center justify-center text-xs font-bold flex-shrink-0">
                    <span>{a.appointment_date?.slice(5, 7)}/{a.appointment_date?.slice(8, 10)}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">{a.service_name}</h3>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        a.status === "COMPLETED" ? "bg-emerald-100 text-emerald-800" :
                        a.status === "CONFIRMED" ? "bg-blue-100 text-blue-800" :
                        a.status === "CHECKED_IN" ? "bg-amber-100 text-amber-800" :
                        a.status === "CANCELLED" ? "bg-rose-100 text-rose-800" :
                        "bg-slate-100 text-slate-700"
                      }`}>
                        {a.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Dr. {a.practitioner_first_name} {a.practitioner_last_name} • Slot: {a.start_time?.slice(0, 5)} - {a.end_time?.slice(0, 5)}
                    </p>
                    {a.notes && <p className="text-[11px] text-slate-400 mt-1 italic">"{a.notes}"</p>}
                  </div>
                </div>

                {/* Cancel action if not completed */}
                {a.status !== "COMPLETED" && a.status !== "CANCELLED" && (
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      onClick={() => handleCancel(a.id)}
                      className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition cursor-pointer"
                    >
                      Cancel Appointment
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
