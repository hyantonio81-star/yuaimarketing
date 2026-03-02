// 로컬 개발: 프록시 사용 → '/api/v1'. 배포(Vercel 등): VITE_API_URL 설정 시 해당 백엔드 사용
const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api/v1';
const API_ORIGIN = (import.meta.env.VITE_API_URL || '');

const TOKEN_KEY = 'factory_kpi_token';
export const REFRESH_KEY = 'factory_kpi_refresh_token';
const USER_KEY = 'factory_kpi_user';

function getAuthHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

export function setStoredTokens(accessToken, refreshToken) {
  if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken != null) localStorage.setItem(REFRESH_KEY, refreshToken);
}

async function refreshTokens() {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refresh }),
  });
  if (!res.ok) return null;
  return res.json();
}

async function fetchWithAuth(url, options = {}) {
  const headers = { ...getAuthHeaders(), ...(options.headers || {}) };
  let res = await fetch(url, { ...options, headers });
  if (res.status === 401 && getRefreshToken()) {
    const data = await refreshTokens().catch(() => null);
    if (data && data.access_token) {
      setStoredTokens(data.access_token, data.refresh_token);
      res = await fetch(url, { ...options, headers: { ...headers, Authorization: `Bearer ${data.access_token}` } });
    }
  }
  return res;
}

export function clearAuthStorage() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

/** 서버 상태 확인 (DB 연결 여부). 로그인 페이지에서 db_connected === false 시 안내용. */
export async function getHealth() {
  try {
    const res = await fetch(API_ORIGIN + '/api/v1/health');
    if (!res.ok) return { status: 'error', db_connected: false, mode: 'unknown' };
    return res.json();
  } catch (_) {
    return { status: 'error', db_connected: false, mode: 'unknown' };
  }
}

/** 서버에 refresh token 무효화 요청 (로그아웃 시 호출). */
export async function apiLogout() {
  const refresh = getRefreshToken();
  if (refresh) {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refresh }),
      });
    } catch (_) {}
  }
}

async function handleResponse(res) {
  if (res.status === 401) {
    clearAuthStorage();
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new Error('인증이 만료되었습니다. 다시 로그인하세요.');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = Array.isArray(err.detail) ? err.detail[0] : err.detail;
    throw new Error(msg || res.statusText || '요청 실패');
  }
  return res.json();
}

export async function login(username, password) {
  const form = new URLSearchParams();
  form.append('username', username);
  form.append('password', password);
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });
  const data = await handleResponse(res);
  if (data.refresh_token) setStoredTokens(data.access_token, data.refresh_token);
  return data;
}

export async function getMe() {
  const res = await fetchWithAuth(`${API_BASE}/auth/me`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function getDashboard() {
  const res = await fetchWithAuth(`${API_BASE}/kpi/dashboard`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function getFactorySummary() {
  const res = await fetchWithAuth(`${API_BASE}/kpi/factory-summary`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function getDepartmentKpi(deptId) {
  const res = await fetchWithAuth(`${API_BASE}/kpi/department/${deptId}`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function getMyTasks() {
  const res = await fetchWithAuth(`${API_BASE}/tasks/my`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function updateTaskExecute(taskId, done) {
  const res = await fetchWithAuth(`${API_BASE}/tasks/${taskId}/execute`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ done }),
  });
  return handleResponse(res);
}

// Admin (gm/director)
export async function getAdminDepartments() {
  const res = await fetchWithAuth(`${API_BASE}/admin/departments`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function createDepartment(body) {
  const res = await fetchWithAuth(`${API_BASE}/admin/departments`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function updateDepartment(deptId, body) {
  const res = await fetchWithAuth(`${API_BASE}/admin/departments/${deptId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

export async function deleteDepartment(deptId) {
  const res = await fetchWithAuth(`${API_BASE}/admin/departments/${deptId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

export async function getPipeline() {
  const res = await fetchWithAuth(`${API_BASE}/admin/pipeline`, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function updatePipelineOrder(deptIds) {
  const res = await fetchWithAuth(`${API_BASE}/admin/pipeline`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ dept_ids: deptIds }),
  });
  return handleResponse(res);
}
