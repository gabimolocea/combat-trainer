import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import api from "@/api/client";
import type { User, AuthTokens } from "@/types";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    const tokens = localStorage.getItem("tokens");
    if (stored && tokens) {
      setUser(JSON.parse(stored));
      api.get("/auth/me/").then((res) => {
        setUser(res.data);
        localStorage.setItem("user", JSON.stringify(res.data));
      }).catch(() => {
        localStorage.removeItem("user");
        localStorage.removeItem("tokens");
        setUser(null);
      }).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post("/auth/login/", { email, password });
    const tokens: AuthTokens = { access: res.data.access, refresh: res.data.refresh };
    localStorage.setItem("tokens", JSON.stringify(tokens));
    const meRes = await api.get("/auth/me/");
    setUser(meRes.data);
    localStorage.setItem("user", JSON.stringify(meRes.data));
  };

  const register = async (email: string, username: string, password: string) => {
    const res = await api.post("/auth/register/", {
      email, username, password, password_confirm: password,
    });
    const tokens: AuthTokens = res.data.tokens;
    localStorage.setItem("tokens", JSON.stringify(tokens));
    setUser(res.data.user);
    localStorage.setItem("user", JSON.stringify(res.data.user));
  };

  const logout = () => {
    const tokens = localStorage.getItem("tokens");
    if (tokens) {
      const { refresh } = JSON.parse(tokens);
      api.post("/auth/logout/", { refresh }).catch(() => {});
    }
    localStorage.removeItem("tokens");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
