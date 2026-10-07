import React, { useState, useEffect } from "react";
import Header from "../components/Header.jsx";
import { employeeService } from "../services/employeeService.js";
import Modal from "../components/Modal.jsx";
import { Search, Plus, ShieldCheck, CheckSquare, Square, Eye, EyeOff, Key, Edit2 } from "lucide-react";

const AVAILABLE_TABS = [
  { id: "dashboard", label: "Branch Dashboard", category: "Core", desc: "Overview, revenue velocity & KPI metrics" },
  { id: "queue", label: "Front Desk Queue", category: "Front Desk", desc: "Patient check-in, tokens & waiting room" },
  { id: "appointments", label: "Appointments Schedule", category: "Clinical", desc: "Bookings calendar, reschedule & consults" },
  { id: "clients", label: "Clients Directory", category: "CRM", desc: "Client registration, intake & 360 profile" },
  { id: "billing", label: "Billing & Invoices", category: "Finance", desc: "Tax invoices, GST receipts & payments" },
  { id: "services", label: "Services Master", category: "Masters", desc: "Therapy services, durations & pricing" },
  { id: "packages", label: "Packages & Tiers", category: "Masters", desc: "Prepaid bundles & membership plans" },
  { id: "products", label: "Products Master", category: "Masters", desc: "Formulations, retail stock & supplements" },
  { id: "inventory", label: "Inventory Stock", category: "Operations", desc: "Stock batches, expiry alerts & reorders" },
  { id: "finance", label: "Accounts & Ledger", category: "Finance", desc: "Operating expenses, collections & ledger" },
  { id: "assets", label: "Asset Management", category: "Operations", desc: "Clinical machines, rooms & maintenance" },
  { id: "goals", label: "Goal Engine", category: "Clinical", desc: "Health milestones & progress monitoring" },
  { id: "wellness-plans", label: "Wellness Plans", category: "Clinical", desc: "Diet charts, naturopathy & lifestyle" },
  { id: "assessments", label: "Biometric Assessments", category: "Clinical", desc: "Vitals, diagnostic evaluations & notes" },
  { id: "practitioners", label: "Practitioners Directory", category: "Clinical", desc: "Doctor profiles, specialists & rosters" },
  { id: "reports", label: "Operational Reports", category: "Management", desc: "Revenue analytics & branch performance" },
  { id: "employees", label: "Staff & Employees", category: "Management", desc: "Manage employee directory & permissions" },
];

const PRESETS = {
  FRONT_DESK: ["queue", "appointments", "clients", "billing"],
  CLINICAL: ["dashboard", "appointments", "clients", "assessments", "goals", "wellness-plans", "products"],
  BILLING: ["billing", "finance", "reports"],
  INVENTORY: ["products", "inventory", "assets"],
  ADMIN_FULL: AVAILABLE_TABS.map((t) => t.id)
};

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    department: "CLINICAL",
    designation: "",
    roleName: "PRACTITIONER",
    salary: "",
    status: "ACTIVE",
    emergencyContact: "",
    address: "",
    password: ""
  });

  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedTabs, setSelectedTabs] = useState([]);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    department: "CLINICAL",
    designation: "",
    roleName: "PRACTITIONER",
    password: "Password@123",
    salary: "",
    joiningDate: new Date().toISOString().split("T")[0],
    emergencyContact: "",
    address: ""
  });

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const res = await employeeService.getEmployees({
        department: departmentFilter || undefined,
        search: search || undefined
      });
      setEmployees(res.data || []);
    } catch (err) {
      console.error("Error loading employees:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, [departmentFilter, search]);

  const handleDepartmentChange = (dept) => {
    let role = "EMPLOYEE";
    if (dept === "CLINICAL") role = "PRACTITIONER";
    else if (dept === "THERAPY") role = "THERAPIST";
    else if (dept === "FRONT_OFFICE") role = "RECEPTIONIST";
    else if (dept === "ACCOUNTS") role = "BILLING_STAFF";
    else if (dept === "INVENTORY") role = "INVENTORY_STAFF";
    else if (dept === "MANAGEMENT") role = "MANAGER";

    setForm({
      ...form,
      department: dept,
      roleName: role
    });
  };

  const handleOpenPermissions = (emp) => {
    setSelectedEmployee(emp);
    let currentPerms = [];
    if (Array.isArray(emp.permissions)) {
      currentPerms = emp.permissions;
    } else if (typeof emp.permissions === "string") {
      try {
        currentPerms = JSON.parse(emp.permissions);
      } catch (e) {
        currentPerms = [];
      }
    }
    
    // If no custom perms exist, set default by role
    if (!currentPerms || currentPerms.length === 0) {
      if (emp.department === "FRONT_OFFICE") currentPerms = PRESETS.FRONT_DESK;
      else if (emp.department === "CLINICAL" || emp.department === "THERAPY") currentPerms = PRESETS.CLINICAL;
      else if (emp.department === "ACCOUNTS") currentPerms = PRESETS.BILLING;
      else if (emp.department === "INVENTORY") currentPerms = PRESETS.INVENTORY;
      else currentPerms = PRESETS.ADMIN_FULL;
    }
    
    setSelectedTabs(currentPerms);
    setIsPermissionsModalOpen(true);
  };

  const toggleTab = (tabId) => {
    if (selectedTabs.includes(tabId)) {
      setSelectedTabs(selectedTabs.filter((id) => id !== tabId));
    } else {
      setSelectedTabs([...selectedTabs, tabId]);
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedEmployee) return;
    setSavingPermissions(true);
    try {
      await employeeService.updatePermissions(selectedEmployee.id, selectedTabs);
      setIsPermissionsModalOpen(false);
      loadEmployees();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await employeeService.createEmployee({
        ...form,
        salary: parseFloat(form.salary || 0),
        permissions: selectedTabs.length > 0 ? selectedTabs : undefined
      });
      setIsAddModalOpen(false);
      
      const createdEmployee = res.data || res;
      // Immediately open permissions assignment page/modal for this newly created employee!
      handleOpenPermissions(createdEmployee);

      setForm({
        firstName: "", lastName: "", email: "", phone: "",
        department: "CLINICAL", designation: "", roleName: "PRACTITIONER",
        password: "Password@123", salary: "",
        joiningDate: new Date().toISOString().split("T")[0],
        emergencyContact: "", address: ""
      });
      loadEmployees();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const openEditEmployee = (emp) => {
    setEditingEmployee(emp);
    setEditForm({
      firstName: emp.first_name || "",
      lastName: emp.last_name || "",
      email: emp.email || "",
      phone: emp.phone || "",
      department: emp.department || "CLINICAL",
      designation: emp.designation || "",
      roleName: emp.role_name || emp.department || "EMPLOYEE",
      salary: emp.salary || "",
      status: emp.status || "ACTIVE",
      emergencyContact: emp.emergency_contact || "",
      address: emp.address || "",
      password: ""
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingEmployee) return;
    setSubmittingEdit(true);
    try {
      const payload = {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        department: editForm.department,
        designation: editForm.designation.trim(),
        roleName: editForm.roleName,
        salary: parseFloat(editForm.salary || 0),
        status: editForm.status,
        emergencyContact: editForm.emergencyContact,
        address: editForm.address
      };
      if (editForm.password && editForm.password.trim().length >= 6) {
        payload.password = editForm.password.trim();
      }
      await employeeService.updateEmployee(editingEmployee.id, payload);
      setIsEditModalOpen(false);
      loadEmployees();
      alert("Employee details updated successfully!");
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to update employee");
    } finally {
      setSubmittingEdit(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#f4f6f8]">
      <Header
        title="Staff & Employees Directory"
        subtitle="Manage practitioners, therapists, front desk staff, credentials and assigned module tabs"
        actions={
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="crm-btn-primary"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Employee</span>
          </button>
        }
      />

      <div className="p-3.5 sm:p-5 space-y-3 flex-1 max-w-full">
        {/* Search & Department Filter Bar */}
        <div className="crm-card p-2 sm:p-2.5 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex flex-1 w-full sm:w-auto items-center gap-2">
            <div className="relative flex-1 sm:w-80">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, employee code, designation, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="crm-input pl-8 w-full"
              />
            </div>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="crm-input w-44"
            >
              <option value="">All Departments</option>
              <option value="CLINICAL">Clinical & Medical</option>
              <option value="THERAPY">Therapy & Nutrition</option>
              <option value="FRONT_OFFICE">Front Desk & Reception</option>
              <option value="ACCOUNTS">Accounts & Billing</option>
              <option value="MANAGEMENT">Operations Management</option>
              <option value="INVENTORY">Inventory & Logistics</option>
            </select>
          </div>
          <div className="text-[11px] font-medium text-slate-500 self-end sm:self-center">
            Total <span className="font-bold text-slate-900">{employees.length}</span> staff members
          </div>
        </div>

        {/* High Density Employees Table */}
        <div className="crm-card overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading staff directory...
            </div>
          ) : employees.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No employees match your search criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Emp Code</th>
                    <th>Name & Work Email</th>
                    <th>Department & Role</th>
                    <th>Designation</th>
                    <th>Assigned Branch</th>
                    <th className="text-right">Monthly CTC</th>
                    <th className="text-center">Status</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => {
                    let permsCount = 0;
                    if (Array.isArray(emp.permissions)) permsCount = emp.permissions.length;
                    else if (typeof emp.permissions === "string") {
                      try { permsCount = JSON.parse(emp.permissions).length; } catch (e) { permsCount = 0; }
                    }

                    return (
                      <tr key={emp.id}>
                        <td className="font-mono font-bold text-slate-900 text-xs">
                          {emp.employee_code}
                        </td>
                        <td>
                          <div className="font-bold text-slate-900">
                            {emp.first_name} {emp.last_name}
                          </div>
                          <div className="text-[11px] text-blue-700 font-medium">
                            {emp.email}
                          </div>
                          {emp.phone && <div className="text-[10px] text-slate-400">{emp.phone}</div>}
                        </td>
                        <td>
                          <div className="crm-badge-neutral text-[10px] inline-block">
                            {emp.department}
                          </div>
                          <div className="text-[10px] font-semibold text-slate-500 mt-0.5">
                            {emp.role_name || emp.department}
                          </div>
                        </td>
                        <td className="font-medium text-slate-800">
                          {emp.designation}
                        </td>
                        <td className="text-slate-600">
                          {emp.branch_name || "Main Branch"}
                        </td>
                        <td className="text-right font-bold text-slate-900">
                          ₹{parseFloat(emp.salary || 0).toLocaleString()}
                        </td>
                        <td className="text-center">
                          <span className={emp.status === "ACTIVE" ? "crm-badge-success" : "crm-badge-neutral"}>
                            {emp.status}
                          </span>
                        </td>
                        <td className="text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditEmployee(emp)}
                              className="crm-btn-secondary text-[10px] py-1 px-2 font-semibold text-slate-700 hover:text-blue-700 hover:bg-slate-100 inline-flex items-center gap-1"
                              title="Edit employee record and credentials"
                            >
                              <Edit2 className="w-3 h-3 text-slate-500" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenPermissions(emp)}
                              className="crm-btn-secondary text-[10px] py-1 px-2 font-semibold text-blue-700 hover:text-blue-800 hover:bg-blue-50 inline-flex items-center gap-1 border border-blue-200"
                              title="Assign visible navigation tabs for this employee"
                            >
                              <ShieldCheck className="w-3 h-3 text-blue-600" />
                              <span>{permsCount > 0 ? `${permsCount} Tabs` : "Tabs"}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add Employee With Login Credentials */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register New Employee & User Login">
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="bg-blue-50/60 p-2.5 rounded border border-blue-200/80 text-[11px] text-blue-800 font-medium">
            This creates both the HR Employee Record and the official User Login account so the employee can sign in directly.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="crm-input w-full"
                placeholder="e.g. Ramesh"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="crm-input w-full"
                placeholder="e.g. Kumar"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Official Email (Username for Login) *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="crm-input w-full"
                placeholder="ramesh@wellness.com"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="crm-input w-full"
                placeholder="+91 98765 43210"
              />
            </div>

            {/* Department & Role Selection */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Department *</label>
              <select
                value={form.department}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                className="crm-input w-full"
              >
                <option value="CLINICAL">Clinical & Naturopathy</option>
                <option value="THERAPY">Therapy & Panchakarma</option>
                <option value="FRONT_OFFICE">Front Desk & Reception</option>
                <option value="ACCOUNTS">Accounts & Billing</option>
                <option value="MANAGEMENT">Operations & Admin</option>
                <option value="INVENTORY">Inventory & Logistics</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Portal Login Role *</label>
              <select
                value={form.roleName}
                onChange={(e) => setForm({ ...form, roleName: e.target.value })}
                className="crm-input w-full"
              >
                <option value="RECEPTIONIST">Receptionist (Front Desk)</option>
                <option value="PRACTITIONER">Doctor / Practitioner</option>
                <option value="THERAPIST">Therapist</option>
                <option value="NUTRITIONIST">Nutritionist</option>
                <option value="BILLING_STAFF">Billing & Cashier</option>
                <option value="INVENTORY_STAFF">Inventory Manager</option>
                <option value="MANAGER">Operations Manager</option>
                <option value="BRANCH_ADMIN">Branch Administrator</option>
                <option value="EMPLOYEE">General Staff / Employee</option>
              </select>
            </div>

            {/* Password Field */}
            <div className="sm:col-span-2 bg-slate-50 p-2.5 rounded border border-slate-200">
              <label className="block font-bold text-slate-900 mb-1">
                Employee Portal Login Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="crm-input w-full pr-8 font-mono"
                  placeholder="Min 6 characters (e.g. Staff@123)"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                The employee will use this password alongside their work email to log in to the portal.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Job Designation *</label>
              <input
                type="text"
                required
                placeholder="e.g. Senior Panchakarma Therapist"
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
                className="crm-input w-full"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Monthly Salary / CTC (₹)</label>
              <input
                type="number"
                placeholder="45000"
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: e.target.value })}
                className="crm-input w-full"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Joining Date</label>
              <input
                type="date"
                value={form.joiningDate}
                onChange={(e) => setForm({ ...form, joiningDate: e.target.value })}
                className="crm-input w-full"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Emergency Contact</label>
              <input
                type="text"
                placeholder="Name & Contact number"
                value={form.emergencyContact}
                onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
                className="crm-input w-full"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="crm-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="crm-btn-primary"
            >
              Register & Assign Visible Tabs →
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Assign Navigation Tabs & Permissions */}
      <Modal
        isOpen={isPermissionsModalOpen}
        onClose={() => setIsPermissionsModalOpen(false)}
        title={
          selectedEmployee
            ? `Assign Visible Tabs: ${selectedEmployee.first_name} ${selectedEmployee.last_name}`
            : "Assign Visible Navigation Tabs"
        }
      >
        <div className="space-y-3.5 text-xs">
          {selectedEmployee && (
            <div className="p-2.5 rounded bg-slate-50 border border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-1.5">
              <div>
                <span className="font-bold text-slate-900 text-xs">
                  {selectedEmployee.first_name} {selectedEmployee.last_name}
                </span>
                <span className="text-slate-500 ml-2 font-mono text-[11px]">
                  ({selectedEmployee.email})
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="crm-badge-neutral text-[10px]">
                  {selectedEmployee.department}
                </span>
                <span className="crm-badge-info text-[10px]">
                  {selectedEmployee.role_name || selectedEmployee.department}
                </span>
              </div>
            </div>
          )}

          <p className="text-slate-600 text-[11px]">
            Select which navigation tabs will be visible to this employee when they sign in. Only checked tabs will appear in their sidebar navigation.
          </p>

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Quick Role Presets:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedTabs(PRESETS.FRONT_DESK)}
                className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-semibold transition cursor-pointer"
              >
                Front Desk Preset (Queue, Appts, Clients, Bill)
              </button>
              <button
                type="button"
                onClick={() => setSelectedTabs(PRESETS.CLINICAL)}
                className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-semibold transition cursor-pointer"
              >
                Clinical Preset (Assessments, Plans, Goals)
              </button>
              <button
                type="button"
                onClick={() => setSelectedTabs(PRESETS.BILLING)}
                className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-[10px] font-semibold transition cursor-pointer"
              >
                Billing & Accounts
              </button>
              <button
                type="button"
                onClick={() => setSelectedTabs(PRESETS.INVENTORY)}
                className="px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-[10px] font-semibold transition cursor-pointer"
              >
                Inventory & Stock
              </button>
              <button
                type="button"
                onClick={() => setSelectedTabs(PRESETS.ADMIN_FULL)}
                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-[10px] font-semibold transition cursor-pointer"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={() => setSelectedTabs([])}
                className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-semibold transition cursor-pointer"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Tab Checkboxes Grid */}
          <div className="border border-slate-200 rounded-lg max-h-72 overflow-y-auto divide-y divide-slate-100">
            {AVAILABLE_TABS.map((tab) => {
              const isChecked = selectedTabs.includes(tab.id);
              return (
                <div
                  key={tab.id}
                  onClick={() => toggleTab(tab.id)}
                  className={`p-2.5 flex items-start gap-2.5 cursor-pointer transition select-none ${
                    isChecked ? "bg-blue-50/60" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="pt-0.5 text-blue-600 flex-shrink-0">
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 fill-blue-600 text-white" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold text-xs ${isChecked ? "text-blue-900" : "text-slate-800"}`}>
                        {tab.label}
                      </span>
                      <span className="text-[9px] uppercase font-bold text-slate-400 px-1 py-0.2 rounded bg-slate-100 border border-slate-200">
                        {tab.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{tab.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
            <span className="text-[11px] font-medium text-slate-500">
              <span className="font-bold text-blue-700">{selectedTabs.length}</span> of {AVAILABLE_TABS.length} tabs enabled
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPermissionsModalOpen(false)}
                className="crm-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingPermissions}
                onClick={handleSavePermissions}
                className="crm-btn-primary"
              >
                {savingPermissions ? "Saving..." : "Save Tab Permissions"}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal: Edit Employee & Credentials */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={
          editingEmployee
            ? `Edit Employee: ${editingEmployee.first_name} ${editingEmployee.last_name} (${editingEmployee.employee_code})`
            : "Edit Employee Details"
        }
      >
        <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={editForm.firstName}
                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                className="crm-input w-full"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={editForm.lastName}
                onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                className="crm-input w-full"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Official Email / Login Username *</label>
              <input
                type="email"
                required
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="crm-input w-full"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
              <input
                type="text"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="crm-input w-full"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Department *</label>
              <select
                value={editForm.department}
                onChange={(e) => {
                  const dept = e.target.value;
                  let role = editForm.roleName;
                  if (dept === "CLINICAL") role = "PRACTITIONER";
                  else if (dept === "THERAPY") role = "THERAPIST";
                  else if (dept === "FRONT_OFFICE") role = "RECEPTIONIST";
                  else if (dept === "ACCOUNTS") role = "BILLING_STAFF";
                  else if (dept === "INVENTORY") role = "INVENTORY_STAFF";
                  else if (dept === "MANAGEMENT") role = "MANAGER";
                  setEditForm({ ...editForm, department: dept, roleName: role });
                }}
                className="crm-input w-full"
              >
                <option value="CLINICAL">Clinical & Medical</option>
                <option value="THERAPY">Therapy & Panchakarma</option>
                <option value="FRONT_OFFICE">Front Desk & Reception</option>
                <option value="ACCOUNTS">Accounts & Billing</option>
                <option value="MANAGEMENT">Operations Management</option>
                <option value="INVENTORY">Inventory & Logistics</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Designation Title *</label>
              <input
                type="text"
                required
                value={editForm.designation}
                onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                className="crm-input w-full"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assigned Security Role *</label>
              <select
                value={editForm.roleName}
                onChange={(e) => setEditForm({ ...editForm, roleName: e.target.value })}
                className="crm-input w-full"
              >
                <option value="PRACTITIONER">Doctor / Practitioner</option>
                <option value="THERAPIST">Therapist / Masseur</option>
                <option value="RECEPTIONIST">Receptionist / Front Desk</option>
                <option value="BILLING_STAFF">Billing & Cashier</option>
                <option value="INVENTORY_STAFF">Inventory Manager</option>
                <option value="MANAGER">Branch Operations Manager</option>
                <option value="EMPLOYEE">General Employee</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Employment Status *</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="crm-input w-full"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="ON_LEAVE">ON LEAVE</option>
                <option value="TERMINATED">TERMINATED</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Monthly Salary / CTC (₹)</label>
              <input
                type="number"
                value={editForm.salary}
                onChange={(e) => setEditForm({ ...editForm, salary: e.target.value })}
                className="crm-input w-full"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Emergency Contact</label>
              <input
                type="text"
                value={editForm.emergencyContact}
                onChange={(e) => setEditForm({ ...editForm, emergencyContact: e.target.value })}
                className="crm-input w-full"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Address</label>
              <input
                type="text"
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                className="crm-input w-full"
              />
            </div>

            {/* Optional Password Reset */}
            <div className="sm:col-span-2 p-2.5 rounded bg-amber-50/70 border border-amber-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-amber-900 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-600" />
                  <span>Reset Portal Password (Optional)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowEditPassword(!showEditPassword)}
                  className="text-amber-800 text-[11px] font-medium hover:underline inline-flex items-center gap-1"
                >
                  {showEditPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showEditPassword ? "Hide" : "Show"}</span>
                </button>
              </div>
              <input
                type={showEditPassword ? "text" : "password"}
                value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                className="crm-input w-full bg-white"
                placeholder="Leave blank to keep existing password, or enter new password (min 6 chars)"
              />
              <p className="text-[10px] text-amber-700">
                If provided, will update login credentials for this staff member immediately.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="crm-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingEdit}
              className="crm-btn-primary"
            >
              {submittingEdit ? "Updating..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
