import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import func2url from "../../backend/func2url.json";

const AUTH_URL = (func2url as Record<string, string>).auth;
const SUBS_URL = (func2url as Record<string, string>).subscriptions;

export interface User {
  id: number;
  nickname: string;
  email: string;
  role: "owner" | "admin" | "subscriber";
  is_blocked?: boolean;
}

export interface Subscription {
  id: number;
  plan: string;
  plan_label: string;
  status: string;
  started_at: string;
  expires_at: string;
}

interface RegisterData {
  nickname: string;
  email: string;
  password: string;
  gdpr_consent: boolean;
  invite_code?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  subscription: Subscription | null;
  hasAccess: boolean;
  loading: boolean;
  subLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("auth_token"));
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [subLoading, setSubLoading] = useState(false);

  const fetchSubscription = useCallback(async (tok: string) => {
    setSubLoading(true);
    try {
      const r = await fetch(`${SUBS_URL}?action=status`, { headers: { "X-Auth-Token": tok } });
      const d = await r.json();
      setSubscription(d.subscription || null);
    } catch {
      setSubscription(null);
    } finally {
      setSubLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch(`${AUTH_URL}?action=me`, { headers: { "X-Auth-Token": token } })
      .then(r => r.json())
      .then(d => {
        if (d.user) {
          setUser(d.user);
          fetchSubscription(token);
        } else {
          // Токен невалиден на сервере — чистим
          localStorage.removeItem("auth_token");
          setToken(null);
        }
      })
      .catch(() => {
        // Сетевая ошибка — НЕ удаляем токен, просто продолжаем без авторизации
        // При следующей загрузке токен будет проверен снова
      })
      .finally(() => setLoading(false));
  }, [token, fetchSubscription]);

  const login = async (email: string, password: string) => {
    const r = await fetch(`${AUTH_URL}?action=login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || "Ошибка входа");
    localStorage.setItem("auth_token", d.token);
    setToken(d.token);
    const me = await fetch(`${AUTH_URL}?action=me`, { headers: { "X-Auth-Token": d.token } });
    const md = await me.json();
    setUser(md.user);
    await fetchSubscription(d.token);
  };

  const register = async (data: RegisterData) => {
    const r = await fetch(`${AUTH_URL}?action=register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || "Ошибка регистрации");
  };

  const logout = async () => {
    if (token) {
      await fetch(`${AUTH_URL}?action=logout`, {
        method: "POST",
        headers: { "X-Auth-Token": token },
      }).catch(() => {});
    }
    localStorage.removeItem("auth_token");
    setToken(null);
    setUser(null);
    setSubscription(null);
  };

  const refreshSubscription = async () => {
    if (token) await fetchSubscription(token);
  };

  const hasAccess =
    !!user && (
      user.role === "owner" ||
      user.role === "admin" ||
      (!!subscription && subscription.status === "active")
    );

  return (
    <AuthContext.Provider value={{ user, token, subscription, hasAccess, loading, subLoading, login, register, logout, refreshSubscription }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}