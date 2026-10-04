import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../services/api";
import { connectSocket, disconnectSocket } from "../services/socket";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const bootstrap = useCallback(async () => {
    const token = localStorage.getItem("dsadebug_token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
      connectSocket(token);
    } catch {
      localStorage.removeItem("dsadebug_token");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  async function login(email, password) {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("dsadebug_token", data.token);
    setUser(data.user);
    connectSocket(data.token);
  }

  async function register(username, email, password) {
    const { data } = await api.post("/auth/register", { username, email, password });
    localStorage.setItem("dsadebug_token", data.token);
    setUser(data.user);
    connectSocket(data.token);
  }

  // Re-fetch the user (e.g. after an accepted submission) so stats and solved ticks are current.
  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
    } catch {
      /* keep the existing user on a transient failure */
    }
  }, []);

  function logout() {
    localStorage.removeItem("dsadebug_token");
    disconnectSocket();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
