'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { apiGet, clearAuth as clearAuthUtil } from '@/lib/api';

export default function DebugAuthPage() {
  const [authInfo, setAuthInfo] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    const user = localStorage.getItem('user');

    setAuthInfo({
      hasToken: !!token,
      tokenLength: token?.length || 0,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'null',
      hasRefreshToken: !!refreshToken,
      user: user ? JSON.parse(user) : null,
    });
  }, []);

  const testAPI = async () => {
    try {
      const data = await apiGet('/api/v1/tokens/balance');
      alert(`API 回應:\n${JSON.stringify(data, null, 2)}`);
    } catch (error: any) {
      alert(`錯誤: ${error.message}`);
    }
  };

  const clearAuth = () => {
    clearAuthUtil();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#f5f3ed] p-8">
      <Card className="max-w-2xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-6">認證狀態 Debug</h1>

        {authInfo && (
          <div className="space-y-4">
            <div>
              <strong>有 Access Token:</strong> {authInfo.hasToken ? '是' : '否'}
            </div>
            <div>
              <strong>Token 長度:</strong> {authInfo.tokenLength}
            </div>
            <div>
              <strong>Token 預覽:</strong>
              <pre className="bg-gray-100 p-2 mt-1 text-xs overflow-x-auto">
                {authInfo.tokenPreview}
              </pre>
            </div>
            <div>
              <strong>有 Refresh Token:</strong> {authInfo.hasRefreshToken ? '是' : '否'}
            </div>
            <div>
              <strong>使用者資料:</strong>
              <pre className="bg-gray-100 p-2 mt-1 text-xs overflow-x-auto">
                {JSON.stringify(authInfo.user, null, 2)}
              </pre>
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <Button onClick={testAPI}>測試 API</Button>
          <Button onClick={clearAuth} variant="outline">
            清除認證
          </Button>
        </div>
      </Card>
    </div>
  );
}

