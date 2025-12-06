/**
 * Session 管理工具函數
 */

// 處理 session 錯誤的工具函數
export function handleSessionError() {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('session-expired');
    window.dispatchEvent(event);
  }
}

// 檢查是否為 session 相關的錯誤
export function isSessionError(error: any): boolean {
  if (!error) return false;

  // 檢查 HTTP 狀態碼
  if (error.status === 401) return true;

  // 檢查錯誤訊息
  const message = error.message || error.error || '';
  const sessionErrorKeywords = [
    'unauthorized',
    'token',
    'session',
    'expired',
    'invalid',
    'login',
    '登入已逾時'
  ];

  return sessionErrorKeywords.some(keyword =>
    message.toLowerCase().includes(keyword.toLowerCase())
  );
}

// 儲存返回 URL
export function saveReturnUrl(url?: string) {
  if (typeof window === 'undefined') return;
  
  const returnUrl = url || window.location.pathname + window.location.search;
  localStorage.setItem('returnUrl', returnUrl);
}

// 取得並清除返回 URL
export function getAndClearReturnUrl(): string | null {
  if (typeof window === 'undefined') return null;
  
  const returnUrl = localStorage.getItem('returnUrl');
  if (returnUrl) {
    localStorage.removeItem('returnUrl');
  }
  return returnUrl;
}

/**
 * 觸發代幣餘額更新事件
 * 用於在代幣操作（購買、解鎖、提案）成功後通知 Navbar 更新
 */
export function triggerTokenBalanceUpdate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('token-balance-updated'));
  }
}
