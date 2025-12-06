'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './Button';

interface SessionExpiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
  returnUrl?: string;
}

export default function SessionExpiredModal({
  isOpen,
  onClose,
  onLogin,
  returnUrl,
}: SessionExpiredModalProps) {
  const router = useRouter();

  useEffect(() => {
    // 當 modal 開啟時，儲存 returnUrl
    if (isOpen && returnUrl && typeof window !== 'undefined') {
      localStorage.setItem('returnUrl', returnUrl);
    }
  }, [isOpen, returnUrl]);

  const handleLogin = () => {
    // 儲存當前頁面 URL（如果還沒儲存）
    if (!returnUrl && typeof window !== 'undefined') {
      const currentPath = window.location.pathname + window.location.search;
      localStorage.setItem('returnUrl', currentPath);
    }
    
    onLogin();
  };

  const handleLater = () => {
    onClose();
    // 可選擇導向首頁
    router.push('/');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">⏰</span>
          </div>
          <h3 className="ml-4 text-xl font-bold text-[#20263e]">
            登入已逾時
          </h3>
        </div>

        <p className="text-gray-700 mb-6">
          如需操作功能，需重新登入。登入成功後將自動回到原本頁面。
        </p>

        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={handleLater}
            className="min-w-[100px]"
          >
            稍後
          </Button>
          <Button
            variant="primary"
            onClick={handleLogin}
            className="min-w-[100px]"
          >
            重新登入
          </Button>
        </div>
      </div>
    </div>
  );
}

