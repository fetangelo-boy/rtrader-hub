import { useState } from "react";

const TOKEN_KEY = "rtrader_admin_token";
const USERNAME_KEY = "rtrader_admin_username";
const AUTH_URL = "https://functions.poehali.dev/2c438a15-2b16-4025-b518-29abd4812fc7";

export function useAdminAuth() {
  const [isAuthed, setIsAuthed] = useState<boolean>(() => {
    return !!localStorage.getItem(TOKEN_KEY);
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = async (username: string, password: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${AUTH_URL}?action=login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USERNAME_KEY, data.username || username);
        setIsAuthed(true);
      } else {
        setError("Неверный логин или пароль");
      }
    } catch {
      setError("Ошибка соединения");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
    setIsAuthed(false);
    if (token) {
      fetch(`${AUTH_URL}?action=logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      }).catch(() => {});
    }
  };

  return { isAuthed, login, logout, loading, error };
}

export function getAdminToken(): string {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function getAdminUsername(): string {
  return localStorage.getItem(USERNAME_KEY) || "";
}

export function useIsAdminAuthed(): boolean {
  return !!localStorage.getItem(TOKEN_KEY);
}
