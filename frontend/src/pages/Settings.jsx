import React, { useEffect, useState } from "react";
import Header from "../components/Header.jsx";
import api from "../services/api.js";
import { Settings as SettingsIcon, Building2, Users, ShieldCheck, History } from "lucide-react";

export default function Settings() {
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("audit");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [bRes, uRes, rRes, aRes] = await Promise.all([
          api.get("/branches"),
          api.get("/users"),
          api.get("/users/roles"),
          api.get("/users/audit-logs")
        ]);
        if (bRes.data.success) setBranches(bRes.data.data);
        if (uRes.data.success) setUsers(uRes.data.data);
        if (rRes.data.success) setRoles(rRes.data.data);
        if (aRes.data.success) setAuditLogs(aRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="System Administration & Audit Governance"
        subtitle="Multi-branch configuration, RBAC user permissions, and compliance audit trail"
      />

      <div className="p-8 space-y-6 flex-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "audit" ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            System Audit Trail ({auditLogs.length})
          </button>
          <button
            onClick={() => setActiveTab("branches")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "branches" ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            Branches ({branches.length})
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "users" ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            Staff Directory & Roles ({users.length})
          </button>
        </div>

        {/* Audit Logs Tab */}
        {activeTab === "audit" && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Section 40 Compliance Audit Log</span>
              <span>Showing last 100 historical modifications</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 font-bold uppercase text-slate-500">
                    <th className="py-3 px-6">Timestamp</th>
                    <th className="py-3 px-6">Action / Event</th>
                    <th className="py-3 px-6">Module</th>
                    <th className="py-3 px-6">User / Agent</th>
                    <th className="py-3 px-6">Payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-6 text-slate-400 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-6 font-mono font-bold text-slate-900">
                        {log.action}
                      </td>
                      <td className="py-3 px-6">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {log.module}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-slate-700 font-medium">
                        {log.first_name ? `${log.first_name} ${log.last_name}` : "System Kernel"}
                      </td>
                      <td className="py-3 px-6 font-mono text-[11px] text-slate-500 max-w-xs truncate">
                        {JSON.stringify(log.new_data || log.old_data || {})}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Branches Tab */}
        {activeTab === "branches" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {branches.map((b) => (
              <div key={b.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-slate-900">{b.name}</h3>
                  <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {b.code}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  📍 {b.address}, {b.city}, {b.state} - {b.pincode}
                </p>
                <p className="text-xs text-slate-500">Phone: {b.phone} • Email: {b.email}</p>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-700">
                  <span>Status: Fully Operational</span>
                  <span>Branch #{b.id}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 font-bold uppercase text-slate-500">
                    <th className="py-3 px-6">Staff Member</th>
                    <th className="py-3 px-6">Email Address</th>
                    <th className="py-3 px-6">System Role</th>
                    <th className="py-3 px-6">Branch Assignment</th>
                    <th className="py-3 px-6">Account Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-6 font-bold text-slate-900">{u.first_name} {u.last_name}</td>
                      <td className="py-3 px-6 text-slate-600">{u.email}</td>
                      <td className="py-3 px-6">
                        <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-900 text-white">
                          {u.role_name}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-slate-600">{u.branch_name || "Central HQ"}</td>
                      <td className="py-3 px-6">
                        <span className="text-emerald-700 font-bold">ACTIVE</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
