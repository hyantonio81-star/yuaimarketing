/**
 * Attach auth to API requests using JWT Bearer only.
 * On 401, clears token/user and dispatches 'yuanto-401' for redirect to login.
 */
const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL?.trim())
  ? String(import.meta.env.VITE_API_BASE_URL).replace(/\/$/, '')
  : '/api/v1';

function getAuthHeaders(omitContentType = false) {
  const headers = {};
  try {
    const token = localStorage.getItem('yuanto_token');
    if (token && token.trim()) {
      headers['Authorization'] = `Bearer ${token.trim()}`;
    }
  } catch (_) {}
  if (!omitContentType) headers['Content-Type'] = 'application/json';
  return headers;
}

function clearAuthAndNotify() {
  try {
    localStorage.removeItem('yuanto_token');
    localStorage.removeItem('yuanto_user');
  } catch (_) {}
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('yuanto-401'));
}

export function fetchWithAuth(url, options = {}) {
  const fullUrl = url.startsWith('http') ? url : `${url.startsWith('/') ? '' : API_BASE + '/'}${url}`;
  const isFormData = options.body && options.body instanceof FormData;
  const headers = { ...getAuthHeaders(isFormData), ...(options.headers || {}) };
  return fetch(fullUrl, { ...options, headers }).then((res) => {
    if (res.status === 401) clearAuthAndNotify();
    return res;
  });
}

export function clearAuth() {
  clearAuthAndNotify();
}

/**
 * Same as fetchWithAuth but returns { ok, status, data } with data always an object (parsed JSON or fallback).
 * Use when you want to handle non-JSON error responses without throwing.
 */
export async function fetchWithAuthJson(url, options = {}) {
  const res = await fetchWithAuth(url, options);
  let data;
  try {
    data = await res.json();
  } catch (_) {
    data = { detail: res.statusText || 'Invalid response' };
  }
  if (typeof data !== 'object' || data === null) data = { detail: String(data) };
  return { ok: res.ok, status: res.status, data };
}

/**
 * fetchWithAuthJson with AbortController timeout (avoids infinite "Cargando…" if proxy/backend hangs).
 */
export async function fetchWithAuthJsonTimeout(url, timeoutMs = 30000, options = {}) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    return await fetchWithAuthJson(url, { ...options, signal: ac.signal });
  } catch (err) {
    const name = err && err.name;
    if (name === 'AbortError') {
      return { ok: false, status: 408, data: { detail: 'Request timed out' } };
    }
    return { ok: false, status: 0, data: { detail: err && err.message ? String(err.message) : 'Network error' } };
  } finally {
    clearTimeout(t);
  }
}

/**
 * Returns a user-facing error message for API responses. Pass the t() function from useLanguage.
 * Use after fetchWithAuthJson when !ok: setError(getApiErrorMessage(status, data, t) ?? t('api_connection_error')).
 */
export function getApiErrorMessage(status, data, t) {
  if (!t || typeof t !== 'function') return null;
  if (status === 401) return t('error_401');
  if (status === 403) return t('error_403');
  if (status >= 500 && data && typeof data.detail === 'string') return data.detail;
  if (status >= 500) return t('error_internal_server');
  if (data && typeof data.detail === 'string') return data.detail;
  return null;
}

export { API_BASE };
