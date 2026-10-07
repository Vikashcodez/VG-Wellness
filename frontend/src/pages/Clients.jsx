import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header.jsx";
import Modal from "../components/Modal.jsx";
import { clientService } from "../services/clientService.js";
import { Search, Plus, UserPlus, ChevronRight } from "lucide-react";

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
    <div className="flex-1 flex flex-col min-h-screen bg-[#f4f6f8]">
      <Header
        title="Clients Directory"
        subtitle={`Managing ${total} registered client profiles`}
        actions={
          <button
            onClick={() => setIsModalOpen(true)}
            className="crm-btn-primary"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Client</span>
          </button>
        }
      />

      <div className="p-3.5 sm:p-5 space-y-3 flex-1 max-w-full">
        {/* Search & Filter Toolbar */}
        <div className="crm-card p-2 sm:p-2.5 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, phone, email, client ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="crm-input pl-8 w-full"
            />
          </div>
          <div className="text-[11px] font-medium text-slate-500 self-end sm:self-center">
            Showing <span className="font-bold text-slate-900">{clients.length}</span> of {total} records
          </div>
        </div>

        {/* High Density LeadSquared Client Table */}
        <div className="crm-card overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading client records...
            </div>
          ) : clients.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <UserPlus className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-slate-700">No client records found</p>
              <p className="text-slate-400 mt-0.5">Try another search or register a new client profile.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Client Profile</th>
                    <th>Contact Details</th>
                    <th>Demographics</th>
                    <th>Wellness Goals</th>
                    <th>Sessions</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs flex-shrink-0">
                            {client.first_name[0]}{client.last_name[0]}
                          </div>
                          <div className="min-w-0">
                            <Link
                              to={`/clients/${client.id}`}
                              className="font-bold text-slate-900 hover:text-blue-600 truncate block"
                            >
                              {client.first_name} {client.last_name}
                            </Link>
                            <span className="font-mono text-[10px] text-slate-500">
                              {client.client_code}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="space-y-0.5">
                          <div className="font-medium text-slate-800">{client.mobile}</div>
                          {client.email && (
                            <div className="text-[11px] text-slate-500 truncate max-w-[150px]">
                              {client.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="space-y-0.5">
                          <div>{client.gender || "—"} • {client.age ? `${client.age} yrs` : "—"}</div>
                          <div className="text-[10px] text-slate-400">{client.branch_name}</div>
                        </div>
                      </td>
                      <td>
                        {parseInt(client.active_goals_count) > 0 ? (
                          <span className="crm-badge-success">
                            {client.active_goals_count} Active
                          </span>
                        ) : (
                          <span className="crm-badge-neutral">
                            0 Goals
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="font-bold text-slate-900">{client.total_appointments}</span> visits
                      </td>
                      <td className="text-right">
                        <Link
                          to={`/clients/${client.id}`}
                          className="crm-btn-secondary text-[11px] h-7 px-2"
                        >
                          <span>Profile</span>
                          <ChevronRight className="w-3 h-3 ml-0.5" />
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
          <div className="mb-3 p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        )}
        <form onSubmit={handleCreateClient} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="crm-input w-full"
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
                className="crm-input w-full"
                placeholder="e.g. Sharma"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mobile Number *</label>
              <input
                type="text"
                required
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                className="crm-input w-full"
                placeholder="+91 98765 43210"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="crm-input w-full"
                placeholder="client@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="crm-input w-full"
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
                className="crm-input w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Address</label>
              <input
                type="text"
                value={formData.addressLine1}
                onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                className="crm-input w-full"
                placeholder="Street Address"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="crm-input w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 border-t border-slate-100 pt-2.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Emergency Contact</label>
              <input
                type="text"
                value={formData.emergencyContactName}
                onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                className="crm-input w-full"
                placeholder="Name"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Emergency Mobile</label>
              <input
                type="text"
                value={formData.emergencyContactMobile}
                onChange={(e) => setFormData({ ...formData, emergencyContactMobile: e.target.value })}
                className="crm-input w-full"
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
              className="bg-white border border-slate-300 rounded text-xs text-slate-800 px-3 py-1.5 w-full focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Allergies, chronic conditions, personal goals..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="crm-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="crm-btn-primary"
            >
              {submitting ? "Registering..." : "Complete Registration"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
