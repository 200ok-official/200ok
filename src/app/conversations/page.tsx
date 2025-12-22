'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { apiGet, clearAuth, isAuthenticated } from '@/lib/api';

interface Conversation {
  id: string;
  type: 'direct' | 'project_proposal';
  is_unlocked: boolean;
  initiator_paid: boolean;
  recipient_paid: boolean;
  created_at: string;
  updated_at: string;
  initiator: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  recipient: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  project?: {
    id: string;
    title: string;
  };
  last_message?: {
    content: string;
    created_at: string;
  } | null;
  unread_count?: number;
}

export default function ConversationsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // 檢查登入狀態（NextAuth 或 localStorage）
    if (status === 'authenticated' && session?.user) {
      setUserId((session.user as any).id);
      fetchConversations();
    } else if (status !== 'loading') {
      // 檢查 localStorage
      const token = localStorage.getItem('access_token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUserId(parsedUser.id);
          fetchConversations();
        } catch (e) {
          console.error('Failed to parse user data:', e);
          router.push('/login');
        }
      } else {
        router.push('/login');
      }
    }
  }, [status, session, router]);

  const fetchConversations = async () => {
    try {
      if (!isAuthenticated()) {
        router.push('/login');
        return;
      }

      const { data } = await apiGet('/api/v1/conversations');
      setConversations(data);
    } catch (error: any) {
      console.error('Failed to fetch conversations:', error);
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        clearAuth();
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading || (status === 'loading' && !userId)) {
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

  const getOtherUser = (conv: Conversation) => {
    return conv.initiator.id === userId ? conv.recipient : conv.initiator;
  };

  const isInitiator = (conv: Conversation) => {
    return conv.initiator.id === userId;
  };

  // 處理訊息預覽：移除 Markdown 語法並截取前幾個字
  const getMessagePreview = (content: string, maxLength: number = 50): string => {
    if (!content) return '';
    
    // 移除 Markdown 語法
    let text = content
      .replace(/^#+\s+/gm, '') // 移除標題
      .replace(/\*\*(.*?)\*\*/g, '$1') // 移除粗體
      .replace(/\*(.*?)\*/g, '$1') // 移除斜體
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // 移除連結，保留文字
      .replace(/`([^`]+)`/g, '$1') // 移除行內代碼
      .replace(/```[\s\S]*?```/g, '') // 移除代碼塊
      .replace(/^\|.*\|$/gm, '') // 移除表格行
      .replace(/^-\s+/gm, '') // 移除列表符號
      .replace(/^\d+\.\s+/gm, '') // 移除有序列表
      .replace(/\n+/g, ' ') // 將換行轉為空格
      .trim();
    
    // 截取指定長度
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    }
    return text;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f3ed]">
      <Navbar />

      <main className="flex-1 py-10">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-[#20263e] mb-8">我的對話</h1>

          {conversations.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500 mb-4">目前沒有任何對話</p>
              <p className="text-sm text-gray-400">
                提交提案或開啟直接聯絡後，對話會出現在這裡
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {conversations.map((conv) => {
                const otherUser = getOtherUser(conv);
                const lastMessage = conv.last_message;
                const isConvInitiator = isInitiator(conv);
                const needsUnlock = conv.type === 'project_proposal' && !conv.recipient_paid && !isConvInitiator;

                return (
                  <Card
                    key={conv.id}
                    className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => {
                      router.push(`/conversations/${conv.id}`);
                      // 觸發未讀數量更新事件
                      setTimeout(() => {
                        window.dispatchEvent(new Event('unread-count-updated'));
                      }, 1000);
                    }}
                  >
                    <div className="flex items-start gap-4">
                      {/* 頭像 */}
                      <div className="flex-shrink-0 relative">
                        {otherUser.avatar_url ? (
                          <img
                            src={otherUser.avatar_url}
                            alt={otherUser.name}
                            className="w-14 h-14 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-[#20263e] text-white flex items-center justify-center text-xl font-bold">
                            {otherUser.name[0]}
                          </div>
                        )}
                        {/* 未讀訊息藍點 */}
                        {(conv.unread_count ?? 0) > 0 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                            <span className="text-xs font-bold text-white">
                              {(conv.unread_count ?? 0) > 99 ? '99+' : (conv.unread_count ?? 0)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 對話資訊 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-[#20263e] text-lg">
                            {otherUser.name}
                          </h3>
                          <Badge
                            variant={conv.type === 'direct' ? 'info' : 'default'}
                            className="text-xs"
                          >
                            {conv.type === 'direct' ? '直接聯絡' : '提案聯絡'}
                          </Badge>
                          {/* 狀態標籤 - 互斥顯示 */}
                          {conv.is_unlocked ? (
                            <Badge variant="success" className="text-xs">
                              ✓ 已解鎖
                            </Badge>
                          ) : needsUnlock ? (
                            <Badge variant="warning" className="text-xs">
                              🔒 待解鎖
                            </Badge>
                          ) : conv.type === 'project_proposal' && isConvInitiator ? (
                            <Badge variant="info" className="text-xs">
                              ⏳ 等待回應
                            </Badge>
                          ) : null}
                        </div>

                        {conv.project && (
                          <p className="text-sm text-gray-600 mb-2">
                            案件：{conv.project.title}
                          </p>
                        )}

                        {lastMessage ? (
                          <div className="flex items-center gap-2">
                            <p className={`text-sm truncate flex-1 ${(conv.unread_count ?? 0) > 0 ? 'text-[#20263e] font-semibold' : 'text-gray-500'}`} title={lastMessage.content}>
                              {getMessagePreview(lastMessage.content, 50)}
                            </p>
                            {(conv.unread_count ?? 0) > 0 && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 italic">
                            尚無訊息
                          </p>
                        )}
                      </div>

                      {/* 時間 */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-gray-400">
                          {lastMessage?.created_at 
                            ? new Date(lastMessage.created_at).toLocaleString('zh-TW', {
                                month: 'numeric',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : new Date(conv.updated_at).toLocaleString('zh-TW', {
                                month: 'numeric',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                          }
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

