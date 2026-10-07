import React, { useEffect, useState } from "react";
import api from "../services/api.js";
import { User, Phone, Mail, MapPin, Shield, Heart } from "lucide-react";

export default function ClientProfile() {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/clients/me/profile");
        if (res.data.success) {
          setProfileData(res.data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500 text-xs">
        Loading profile information...
      </div>
    );
  }

  const { profile = {}, addresses = [], emergencyContacts = [] } = profileData || {};

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Your Personal Profile</h1>
        <p className="text-xs text-slate-500 mt-1">Manage contact info, registered residential address, and emergency details</p>
      </div>

      {/* Main Identity Box */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white font-black text-3xl flex items-center justify-center shadow-md">
          {profile.first_name?.[0]}{profile.last_name?.[0]}
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900">{profile.first_name} {profile.last_name}</h2>
            <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              {profile.client_code}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {profile.gender} • {profile.age || "N/A"} years old • Language: {profile.preferred_language || "English"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact info */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Contact Information</h3>
          <div className="space-y-3 text-xs text-slate-700">
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>{profile.mobile}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-emerald-600" />
              <span>{profile.email}</span>
            </div>
            {addresses[0] && (
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>{addresses[0].address_line1}, {addresses[0].city}, {addresses[0].state} - {addresses[0].pincode}</span>
              </div>
            )}
          </div>
        </div>

        {/* Emergency contact */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Emergency Contact</h3>
          {emergencyContacts.length > 0 ? (
            <div className="space-y-2 text-xs text-slate-700">
              <p className="font-bold text-slate-900">{emergencyContacts[0].contact_name} ({emergencyContacts[0].relationship})</p>
              <p>📞 {emergencyContacts[0].mobile}</p>
              {emergencyContacts[0].email && <p>✉️ {emergencyContacts[0].email}</p>}
            </div>
          ) : (
            <p className="text-xs text-slate-400">No emergency contacts registered.</p>
          )}
        </div>
      </div>
    </div>
  );
}
