'use client';

import { useEffect } from 'react';
import { SessionProvider } from 'next-auth/react';

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
      {children}
    </SessionProvider>
  );
}

