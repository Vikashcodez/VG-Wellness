import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api.js";

const ClientAuthContext = createContext(null);

export function ClientAuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("client_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("client_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verify() {
      if (token) {
        try {
          const res = await api.get("/auth/me");
          if (res.data.success) {
            setUser(res.data.data);
            localStorage.setItem("client_user", JSON.stringify(res.data.data));
          }
        } catch (err) {
          console.error("Client token verification error:", err);
          logout();
        }
      }
      setLoading(false);
    }
    verify();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    if (res.data.success && res.data.data.token) {
      setToken(res.data.data.token);
      setUser(res.data.data.user);
      localStorage.setItem("client_token", res.data.data.token);
      localStorage.setItem("client_user", JSON.stringify(res.data.data.user));
      return res.data.data.user;
    }
    throw new Error(res.data.message || "Login failed");
  };

  const register = async (clientData) => {
    const res = await api.post("/auth/register", clientData);
    if (res.data.success && res.data.data.token) {
      setToken(res.data.data.token);
      setUser(res.data.data.user);
      localStorage.setItem("client_token", res.data.data.token);
      localStorage.setItem("client_user", JSON.stringify(res.data.data.user));
      return res.data.data.user;
    }
    throw new Error(res.data.message || "Registration failed");
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("client_token");
    localStorage.removeItem("client_user");
  };

  return (
    <ClientAuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </ClientAuthContext.Provider>
  );
}

export function useClientAuth() {
  const context = useContext(ClientAuthContext);
  if (!context) {
    throw new Error("useClientAuth must be used within a ClientAuthProvider");
  }
  return context;
}
