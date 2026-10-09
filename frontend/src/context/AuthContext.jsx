import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";
import { resetLibrary } from "../lib/library";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("cv_token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .me(token)
      .then(setUser)
      .catch(() => {
        setToken(null);
        localStorage.removeItem("cv_token");
      })
      .finally(() => setLoading(false));
  }, [token]);

  function login(accessToken, userData) {
    localStorage.setItem("cv_token", accessToken);
    setToken(accessToken);
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem("cv_token");
    resetLibrary();
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
