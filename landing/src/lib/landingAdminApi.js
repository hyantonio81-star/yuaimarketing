/**
 * Tienda 운영자 API: 로그인·제품 목록·생성·수정·삭제.
 * API_BASE + /api/landing, 인증 시 Authorization: Bearer <token>
 */
import { API_BASE } from "./config";

const TOKEN_KEY = "landing_admin_token";
const base = () => (API_BASE ? `${API_BASE}/api/landing` : "/api/landing");

export function getAdminToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

export function setAdminToken(token) {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch (_) {}
}

export function removeAdminToken() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch (_) {}
}

function authHeaders() {
  const token = getAdminToken();
  const h = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

export async function login(password) {
  const res = await fetch(`${base()}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: String(password).trim() }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 503 && data.error === "admin_password_not_configured") {
      return {
        ok: false,
        error: data.message || data.error,
        code: "admin_password_not_configured",
      };
    }
    return { ok: false, error: data.message || data.error || "Login failed" };
  }
  return { ok: true, token: data.token };
}

export async function fetchProductList() {
  const res = await fetch(`${base()}/dr-products/admin/list`, { headers: authHeaders() });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) return { ok: false, unauthorized: true };
  if (!res.ok) return { ok: false, error: data.error || "Failed to load" };
  return { ok: true, products: data.products ?? [] };
}

export async function createProduct(body) {
  const res = await fetch(`${base()}/dr-products/admin`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) return { ok: false, unauthorized: true };
  if (!res.ok) return { ok: false, error: data.error || "Create failed" };
  return { ok: true, product: data };
}

export async function updateProduct(id, body) {
  const res = await fetch(`${base()}/dr-products/admin/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) return { ok: false, unauthorized: true };
  if (!res.ok) return { ok: false, error: data.error || "Update failed" };
  return { ok: true, product: data };
}

export async function deleteProduct(id) {
  const res = await fetch(`${base()}/dr-products/admin/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (res.status === 401) return { ok: false, unauthorized: true };
  if (res.status !== 204 && !res.ok) {
    const data = await res.json().catch(() => ({}));
    return { ok: false, error: data.error || "Delete failed" };
  }
  return { ok: true };
}

/**
 * Ensures error is always a string.
 */
export function getErrorMessage(error) {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (typeof error === "object") {
    return error.message || error.error || JSON.stringify(error);
  }
  return String(error);
}
