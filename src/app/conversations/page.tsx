'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

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
  }[];
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
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/v1/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const { data } = await response.json();
        setConversations(data);
      } else if (response.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        router.push('/login');
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
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
                const lastMessage = conv.last_message?.[0];
                const needsUnlock = conv.type === 'project_proposal' && !conv.recipient_paid && !isInitiator(conv);

                return (
                  <Card
                    key={conv.id}
                    className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => router.push(`/conversations/${conv.id}`)}
                  >
                    <div className="flex items-start gap-4">
                      {/* 頭像 */}
                      <div className="flex-shrink-0">
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
                          {needsUnlock && (
                            <Badge variant="warning" className="text-xs">
                              🔒 待解鎖
                            </Badge>
                          )}
                          {conv.is_unlocked && (
                            <Badge variant="success" className="text-xs">
                              ✓ 已解鎖
                            </Badge>
                          )}
                        </div>

                        {conv.project && (
                          <p className="text-sm text-gray-600 mb-2">
                            案件：{conv.project.title}
                          </p>
                        )}

                        {lastMessage ? (
                          <p className="text-sm text-gray-500 truncate">
                            {lastMessage.content}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-400 italic">
                            尚無訊息
                          </p>
                        )}
                      </div>

                      {/* 時間 */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-gray-400">
                          {new Date(conv.updated_at).toLocaleString('zh-TW', {
                            month: 'numeric',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
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

