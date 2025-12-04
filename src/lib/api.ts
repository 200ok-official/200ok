/**
 * 統一的 API Client
 * 所有前端的 API 呼叫都應該通過這個 client
 */

// API Base URL（從環境變數讀取）
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

/**
 * 取得完整的 API URL
 */
export function getApiUrl(path: string): string {
  // 確保 path 以 / 開頭
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

/**
 * 取得認證 headers
 */
export function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

/**
 * 統一的 API fetch 函數
 * @param path API 路徑（例如：'/api/v1/projects'）
 * @param options fetch 選項
 * @returns Promise<Response>
 */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const url = getApiUrl(path);
  
  // 合併 headers
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  };
  
  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * API fetch with JSON response
 * @param path API 路徑
 * @param options fetch 選項
 * @returns Promise<T>
 */
export async function apiFetchJson<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await apiFetch(path, options);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || error.message || `HTTP ${response.status}`);
  }
  
  return response.json();
}

/**
 * GET 請求
 */
export async function apiGet<T = any>(path: string, params?: Record<string, string>): Promise<T> {
  const url = params
    ? `${path}?${new URLSearchParams(params).toString()}`
    : path;
  
  return apiFetchJson<T>(url, {
    method: 'GET',
  });
}

/**
 * POST 請求
 */
export async function apiPost<T = any>(path: string, body?: any): Promise<T> {
  return apiFetchJson<T>(path, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * PUT 請求
 */
export async function apiPut<T = any>(path: string, body?: any): Promise<T> {
  return apiFetchJson<T>(path, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * PATCH 請求
 */
export async function apiPatch<T = any>(path: string, body?: any): Promise<T> {
  return apiFetchJson<T>(path, {
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * DELETE 請求
 */
export async function apiDelete<T = any>(path: string): Promise<T> {
  return apiFetchJson<T>(path, {
    method: 'DELETE',
  });
}

/**
 * 處理 token 刷新
 */
export async function refreshAccessToken(): Promise<string | null> {
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token');
    }
    
    const response = await apiFetch('/api/v1/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }
    
    const data = await response.json();
    const newAccessToken = data.data.access_token;
    
    localStorage.setItem('access_token', newAccessToken);
    return newAccessToken;
  } catch (error) {
    console.error('Token refresh failed:', error);
    // 清除所有認證資訊
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    return null;
  }
}

/**
 * 檢查是否已登入
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('access_token');
}

/**
 * 登出（清除本地認證資訊）
 */
export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
}

// Export API_BASE_URL for direct use if needed
export { API_BASE_URL };

