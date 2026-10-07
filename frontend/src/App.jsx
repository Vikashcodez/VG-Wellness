import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import DashboardLayout from "./layouts/DashboardLayout.jsx";

import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import SaasCentres from "./pages/SaasCentres.jsx";
import CentreBranches from "./pages/CentreBranches.jsx";
import Employees from "./pages/Employees.jsx";
import Clients from "./pages/Clients.jsx";
import ClientProfile from "./pages/ClientProfile.jsx";
import Appointments from "./pages/Appointments.jsx";
import Queue from "./pages/Queue.jsx";
import Practitioners from "./pages/Practitioners.jsx";
import Services from "./pages/Services.jsx";
import Assessments from "./pages/Assessments.jsx";
import Goals from "./pages/Goals.jsx";
import WellnessPlans from "./pages/WellnessPlans.jsx";
import Packages from "./pages/Packages.jsx";
import Products from "./pages/Products.jsx";
import Inventory from "./pages/Inventory.jsx";
import Assets from "./pages/Assets.jsx";
import Finance from "./pages/Finance.jsx";
import Billing from "./pages/Billing.jsx";
import Reports from "./pages/Reports.jsx";
import Settings from "./pages/Settings.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="saas/centres" element={<SaasCentres />} />
            <Route path="branches" element={<CentreBranches />} />
            <Route path="employees" element={<Employees />} />
            <Route path="clients" element={<Clients />} />
            <Route path="clients/:id" element={<ClientProfile />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="queue" element={<Queue />} />
            <Route path="practitioners" element={<Practitioners />} />
            <Route path="services" element={<Services />} />
            <Route path="assessments" element={<Assessments />} />
            <Route path="goals" element={<Goals />} />
            <Route path="wellness-plans" element={<WellnessPlans />} />
            <Route path="packages" element={<Packages />} />
            <Route path="products" element={<Products />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="assets" element={<Assets />} />
            <Route path="finance" element={<Finance />} />
            <Route path="billing" element={<Billing />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
