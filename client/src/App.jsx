import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ClientAuthProvider } from "./context/ClientAuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import ClientLayout from "./layouts/ClientLayout.jsx";

import ClientLogin from "./pages/ClientLogin.jsx";
import ClientRegister from "./pages/ClientRegister.jsx";
import ClientDashboard from "./pages/ClientDashboard.jsx";
import ClientAppointments from "./pages/ClientAppointments.jsx";
import ClientGoals from "./pages/ClientGoals.jsx";
import ClientPlans from "./pages/ClientPlans.jsx";
import ClientPackages from "./pages/ClientPackages.jsx";
import ClientStore from "./pages/ClientStore.jsx";
import ClientCart from "./pages/ClientCart.jsx";
import ClientOrders from "./pages/ClientOrders.jsx";
import ClientInvoices from "./pages/ClientInvoices.jsx";
import ClientProfile from "./pages/ClientProfile.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <ClientAuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/login" element={<ClientLogin />} />
            <Route path="/register" element={<ClientRegister />} />

            <Route path="/" element={<ClientLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<ClientDashboard />} />
              <Route path="appointments" element={<ClientAppointments />} />
              <Route path="goals" element={<ClientGoals />} />
              <Route path="wellness-plans" element={<ClientPlans />} />
              <Route path="packages" element={<ClientPackages />} />
              <Route path="store" element={<ClientStore />} />
              <Route path="cart" element={<ClientCart />} />
              <Route path="orders" element={<ClientOrders />} />
              <Route path="invoices" element={<ClientInvoices />} />
              <Route path="profile" element={<ClientProfile />} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </CartProvider>
      </ClientAuthProvider>
    </BrowserRouter>
  );
}
