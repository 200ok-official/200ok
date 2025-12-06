'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { SessionProvider } from 'next-auth/react';
import SessionExpiredModal from '@/components/ui/SessionExpiredModal';

export default function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [showSessionExpired, setShowSessionExpired] = useState(false);

  useEffect(() => {
    // 監聽 session expired 事件
    const handleSessionExpired = (event: CustomEvent) => {
      setShowSessionExpired(true);
    };

    window.addEventListener('session-expired', handleSessionExpired as EventListener);

    return () => {
      window.removeEventListener('session-expired', handleSessionExpired as EventListener);
    };
  }, []);

  const handleLogin = () => {
    setShowSessionExpired(false);
    router.push('/login');
  };

  const handleCloseModal = () => {
    setShowSessionExpired(false);
  };

  return (
    <SessionProvider>
      {children}
      <SessionExpiredModal
        isOpen={showSessionExpired}
        onClose={handleCloseModal}
        onLogin={handleLogin}
        returnUrl={pathname}
      />
    </SessionProvider>
  );
}

