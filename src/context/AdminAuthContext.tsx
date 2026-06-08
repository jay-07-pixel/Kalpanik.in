import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ADMIN_TOKEN_KEY, adminApi } from "../constants/admin";

interface AdminAuthContextValue {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(ADMIN_TOKEN_KEY);
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(!!token);

  const logout = useCallback(() => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    setToken(null);
  }, []);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    fetch(adminApi("/me"), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("invalid");
      })
      .catch(() => {
        if (!cancelled) logout();
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, logout]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(adminApi("/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok || !data.success || !data.token) {
      return {
        success: false,
        message: data.message ?? "Invalid email or password.",
      };
    }

    localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
    setToken(data.token);
    return { success: true };
  }, []);

  const value = useMemo(
    () => ({
      token,
      isAuthenticated: !!token,
      isLoading,
      login,
      logout,
    }),
    [token, isLoading, login, logout]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
