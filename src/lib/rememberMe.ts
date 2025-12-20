interface RememberMeData {
  email: string;
  expiresAt: number; // timestamp (毫秒)
}

const REMEMBER_ME_KEY = 'remember_me_data';
const REMEMBER_ME_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 天（毫秒）

/**
 * 儲存記住我資料（email + 過期時間）
 */
export function saveRememberMe(email: string): void {
  if (typeof window === 'undefined') return;
  
  const data: RememberMeData = {
    email,
    expiresAt: Date.now() + REMEMBER_ME_DURATION,
  };
  
  try {
    localStorage.setItem(REMEMBER_ME_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save remember me data:', error);
  }
}

/**
 * 讀取記住我資料，如果過期則自動清除並回傳 null
 */
export function getRememberMe(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const dataStr = localStorage.getItem(REMEMBER_ME_KEY);
    if (!dataStr) return null;

    const data: RememberMeData = JSON.parse(dataStr);
    
    // 檢查是否過期
    if (Date.now() > data.expiresAt) {
      clearRememberMe();
      return null;
    }

    return data.email;
  } catch (error) {
    console.error('Failed to parse remember me data:', error);
    clearRememberMe();
    return null;
  }
}

/**
 * 清除記住我資料
 */
export function clearRememberMe(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(REMEMBER_ME_KEY);
  } catch (error) {
    console.error('Failed to clear remember me data:', error);
  }
}

