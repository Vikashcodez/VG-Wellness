import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/authService.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("staff_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("staff_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verify() {
      if (token) {
        try {
          const res = await authService.getMe();
          if (res.success) {
            setUser(res.data);
            localStorage.setItem("staff_user", JSON.stringify(res.data));
          }
        } catch (err) {
          console.error("Token verification failed:", err);
          logout();
        }
      }
      setLoading(false);
    }
    verify();
  }, [token]);

  const login = async (email, password) => {
    const res = await authService.login(email, password);
    if (res.success && res.data.token) {
      // Check if user is staff role (not client)
      if (res.data.user.role === "CLIENT") {
        throw new Error("Client accounts should log in via the Client Portal.");
      }
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem("staff_token", res.data.token);
      localStorage.setItem("staff_user", JSON.stringify(res.data.user));
      return res.data.user;
    }
    throw new Error(res.message || "Login failed");
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("staff_token");
    localStorage.removeItem("staff_user");
  };

  const hasRole = (...roles) => {
    if (!user) return false;
    if (user.role === "SUPER_ADMIN") return true;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
