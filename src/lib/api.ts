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
  // 移除 path 開頭的斜線
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  // 移除 base url 結尾的斜線
  const cleanBaseUrl = API_BASE_URL.endsWith('/') 
    ? API_BASE_URL.substring(0, API_BASE_URL.length - 1) 
    : API_BASE_URL;
    
  return `${cleanBaseUrl}/${cleanPath}`;
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
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    
    // 處理 422 Validation Error（包含欄位特定的錯誤）
    // 後端格式：error.detail.errors = [{field: "body -> email", message: "...", type: "..."}]
    if (response.status === 422 && error.detail?.errors && Array.isArray(error.detail.errors)) {
      // 將欄位錯誤組合成易讀的訊息
      const fieldErrors: string[] = [];
      
      // 欄位名稱對應的中文
      const fieldNameMap: Record<string, string> = {
        'email': '電子郵件',
        'password': '密碼',
        'name': '姓名',
        'phone': '手機號碼',
        'full_name': '全名',
        'role': '角色',
      };
      
      error.detail.errors.forEach((err: any) => {
        // 從 "body -> email" 中提取欄位名稱
        const fieldMatch = err.field?.match(/-> (\w+)$/);
        const fieldKey = fieldMatch ? fieldMatch[1] : err.field;
        const fieldName = fieldNameMap[fieldKey] || fieldKey || '欄位';
        const rawMessage = err.message || '格式錯誤';
        
        // 將技術性錯誤訊息轉換為友善的中文
        let friendlyMessage = rawMessage;
        
        // Email 驗證錯誤
        if (rawMessage.includes('not a valid email') || rawMessage.includes('@-sign')) {
          friendlyMessage = '請輸入有效的電子郵件格式（例如：example@mail.com）';
        }
        // 必填欄位
        else if (rawMessage.includes('field required') || rawMessage.includes('missing')) {
          friendlyMessage = '此欄位為必填';
        }
        // 字串長度
        else if (rawMessage.includes('at least') && rawMessage.includes('characters')) {
          const minLength = rawMessage.match(/\d+/)?.[0];
          friendlyMessage = minLength ? `至少需要 ${minLength} 個字元` : '字元數不足';
        }
        else if (rawMessage.includes('at most') && rawMessage.includes('characters')) {
          const maxLength = rawMessage.match(/\d+/)?.[0];
          friendlyMessage = maxLength ? `最多 ${maxLength} 個字元` : '字元數過多';
        }
        // 密碼強度
        else if (rawMessage.includes('password') && (rawMessage.includes('weak') || rawMessage.includes('strong'))) {
          friendlyMessage = '密碼強度不足，請使用至少 8 個字元，包含大小寫字母和數字';
        }
        // 數值範圍
        else if (rawMessage.includes('greater than')) {
          friendlyMessage = '數值過小';
        }
        else if (rawMessage.includes('less than')) {
          friendlyMessage = '數值過大';
        }
        
        fieldErrors.push(`${fieldName}：${friendlyMessage}`);
      });
      
      // 如果有欄位錯誤，優先顯示欄位錯誤
      if (fieldErrors.length > 0) {
        throw new Error(fieldErrors.join('\n'));
      }
    }
    
    // 取得錯誤訊息（優先使用 message，因為 detail 可能是物件）
    let errorMessage: string;
    if (typeof error.detail === 'string') {
      errorMessage = error.detail;
    } else if (typeof error.error === 'string') {
      errorMessage = error.error;
    } else if (typeof error.message === 'string') {
      errorMessage = error.message;
    } else {
      errorMessage = `HTTP ${response.status}`;
    }
    
    // 處理 401 Unauthorized
    if (response.status === 401) {
      // 檢查是否為登入相關的 API（登入/註冊時不應該顯示「登入逾時」）
      const isAuthEndpoint = path.includes('/auth/login') || path.includes('/auth/register');
      
      // 如果是登入/註冊 API，使用後端的錯誤訊息
      if (isAuthEndpoint) {
        throw new Error(errorMessage);
      }
      
      // 如果是其他 API 的 401（表示已登入但 token 過期），自動登出
      if (typeof window !== 'undefined') {
        // 清除認證資訊
        clearAuth();
        
        // 靜默導向首頁（不顯示彈窗）
        window.location.href = '/';
        
        // 觸發自動登出事件（可用於更新 UI 狀態）
        window.dispatchEvent(new CustomEvent('auto-logout', {
          detail: { reason: 'token_expired' }
        }));
      }
      
      // 不拋出錯誤，避免顯示錯誤訊息
      return Promise.reject(new Error('Token expired'));
    }
    
    throw new Error(errorMessage);
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
 * 
 * 注意：不清除 remember_me_data，讓使用者下次登入時仍能自動填入 email
 * 如果需要在登出時也清除「記住我」，請取消註解下方的 clearRememberMe() 呼叫
 */
export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  
  // 保留「記住我」的 email（推薦）
  // 如果想在登出時也清除記住的 email，取消下一行的註解：
  // clearRememberMe();
}

// Export API_BASE_URL for direct use if needed
export { API_BASE_URL };

