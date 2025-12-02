'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { confirmPayment, paymentPresets } from '@/utils/paymentConfirm';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

interface Conversation {
  id: string;
  type: 'direct' | 'project_proposal';
  is_unlocked: boolean;
  initiator_paid: boolean;
  recipient_paid: boolean;
  initiator_id: string;
  recipient_id: string;
  initiator: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    avatar_url?: string;
  };
  recipient: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    avatar_url?: string;
  };
  project?: {
    id: string;
    title: string;
  };
}

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 檢查登入狀態（NextAuth 或 localStorage）
    if (status === 'authenticated' && session?.user) {
      setUserId((session.user as any).id);
      fetchConversation();
      fetchMessages();
    } else if (status !== 'loading') {
      // 檢查 localStorage
      const token = localStorage.getItem('access_token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUserId(parsedUser.id);
          fetchConversation();
          fetchMessages();
        } catch (e) {
          console.error('Failed to parse user data:', e);
          router.push('/login');
        }
      } else {
        router.push('/login');
      }
    }
  }, [status, session, params.id, router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversation = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/v1/conversations/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const { data } = await response.json();
        setConversation(data);
      } else if (response.status === 401) {
        alert('登入已過期，請重新登入');
        router.push('/login');
      } else {
        alert('無法載入對話');
        router.push('/conversations');
      }
    } catch (error) {
      console.error('Failed to fetch conversation:', error);
      alert('載入對話失敗');
      router.push('/conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(`/api/v1/conversations/${params.id}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const { data } = await response.json();
        setMessages(data);
      } else if (response.status === 401) {
        console.error('Token expired');
        router.push('/login');
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleUnlock = async () => {
    if (!conversation) return;

    const otherUser = getOtherUser();
    const confirmed = await confirmPayment(
      paymentPresets.viewProposal(otherUser.name)
    );

    if (!confirmed) return;

    setUnlocking(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        alert('請先登入');
        router.push('/login');
        return;
      }

      const response = await fetch('/api/v1/conversations/unlock-proposal', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ conversation_id: conversation.id }),
      });

      if (response.ok) {
        alert('✅ 提案已解鎖！已扣除 100 代幣');
        fetchConversation();
        fetchMessages();
      } else {
        const error = await response.json();
        alert(`❌ 解鎖失敗：${error.message}`);
      }
    } catch (error) {
      alert('解鎖失敗，請稍後再試');
    } finally {
      setUnlocking(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        alert('請先登入');
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/v1/conversations/${params.id}/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newMessage }),
      });

      if (response.ok) {
        setNewMessage('');
        fetchMessages();
      } else if (response.status === 401) {
        alert('登入已過期，請重新登入');
        router.push('/login');
      } else {
        const error = await response.json();
        alert(`❌ 發送失敗：${error.error || '未知錯誤'}`);
      }
    } catch (error: any) {
      alert(`❌ 發送失敗：${error.message || '請稍後再試'}`);
    } finally {
      setSending(false);
    }
  };

  if (loading || (status === 'loading' && !userId) || !conversation) {
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
  const isInitiator = conversation.initiator_id === userId;
  const otherUser = getOtherUser();
  const needsUnlock = conversation.type === 'project_proposal' && !conversation.recipient_paid && !isInitiator;
  const canSend = conversation.is_unlocked || (conversation.type === 'project_proposal' && isInitiator && messages.length === 0);

  function getOtherUser() {
    return isInitiator ? conversation!.recipient : conversation!.initiator;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f3ed]">
      <Navbar />

      <main className="flex-1 py-6">
        <div className="max-w-5xl mx-auto px-4 h-full flex flex-col">
          {/* 標題欄 */}
          <Card className="p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/conversations')}
                  className="text-[#c5ae8c] hover:text-[#20263e]"
                >
                  ← 返回
                </button>
                {otherUser.avatar_url ? (
                  <img
                    src={otherUser.avatar_url}
                    alt={otherUser.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#20263e] text-white flex items-center justify-center text-lg font-bold">
                    {otherUser.name[0]}
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold text-[#20263e]">{otherUser.name}</h2>
                  {conversation.project && (
                    <p className="text-sm text-gray-600">案件：{conversation.project.title}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={conversation.type === 'direct' ? 'info' : 'default'}>
                  {conversation.type === 'direct' ? '直接聯絡' : '提案聯絡'}
                </Badge>
                {conversation.is_unlocked && (
                  <Badge variant="success">✓ 已解鎖</Badge>
                )}
              </div>
            </div>
          </Card>

          {/* 聯絡資訊（已解鎖） */}
          {conversation.is_unlocked && (otherUser.email || otherUser.phone) && (
            <Card className="p-4 mb-4 bg-blue-50 border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">📞 聯絡資訊</h3>
              <div className="text-sm text-blue-800 space-y-1">
                {otherUser.email && <p>Email：{otherUser.email}</p>}
                {otherUser.phone && <p>電話：{otherUser.phone}</p>}
              </div>
            </Card>
          )}

          {/* 解鎖提示（提案對話，發案者未付費） */}
          {needsUnlock && (
            <Card className="p-6 mb-4 bg-yellow-50 border-yellow-200">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                  🔒 此提案尚未解鎖
                </h3>
                <p className="text-sm text-yellow-800 mb-4">
                  解鎖後可查看完整提案內容、開通聊天功能，並查看對方聯絡資訊
                </p>
                <Button
                  onClick={handleUnlock}
                  disabled={unlocking}
                  className="mx-auto"
                >
                  {unlocking ? '解鎖中...' : '解鎖提案 (100 代幣)'}
                </Button>
              </div>
            </Card>
          )}

          {/* 等待回應提示（工程師發送提案後） */}
          {conversation.type === 'project_proposal' && isInitiator && !conversation.recipient_paid && (
            <Card className="p-4 mb-4 bg-blue-50 border-blue-200">
              <div className="text-center">
                <p className="text-sm text-blue-800">
                  ⏳ 提案已發送，等待發案者回應...
                  <br />
                  <span className="text-xs text-blue-600">
                    7日內無回應將自動退回 100 代幣
                  </span>
                </p>
              </div>
            </Card>
          )}

          {/* 訊息區域 */}
          <Card className="flex-1 p-6 overflow-y-auto mb-4" style={{ maxHeight: 'calc(100vh - 400px)' }}>
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400">尚無訊息</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => {
                  const isMine = message.sender_id === userId;
                  const isProposal = messages.indexOf(message) === 0 && conversation.type === 'project_proposal';

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-4 ${
                          isMine
                            ? 'bg-[#f5f3ed] text-[#20263e] border border-gray-200'
                            : 'bg-gray-100 text-[#20263e] border border-gray-200'
                        }`}
                      >
                        {!isMine && (
                          <p className="text-xs font-semibold mb-1 text-gray-600">
                            {message.sender.name}
                          </p>
                        )}
                        {isProposal ? (
                          <div className="prose prose-sm max-w-none text-[#20263e] 
                            [&>*]:text-[#20263e] 
                            [&_h1]:text-base [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:text-[#20263e]
                            [&_h2]:text-sm [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-2 [&_h2]:text-[#20263e]
                            [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 [&_h3]:text-[#20263e]
                            [&_h4]:text-sm [&_h4]:font-semibold [&_h4]:mt-2 [&_h4]:mb-1 [&_h4]:text-[#20263e]
                            [&_p]:text-sm [&_p]:leading-relaxed [&_p]:mb-2 [&_p]:text-[#20263e]
                            [&_ul]:text-sm [&_ul]:my-2 [&_ul]:pl-5 [&_ul]:list-disc
                            [&_ol]:text-sm [&_ol]:my-2 [&_ol]:pl-5 [&_ol]:list-decimal
                            [&_li]:text-sm [&_li]:mb-1 [&_li]:text-[#20263e]
                            [&_strong]:font-semibold [&_strong]:text-[#20263e]
                            [&_em]:italic [&_em]:text-[#20263e]
                            [&_a]:text-[#c5ae8c] [&_a]:underline [&_a]:hover:text-[#a08a6f]
                            [&_code]:text-xs [&_code]:bg-gray-200 [&_code]:text-[#20263e] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono
                            [&_pre]:bg-gray-200 [&_pre]:text-[#20263e] [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-2 [&_pre]:border [&_pre]:border-gray-300
                            [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-xs
                            [&_blockquote]:border-l-4 [&_blockquote]:border-[#c5ae8c] [&_blockquote]:pl-3 [&_blockquote]:my-2 [&_blockquote]:text-[#20263e] [&_blockquote]:italic
                            [&_table]:w-full [&_table]:my-3 [&_table]:border-collapse [&_table]:border [&_table]:border-gray-300
                            [&_th]:bg-gray-200 [&_th]:text-[#20263e] [&_th]:font-semibold [&_th]:text-sm [&_th]:px-3 [&_th]:py-2 [&_th]:border [&_th]:border-gray-300 [&_th]:text-left
                            [&_td]:text-sm [&_td]:text-[#20263e] [&_td]:px-3 [&_td]:py-2 [&_td]:border [&_td]:border-gray-300
                            [&_hr]:my-4 [&_hr]:border-gray-300">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[rehypeSanitize]}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
                        )}
                        <p className="text-xs mt-2 text-gray-500">
                          {new Date(message.created_at).toLocaleString('zh-TW', {
                            month: 'numeric',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </Card>

          {/* 輸入區域 */}
          <Card className="p-4">
            {canSend ? (
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="輸入訊息..."
                  rows={3}
                  className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#20263e] focus:border-transparent resize-none"
                  disabled={sending}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <Button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="self-end"
                >
                  {sending ? '發送中...' : '發送'}
                </Button>
              </form>
            ) : (
              <div className="text-center text-gray-500 py-4">
                {needsUnlock
                  ? '請先解鎖提案才能發送訊息'
                  : '等待對方解鎖提案...'}
              </div>
            )}
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}

