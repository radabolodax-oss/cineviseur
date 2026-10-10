import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";
import { resetLibrary } from "../lib/library";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  function login(userData) {
    setUser(userData);
  }

  async function logout() {
    try { await api.logout(); } catch { /* déconnexion locale même si le réseau échoue */ }
    resetLibrary();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
