import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header.jsx";
import Modal from "../components/Modal.jsx";
import { clientService } from "../services/clientService.js";
import { Search, Plus, UserPlus, Phone, Mail, ChevronRight, Target, Calendar } from "lucide-react";

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    mobile: "",
    email: "",
    gender: "Male",
    dateOfBirth: "",
    addressLine1: "",
    city: "Bengaluru",
    emergencyContactName: "",
    emergencyContactMobile: "",
    medicalNotes: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadClients = async () => {
    setLoading(true);
    try {
      const res = await clientService.getAll({ search });
      if (res.success) {
        setClients(res.data);
        setTotal(res.total);
      }
    } catch (err) {
      console.error("Error loading clients:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      loadClients();
    }, 300);
    return () => clearTimeout(delay);
  }, [search]);

  const handleCreateClient = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await clientService.create(formData);
      if (res.success) {
        setIsModalOpen(false);
        setFormData({
          firstName: "",
          lastName: "",
          mobile: "",
          email: "",
          gender: "Male",
          dateOfBirth: "",
          addressLine1: "",
          city: "Bengaluru",
          emergencyContactName: "",
          emergencyContactMobile: "",
          medicalNotes: ""
        });
        loadClients();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to create client");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Client Management Directory"
        subtitle={`Managing ${total} registered wellness clients and their historical journeys`}
        actions={
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Client</span>
          </button>
        }
      />

      <div className="p-8 space-y-6 flex-1">
        {/* Search bar & filter controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by client name, code, phone, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div className="text-xs font-medium text-slate-500">
            Showing <span className="font-bold text-slate-900">{clients.length}</span> of {total} clients
          </div>
        </div>

        {/* Client Table / Grid */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2" />
              Loading client records...
            </div>
          ) : clients.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <UserPlus className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-700">No clients found</p>
              <p className="text-xs text-slate-400 mt-1">Try another search or register a new client.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-6">Client Info</th>
                    <th className="py-3.5 px-6">Contact</th>
                    <th className="py-3.5 px-6">Demographics</th>
                    <th className="py-3.5 px-6">Wellness Goals</th>
                    <th className="py-3.5 px-6">Total Visits</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {clients.map((client) => (
                    <tr key={client.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm">
                            {client.first_name[0]}{client.last_name[0]}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{client.first_name} {client.last_name}</p>
                            <span className="inline-block font-mono text-[11px] text-emerald-700 font-medium">
                              {client.client_code}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-600 text-xs space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{client.mobile}</span>
                        </div>
                        {client.email && (
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate max-w-[160px]">{client.email}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-600">
                        <p>{client.gender || "Unspecified"} • {client.age ? `${client.age} yrs` : "N/A"}</p>
                        <p className="text-slate-400 text-[11px]">{client.branch_name}</p>
                      </td>
                      <td className="py-4 px-6 text-xs">
                        {parseInt(client.active_goals_count) > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Target className="w-3 h-3" />
                            {client.active_goals_count} Active
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">No active goals</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-600">
                        <span className="font-bold text-slate-900">{client.total_appointments}</span> sessions
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Link
                          to={`/clients/${client.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-xs font-semibold text-slate-700 hover:text-emerald-700 transition"
                        >
                          <span>Full Profile</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Client Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Wellness Client"
      >
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        )}
        <form onSubmit={handleCreateClient} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g. Rahul"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g. Sharma"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mobile Number *</label>
              <input
                type="text"
                required
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                placeholder="+91 98765 43210"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                placeholder="client@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date of Birth</label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Address</label>
              <input
                type="text"
                value={formData.addressLine1}
                onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                placeholder="Street Address"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Emergency Contact Name</label>
              <input
                type="text"
                value={formData.emergencyContactName}
                onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                placeholder="Spouse / Parent Name"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Emergency Mobile</label>
              <input
                type="text"
                value={formData.emergencyContactMobile}
                onChange={(e) => setFormData({ ...formData, emergencyContactMobile: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                placeholder="+91..."
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Medical / Wellness Notes</label>
            <textarea
              rows={2}
              value={formData.medicalNotes}
              onChange={(e) => setFormData({ ...formData, medicalNotes: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
              placeholder="Allergies, chronic conditions, personal goals..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Registering..." : "Complete Registration"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
