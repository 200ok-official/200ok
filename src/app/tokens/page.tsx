'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { TokenPurchaseModal } from '@/components/tokens/TokenPurchaseModal';

interface TokenBalance {
  balance: number;
  total_earned: number;
  total_spent: number;
}

interface Transaction {
  id: string;
  amount: number;
  balance_after: number;
  transaction_type: string;
  description: string;
  created_at: string;
}

export default function TokensPage() {
  const router = useRouter();
  const [balance, setBalance] = useState<TokenBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  useEffect(() => {
    // 檢查登入狀態
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchTokenData();
  }, [router]);

  const handlePurchase = async (amount: number) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/v1/tokens/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ amount }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`✅ ${data.message || '購買成功！'}\n\n實際獲得：${data.data.total_received} 代幣\n當前餘額：${data.data.new_balance} 代幣`);
        // 重新載入代幣資料
        await fetchTokenData();
      } else {
        throw new Error(data.message || '購買失敗');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('購買失敗，請稍後再試');
      throw error;
    }
  };

  const fetchTokenData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error('No access token found');
        router.push('/login');
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
      };

      // 取得餘額
      const balanceResponse = await fetch('/api/v1/tokens/balance', { headers });
      if (balanceResponse.ok) {
        const { data } = await balanceResponse.json();
        setBalance(data);
      } else if (balanceResponse.status === 401) {
        // Token 無效，清除並導向登入
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        router.push('/login');
        return;
      }

      // 取得交易記錄
      const transactionsResponse = await fetch('/api/v1/tokens/transactions?limit=20', { headers });
      if (transactionsResponse.ok) {
        const { data } = await transactionsResponse.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error('Failed to fetch token data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionTypeText = (type: string, relatedUserName?: string) => {
    const types: { [key: string]: string } = {
      unlock_direct_contact: relatedUserName ? `解鎖與 ${relatedUserName} 的聯絡` : '解鎖直接聯絡',
      submit_proposal: relatedUserName ? `向 ${relatedUserName} 提交提案` : '提交提案',
      view_proposal: relatedUserName ? `查看 ${relatedUserName} 的提案` : '查看提案',
      refund: '提案退款',
      platform_fee: '平台贈送',
    };
    return types[type] || type;
  };

  const getTransactionColor = (amount: number) => {
    return amount > 0 ? 'text-green-600' : 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f5f3ed]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-[#20263e]">載入中...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f3ed]">
      <Navbar />

      <main className="flex-1 py-10">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-[#20263e] mb-8">代幣管理</h1>

          {/* 餘額卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6 bg-gradient-to-br from-[#20263e] to-[#2d3550] text-white">
              <div className="text-sm opacity-80 mb-2">目前餘額</div>
              <div className="text-4xl font-bold mb-2">
                {balance?.balance.toLocaleString() || 0}
              </div>
              <div className="text-sm opacity-80">代幣</div>
            </Card>

            <Card className="p-6">
              <div className="text-sm text-gray-600 mb-2">累計獲得</div>
              <div className="text-3xl font-bold text-green-600 mb-2">
                +{balance?.total_earned.toLocaleString() || 0}
              </div>
              <div className="text-sm text-gray-500">代幣</div>
            </Card>

            <Card className="p-6">
              <div className="text-sm text-gray-600 mb-2">累計消費</div>
              <div className="text-3xl font-bold text-red-600 mb-2">
                -{balance?.total_spent.toLocaleString() || 0}
              </div>
              <div className="text-sm text-gray-500">代幣</div>
            </Card>
          </div>

          {/* 加值按鈕（目前為模擬） */}
          <Card className="p-6 mb-8 bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#20263e] mb-2">需要更多代幣？</h3>
                <p className="text-sm text-gray-600">購買代幣以解鎖更多功能</p>
              </div>
              <Button 
                onClick={() => setShowPurchaseModal(true)}
                className="bg-gradient-to-r from-[#20263e] to-[#3a4158] hover:from-[#2a3250] hover:to-[#4a5168]"
              >
                💳 購買代幣
              </Button>
            </div>
          </Card>

          {/* 交易記錄 */}
          <Card className="p-6">
            <h2 className="text-xl font-bold text-[#20263e] mb-6">交易記錄</h2>

            {transactions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                尚無交易記錄
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction: any) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between py-4 border-b border-gray-200 last:border-b-0"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-medium text-[#20263e]">
                          {getTransactionTypeText(transaction.transaction_type, transaction.related_user_name)}
                        </span>
                        <Badge 
                          variant={transaction.amount > 0 ? 'success' : 'default'}
                          className="text-xs"
                        >
                          {transaction.transaction_type}
                        </Badge>
                      </div>
                      {transaction.description && (
                        <p className="text-sm text-gray-600">{transaction.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(transaction.created_at).toLocaleString('zh-TW')}
                      </p>
                    </div>

                    <div className="text-right ml-4">
                      <div className={`text-xl font-bold ${getTransactionColor(transaction.amount)}`}>
                        {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        餘額：{transaction.balance_after.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* 說明 */}
          <Card className="p-6 mt-8 bg-yellow-50 border-yellow-200">
            <h3 className="text-lg font-semibold text-[#20263e] mb-3">💡 如何使用代幣？</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 font-bold">•</span>
                <span><strong>直接聯絡（200 代幣）</strong> - 解鎖與其他使用者的聊天和聯絡資訊</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 font-bold">•</span>
                <span><strong>提交提案（100 代幣）</strong> - 工程師向案件提交提案，7日內無回應將退款</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 font-bold">•</span>
                <span><strong>查看提案（100 代幣）</strong> - 發案者查看工程師的提案並開啟對話</span>
              </li>
            </ul>
          </Card>
        </div>
      </main>

      <Footer />

      {/* 購買代幣彈窗 */}
      <TokenPurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        onPurchase={handlePurchase}
      />
    </div>
  );
}

