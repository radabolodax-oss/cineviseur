import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";
import { resetLibrary } from "../lib/library";

const LOCAL_VISITOR = {
  id: "local-visitor",
  name: "Mon Espace",
  email: "",
};

const AuthContext = createContext({
  user: LOCAL_VISITOR,
  loading: false,
  login: () => {},
  logout: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(LOCAL_VISITOR);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .me()
      .then(setUser)
      .catch(() => setUser(LOCAL_VISITOR))
      .finally(() => setLoading(false));
  }, []);

  function login(userData) {
    setUser(userData || LOCAL_VISITOR);
  }

  async function logout() {
    try { await api.logout(); } catch { /* ignore */ }
    resetLibrary();
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
