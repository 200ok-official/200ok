'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

interface ProjectDetailClientProps {
  projectId: string;
  projectTitle: string;
  isOwner: boolean;
  userId?: string;
}

export default function ProjectDetailClient({ 
  projectId, 
  projectTitle, 
  isOwner, 
  userId: serverUserId 
}: ProjectDetailClientProps) {
  const router = useRouter();
  const [clientUserId, setClientUserId] = useState<string | undefined>(serverUserId);

  useEffect(() => {
    // 如果 Server Component 沒有提供 userId，嘗試從 localStorage 取得
    if (!serverUserId) {
      const token = localStorage.getItem('access_token');
      const userData = localStorage.getItem('user');
      if (token && userData) {
        try {
          const user = JSON.parse(userData);
          setClientUserId(user.id);
        } catch (e) {
          console.error('Failed to parse user data', e);
        }
      }
    }
  }, [serverUserId]);

  const userId = clientUserId;

  const handleSubmitProposal = () => {
    router.push(`/projects/${projectId}/submit-proposal`);
  };

  return (
    <>
      {/* 投標按鈕區域 */}
      {!isOwner && userId && (
        <Button
          onClick={handleSubmitProposal}
          className="w-full py-6 text-lg shadow-md hover:shadow-lg transition-all"
        >
          提交提案
        </Button>
      )}
      
      {!userId && (
        <Button
          onClick={() => {
            // 儲存當前頁面，登入後返回
            localStorage.setItem('returnUrl', `/projects/${projectId}/submit-proposal`);
            router.push('/login');
          }}
          className="w-full py-6 text-lg shadow-md hover:shadow-lg transition-all"
          variant="secondary"
        >
          請先登入以提交提案
        </Button>
      )}
    </>
  );
}

