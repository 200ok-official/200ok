'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { apiGet } from '@/lib/api';

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
  const [hasSubmittedBid, setHasSubmittedBid] = useState(false);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    // 檢查用戶是否已經提交過提案
    const checkExistingBid = async () => {
      if (!clientUserId) {
        setLoading(false);
        return;
      }

      try {
        // 獲取用戶的所有提案
        const response = await apiGet('/api/v1/bids/me');
        if (response.success && response.data.bids) {
          // 檢查是否有針對此專案的提案
          const existingBid = response.data.bids.find(
            (bid: any) => bid.project_id === projectId
          );
          setHasSubmittedBid(!!existingBid);
        }
      } catch (error) {
        console.error('Failed to check existing bid:', error);
        // 發生錯誤時預設為 false，讓用戶可以嘗試提交
        setHasSubmittedBid(false);
      } finally {
        setLoading(false);
      }
    };

    checkExistingBid();
  }, [clientUserId, projectId]);

  const userId = clientUserId;

  const handleSubmitProposal = () => {
    router.push(`/projects/${projectId}/submit-proposal`);
  };

  if (loading) {
    return (
      <div className="w-full py-3 text-center text-gray-500">
        檢查提案狀態中...
      </div>
    );
  }

  return (
    <>
      {/* 投標按鈕區域 */}
      {!isOwner && userId && (
        <>
          {hasSubmittedBid ? (
            <div className="w-full">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-blue-600">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                  <p className="text-base font-semibold text-blue-900">您已對此案件發送過提案</p>
                </div>
                <p className="text-sm text-blue-700 mb-3">您可以在「我的提案」頁面查看提案狀態</p>
                <Button
                  onClick={() => router.push('/bids/me')}
                  variant="outline"
                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  查看我的提案
                </Button>
              </div>
            </div>
          ) : (
        <Button
          onClick={handleSubmitProposal}
          className="w-full shadow-md hover:shadow-lg transition-all bg-[#20263e] text-white hover:bg-white hover:text-[#20263e] border-2 border-[#20263e]"
        >
          提交提案
        </Button>
          )}
        </>
      )}
      
      {!userId && (
        <Button
          onClick={() => {
            // 儲存當前頁面，登入後返回
            localStorage.setItem('returnUrl', `/projects/${projectId}/submit-proposal`);
            router.push('/login');
          }}
          className="w-full shadow-md hover:shadow-lg transition-all"
          variant="secondary"
        >
          請先登入以提交提案
        </Button>
      )}
    </>
  );
}

