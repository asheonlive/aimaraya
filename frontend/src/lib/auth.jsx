import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const token = localStorage.getItem("maraya_token");
    if (!token) { setUser(null); setLoading(false); return; }
    try {
      const res = await api.get("/auth/me");
      setUser(res.data.user);
    } catch {
      localStorage.removeItem("maraya_token");
      setUser(null);
    } finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, []);

  const login = async (key) => {
    const res = await api.post("/auth/login", { key, password: key, email: key });
    localStorage.setItem("maraya_token", res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (key) => {
    const res = await api.post("/auth/register", { key, password: key, email: key });
    localStorage.setItem("maraya_token", res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem("maraya_token");
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, setUser, loading, login, register, logout, refresh }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
