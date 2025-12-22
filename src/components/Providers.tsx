'use client';

import { useEffect } from 'react';
import { SessionProvider, useSession } from 'next-auth/react';

// Session 同步組件：負責將 NextAuth 的 session 同步到 localStorage
// 這樣做是因為我們的應用程式主要依賴 localStorage 中的 token 進行認證
function SessionSync() {
  const { data: session, status } = useSession();

  useEffect(() => {
    // 只在已登入且有 session 資料時執行
    if (status === 'authenticated' && session) {
      try {
        const sessionAny = session as any;
        const accessToken = sessionAny.accessToken;
        const refreshToken = sessionAny.refreshToken;
        const userAny = session.user as any;
        const userId = userAny?.id;
        const userEmail = session.user?.email;
        const userName = session.user?.name;
        const userRoles = userAny?.roles;
        const userAvatarUrl = userAny?.avatar_url;

        // 確保有必要的認證資訊
        if (accessToken && refreshToken && userId) {
          // 檢查 localStorage 中是否已經有相同的 token
          // 只有在沒有 token 或 token 不同時才更新，避免重複寫入和觸發事件
          const currentToken = localStorage.getItem('access_token');
          
          if (currentToken !== accessToken) {
            console.log('Syncing Google session to localStorage');
            
            // 將 tokens 和 user 資訊保存到 localStorage
            localStorage.setItem('access_token', accessToken);
            localStorage.setItem('refresh_token', refreshToken);
            localStorage.setItem('user', JSON.stringify({
              id: userId,
              email: userEmail,
              name: userName,
              roles: userRoles || [],
              avatar_url: userAvatarUrl || null,
            }));

            // 觸發登入成功事件，讓 Navbar 等組件知道要更新
            window.dispatchEvent(new CustomEvent('auth-changed'));
          }
        }
      } catch (error) {
        console.error('Error syncing session:', error);
      }
    }
  }, [session, status]);

  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 監聽自動登出事件（可用於追蹤或其他用途）
    const handleAutoLogout = (event: CustomEvent) => {
      console.log('User automatically logged out:', event.detail);
      // 可在此添加其他邏輯，例如清除 state、發送追蹤事件等
    };

    window.addEventListener('auto-logout', handleAutoLogout as EventListener);

    return () => {
      window.removeEventListener('auto-logout', handleAutoLogout as EventListener);
    };
  }, []);

  return (
    <SessionProvider>
      <SessionSync />
      {children}
    </SessionProvider>
  );
}
