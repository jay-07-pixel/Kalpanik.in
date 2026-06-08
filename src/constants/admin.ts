export const ADMIN_TOKEN_KEY = "kalpanik_admin_token";
export const ADMIN_LOGIN_PATH = "/admin";

export const API_BASE = import.meta.env.VITE_API_URL?.trim() || "";

export function adminApi(path: string): string {
  return `${API_BASE}/api/admin${path}`;
}

export function analyticsApi(path: string): string {
  return `${API_BASE}/api/analytics${path}`;
}
