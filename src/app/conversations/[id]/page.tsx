'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SEOHead } from '@/components/seo/SEOHead';
import { confirmPayment, paymentPresets } from '@/utils/paymentConfirm';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { apiGet, apiPost, apiPut, isAuthenticated, clearAuth } from '@/lib/api';
import { triggerTokenBalanceUpdate } from '@/hooks/useSession';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read?: boolean;
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
  bid_id?: string;
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
    status?: string;
  };
  bid?: {
    id: string;
    status: 'pending' | 'accepted' | 'rejected';
    created_at: string;
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
  const [closingProject, setClosingProject] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);
  const lastScrollTop = useRef(0);
  
  // 获取项目状态标签
  const getProjectStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      draft: { label: "草稿", className: "bg-gray-100 text-gray-800" },
      open: { label: "開放中", className: "bg-green-100 text-green-800" },
      in_progress: { label: "進行中", className: "bg-blue-100 text-blue-800" },
      completed: { label: "已完成", className: "bg-purple-100 text-purple-800" },
      closed: { label: "已關閉", className: "bg-gray-500 text-white" },
      cancelled: { label: "已取消", className: "bg-red-100 text-red-800" },
    };
    
    const statusInfo = statusMap[status] || { label: status, className: "bg-gray-100 text-gray-800" };
    return (
      <Badge className={statusInfo.className}>
        {statusInfo.label}
      </Badge>
    );
  };
  
  // 评价相关状态
  const [canReview, setCanReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [reviewReason, setReviewReason] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // 初始化並載入資料
  useEffect(() => {
    const initPage = async () => {
      let currentUserId: string | null = null;

      // 1. 處理使用者身分驗證
      if (status === 'authenticated' && session?.user) {
        currentUserId = (session.user as any).id;
      } else if (status !== 'loading') {
        const token = localStorage.getItem('access_token');
        const userData = localStorage.getItem('user');
        if (token && userData) {
          try {
            const parsedUser = JSON.parse(userData);
            currentUserId = parsedUser.id;
          } catch (e) {
            router.push('/login');
            return;
          }
        } else {
          router.push('/login');
          return;
        }
      } else {
        return; // 等待 session loading
      }

      setUserId(currentUserId);

      // 2. 並行載入資料 (優化效能)
      if (currentUserId && isInitialLoad.current) {
        isInitialLoad.current = false;
        try {
          if (!isAuthenticated()) {
            router.push('/login');
            return;
          }

          // 定義請求
          const fetchConvPromise = apiGet(`/api/v1/conversations/${params.id}`);
          const fetchMsgsPromise = apiGet(`/api/v1/conversations/${params.id}/messages`);

          // 等待所有請求完成
          const [convRes, msgsRes] = await Promise.all([
            fetchConvPromise.catch(async (err) => {
              // 特殊處理：如果是剛建立的對話可能會有 404 延遲，這裡做一次簡單的重試
              if (err.message?.includes('404') || err.message?.includes('not found')) {
                await new Promise(r => setTimeout(r, 1000));
                return apiGet(`/api/v1/conversations/${params.id}`);
              }
              throw err;
            }),
            fetchMsgsPromise
          ]);

          setConversation(convRes.data);
          setMessages(msgsRes.data);
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/16ae40bb-efbb-40e4-8ead-681f5fa1e1b7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'conversations/[id]/page.tsx:147',message:'Conversation loaded',data:{type:convRes.data.type,projectId:convRes.data.project?.id,hasProject:!!convRes.data.project},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          
          // 標記對話中的所有未讀訊息為已讀
          try {
            await apiPost(`/api/v1/conversations/${params.id}/mark-read`, {});
            // 觸發未讀數量更新事件，更新導航欄
            window.dispatchEvent(new Event('unread-count-updated'));
          } catch (error) {
            console.error('Failed to mark messages as read:', error);
            // 不阻擋頁面載入，靜默失敗
          }
          
          // 如果是提案對話，檢查是否可以評價
          if (convRes.data.type === 'project_proposal' && convRes.data.project?.id) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/16ae40bb-efbb-40e4-8ead-681f5fa1e1b7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'conversations/[id]/page.tsx:159',message:'Calling checkReviewPermission',data:{projectId:convRes.data.project.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'B'})}).catch(()=>{});
            // #endregion
            checkReviewPermission(convRes.data.project.id);
          } else {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/16ae40bb-efbb-40e4-8ead-681f5fa1e1b7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'conversations/[id]/page.tsx:163',message:'Not checking review - not project_proposal or no project',data:{type:convRes.data.type,hasProject:!!convRes.data.project},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
          }
        } catch (error: any) {
          console.error('Failed to load conversation data:', error);
          if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
            alert('登入已過期，請重新登入');
            clearAuth();
            router.push('/login');
          } else {
            // 只有在真的失敗時才顯示錯誤，避免過度打擾
            console.error('Loading error:', error);
          }
        } finally {
          setLoading(false);
        }
      }
    };

    initPage();
  }, [status, session, params.id, router]);

  // 當對話更新時，檢查評價權限
  useEffect(() => {
    if (conversation?.type === 'project_proposal' && conversation?.project?.id) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/16ae40bb-efbb-40e4-8ead-681f5fa1e1b7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'conversations/[id]/page.tsx:172',message:'useEffect - conversation changed, checking review',data:{type:conversation.type,projectId:conversation.project.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      checkReviewPermission(conversation.project.id);
    }
  }, [conversation?.type, conversation?.project?.id]);

  useEffect(() => {
    // 當訊息更新時，標記未讀訊息為已讀
    if (messages.length > 0 && userId) {
      const markAsRead = async () => {
        try {
          await apiPost(`/api/v1/conversations/${params.id}/mark-read`, {});
          // 觸發未讀數量更新事件，更新導航欄
          window.dispatchEvent(new Event('unread-count-updated'));
        } catch (error) {
          console.error('Failed to mark messages as read:', error);
        }
      };
      
      // 延遲一點時間，確保用戶已經看到訊息
      const timer = setTimeout(() => {
        markAsRead();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [messages, userId, params.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 處理滾動事件 - 向下隱藏，向上顯示
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const currentScrollTop = container.scrollTop;
      
      // 如果在最頂部，總是顯示
      if (currentScrollTop <= 10) {
        setShowHeader(true);
        lastScrollTop.current = currentScrollTop;
        return;
      }

      // 向下滾動時隱藏，向上滾動時顯示
      if (currentScrollTop > lastScrollTop.current && currentScrollTop > 50) {
        // 向下滾動
        setShowHeader(false);
      } else if (currentScrollTop < lastScrollTop.current) {
        // 向上滾動
        setShowHeader(true);
      }

      lastScrollTop.current = currentScrollTop;
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // 重新獲取訊息 (用於發送後更新)
  const refreshMessages = async () => {
    try {
      const { data } = await apiGet(`/api/v1/conversations/${params.id}/messages`);
      setMessages(data);
      // 標記新訊息為已讀
      try {
        await apiPost(`/api/v1/conversations/${params.id}/mark-read`, {});
        // 觸發未讀數量更新事件，更新導航欄
        window.dispatchEvent(new Event('unread-count-updated'));
      } catch (error) {
        console.error('Failed to mark messages as read:', error);
      }
    } catch (error) {
      console.error('Failed to refresh messages', error);
    }
  };

  // 重新獲取對話詳情 (用於解鎖後更新)
  const refreshConversation = async () => {
    try {
      const { data } = await apiGet(`/api/v1/conversations/${params.id}`);
      setConversation(data);
      // 如果是提案對話，重新檢查評價權限
      if (data.type === 'project_proposal' && data.project?.id) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/16ae40bb-efbb-40e4-8ead-681f5fa1e1b7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'conversations/[id]/page.tsx:261',message:'refreshConversation - calling checkReviewPermission',data:{projectId:data.project.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        checkReviewPermission(data.project.id);
      }
    } catch (error) {
      console.error('Failed to refresh conversation', error);
    }
  };

  const handleUnlock = async () => {
    if (!conversation) return;

    const isInitiator = conversation.initiator_id === userId;
    const otherUser = isInitiator ? conversation.recipient : conversation.initiator;
    const confirmed = await confirmPayment(
      paymentPresets.viewProposal(otherUser.name)
    );

    if (!confirmed) return;

    setUnlocking(true);
    try {
      if (!isAuthenticated()) {
        router.push('/login');
        return;
      }

      await apiPost('/api/v1/conversations/unlock-proposal', { conversation_id: conversation.id });
      triggerTokenBalanceUpdate();
      
      // 先更新狀態，再顯示成功訊息
      await Promise.all([
        refreshConversation(),
        refreshMessages()
      ]);
      
      alert('✅ 提案已解鎖！已扣除 100 代幣');
    } catch (error: any) {
      alert(`❌ 解鎖失敗：${error.message || '請稍後再試'}`);
    } finally {
      setUnlocking(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      if (!isAuthenticated()) {
        router.push('/login');
        return;
      }

      await apiPost(`/api/v1/conversations/${params.id}/messages`, { content: newMessage });
      setNewMessage('');
      refreshMessages();
    } catch (error: any) {
      if (error.message?.includes('401')) {
        clearAuth();
        router.push('/login');
      } else {
        alert(`❌ 發送失敗：${error.message || '請稍後再試'}`);
      }
    } finally {
      setSending(false);
    }
  };

  const handleWithdrawProposal = async () => {
    if (!conversation?.bid?.id) return;

    const confirmed = confirm(
      '確定要撤回此提案嗎？\n\n' +
      '撤回後將：\n' +
      '• 刪除此提案和對話\n' +
      '• 退還 100 代幣\n' +
      '• 無法恢復此操作'
    );

    if (!confirmed) return;

    setWithdrawing(true);
    try {
      if (!isAuthenticated()) {
        router.push('/login');
        return;
      }

      const response = await apiPost(`/api/v1/bids/${conversation.bid.id}/withdraw`, {});
      alert(`✅ ${response.message || '提案已撤回，已退還 100 代幣'}`);
      triggerTokenBalanceUpdate();
      
      // 導向到我的提案頁面
      router.push('/bids/me');
    } catch (error: any) {
      alert(`❌ 撤回失敗：${error.message || '請稍後再試'}`);
    } finally {
      setWithdrawing(false);
    }
  };

  // 完成案件
  const handleCompleteProject = async () => {
    if (!conversation?.project?.id) return;

    const confirmed = confirm('確認要標記此案件為已完成嗎？完成後可以給予對方評價。');
    if (!confirmed) return;

    setClosingProject(true);
    try {
      if (!isAuthenticated()) {
        router.push('/login');
        return;
      }

      await apiPut(`/api/v1/projects/${conversation.project.id}`, { status: 'completed' });
      
      // 更新本地狀態
      setConversation(prev => {
        if (!prev || !prev.project) return prev;
        return {
          ...prev,
          project: {
            ...prev.project!,
            status: 'completed'
          }
        };
      });
      
      alert('✅ 案件已標記為已完成');
      
      // 重新檢查評價權限
      checkReviewPermission(conversation.project.id);
      
    } catch (error: any) {
      alert(`❌ 完成案件失敗：${error.message || '請稍後再試'}`);
    } finally {
      setClosingProject(false);
    }
  };

  // 關閉案件
  const handleCloseProject = async () => {
    if (!conversation?.project?.id) return;

    const confirmed = confirm('確認要關閉此案件投稿，不再接收其他人的提案嗎');
    if (!confirmed) return;

    setClosingProject(true);
    try {
      if (!isAuthenticated()) {
        router.push('/login');
        return;
      }

      await apiPut(`/api/v1/projects/${conversation.project.id}`, { status: 'closed' });
      
      // 更新本地狀態
      setConversation(prev => {
        if (!prev || !prev.project) return prev;
        return {
          ...prev,
          project: {
            ...prev.project!,
            status: 'closed'
          }
        };
      });
      
      alert('✅ 案件已成功關閉');
      
      // 重新檢查評價權限
      checkReviewPermission(conversation.project.id);
      
    } catch (error: any) {
      alert(`❌ 關閉案件失敗：${error.message || '請稍後再試'}`);
    } finally {
      setClosingProject(false);
    }
  };

  // 檢查評價權限 - 使用後端 API 檢查（支持雙方評價）
  const checkReviewPermission = async (projectId: string) => {
    try {
      // 使用後端的 can-review API，它會自動檢查：
      // 1. 當前用戶是否為案件參與者（發案者或接案者）
      // 2. 是否已經評價過對方
      // 3. 案件狀態是否允許評價
      const reviewCheckResponse = await apiGet(`/api/v1/projects/${projectId}/can-review`) as any;
      
      if (reviewCheckResponse.success && reviewCheckResponse.data) {
        const { can_review, reason } = reviewCheckResponse.data;
        
        // 更新項目狀態（如果需要）
        if (conversation?.project) {
          const projectResponse = await apiGet(`/api/v1/projects/${projectId}`) as any;
          if (projectResponse.success && projectResponse.data) {
            const projectStatus = projectResponse.data.status;
            setConversation({
              ...conversation,
              project: {
                ...conversation.project,
                status: projectStatus
              }
            });
          }
        }
        
        // 檢查是否已經評價過（通過 reason 判斷）
        const hasReviewed = reason && reason.includes('已經評價過');
        
        setCanReview(can_review || false);
        setHasReviewed(hasReviewed);
        setReviewReason(reason || null);
      } else {
        setCanReview(false);
        setHasReviewed(false);
        setReviewReason('無法檢查評價權限');
      }
    } catch (error: any) {
      // 靜默失敗，不影響頁面載入
      console.error('Failed to check review permission:', error);
      setCanReview(false);
      setHasReviewed(false);
      setReviewReason('檢查評價權限失敗');
    }
  };

  // 提交評價
  const handleSubmitReview = async () => {
    if (!conversation?.project?.id || reviewRating === 0 || !reviewComment.trim()) {
      setReviewError('請填寫評分和評論');
      return;
    }

    setSubmittingReview(true);
    setReviewError(null);

    try {
      if (!isAuthenticated()) {
        router.push('/login');
        return;
      }

      // 提交前再次確認項目狀態
      const projectResponse = await apiGet(`/api/v1/projects/${conversation.project.id}`) as any;
      if (projectResponse.success && projectResponse.data) {
        const projectStatus = projectResponse.data.status;
        if (projectStatus !== 'completed') {
          setReviewError(`案件狀態為「${projectStatus}」，完成案件後可以給予對方評價`);
          setSubmittingReview(false);
          return;
        }
      }

      const response = await apiPost(`/api/v1/projects/${conversation.project.id}/reviews`, {
        rating: reviewRating,
        comment: reviewComment,
        tags: []
      }) as any;

      if (response.success) {
        setShowReviewModal(false);
        setHasReviewed(true);
        setCanReview(false);
        setReviewRating(0);
        setReviewComment('');
        alert('✅ 評價已提交');
      } else {
        setReviewError(response.error || '提交失敗');
      }
    } catch (error: any) {
      console.error('Failed to submit review:', error);
      setReviewError(error.message || '提交評價失敗，請稍後再試');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading || (status === 'loading' && !userId)) {
    return (
      <>
        <SEOHead 
          title="對話"
          description="查看您的對話訊息"
          noindex={true}
        />
        <div className="min-h-screen flex flex-col bg-[#f5f3ed]">
          <Navbar />
          <main className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#20263e]"></div>
              <p className="text-[#20263e] text-sm">載入對話中...</p>
            </div>
          </main>
        </div>
      </>
    );
  }

  if (!conversation) {
     return (
      <>
        <SEOHead 
          title="對話"
          description="查看您的對話訊息"
          noindex={true}
        />
        <div className="min-h-screen flex flex-col bg-[#f5f3ed]">
          <Navbar />
          <main className="flex-1 flex items-center justify-center">
            <p className="text-[#20263e]">無法載入對話，請稍後再試。</p>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  const isInitiator = conversation.initiator_id === userId;
  
  function getOtherUser() {
    return isInitiator ? conversation!.recipient : conversation!.initiator;
  }
  const needsUnlock = conversation.type === 'project_proposal' && !conversation.recipient_paid && !isInitiator;
  const canSend = conversation.is_unlocked;

  // 檢查是否為案件擁有者且案件為開放中
  const isProjectOwner = conversation.type === 'project_proposal' && conversation.recipient_id === userId;
  const isProjectOpen = conversation.project?.status === 'open';
  const isProjectInProgress = conversation.project?.status === 'in_progress';
  const canCompleteProject = isProjectOwner && (isProjectOpen || isProjectInProgress);

  // 計算提案是否可撤回（7天後且未被接受）
  const canWithdraw = conversation.type === 'project_proposal' 
    && isInitiator 
    && conversation.bid
    && conversation.bid.status === 'pending'
    && !conversation.recipient_paid;
  
  let daysPassedSinceProposal = 0;
  let canWithdrawNow = false;
  
  if (canWithdraw && conversation.bid?.created_at) {
    const createdAt = new Date(conversation.bid.created_at);
    const now = new Date();
    daysPassedSinceProposal = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    canWithdrawNow = daysPassedSinceProposal >= 7;
  }

  const otherUser = getOtherUser();
  const conversationTitle = conversation.project?.title 
    ? `與 ${otherUser.name} 的對話 - ${conversation.project.title}`
    : `與 ${otherUser.name} 的對話`;

  return (
    <>
      <SEOHead 
        title={conversationTitle}
        description={`在 200 OK 平台上與 ${otherUser.name} 的對話訊息`}
        noindex={true}
      />
      <div className="fixed inset-0 flex flex-col bg-[#f5f3ed] overflow-hidden">
      {/* 頂部導航列 - 固定高度，保留空間給 fixed 的 Navbar */}
      <div className="flex-none z-20 h-16">
        <Navbar />
      </div>

      {/* 主要內容區 - 使用固定高度佈局 */}
      <div className="flex-1 flex flex-col w-full max-w-5xl mx-auto bg-white shadow-sm md:border-x border-gray-100 overflow-hidden">
        
        {/* 頂部資訊欄 - 可滾動隱藏 */}
        <div 
          className={`flex-none bg-white z-10 border-b border-gray-200 shadow-sm transition-transform duration-300 ${
            showHeader ? 'translate-y-0' : '-translate-y-full'
          }`}
        >
          {/* 返回按鈕與查看案件按鈕 */}
          <div className="px-4 md:px-6 pt-4 pb-2 flex items-center justify-between">
            <button
              onClick={() => router.push('/conversations')}
              className="text-gray-500 hover:text-[#20263e] transition-colors flex items-center gap-2 text-sm font-medium"
              aria-label="返回對話列表"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M11.03 3.97a.75.75 0 010 1.06l-6.22 6.22H21a.75.75 0 010 1.5H4.81l6.22 6.22a.75.75 0 11-1.06 1.06l-7.5-7.5a.75.75 0 010-1.06l7.5-7.5a.75.75 0 011.06 0z" clipRule="evenodd" />
              </svg>
              返回對話列表
            </button>
            
            {/* 查看案件詳情按鈕與案件狀態操作按鈕（僅提案對話顯示） */}
            {conversation.type === 'project_proposal' && conversation.project?.id && (
              <div className="flex items-center gap-2">
                {/* 完成案件按鈕（僅案主且案件開放中或進行中顯示） */}
                {canCompleteProject && (
                  <Button
                    onClick={handleCompleteProject}
                    disabled={closingProject}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                    {closingProject ? '處理中...' : '完成案件'}
                  </Button>
                )}
                {/* 關閉案件按鈕（僅案主且案件開放中顯示） */}
                {isProjectOwner && isProjectOpen && (
                  <Button
                    onClick={handleCloseProject}
                    disabled={closingProject}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                    </svg>
                    {closingProject ? '處理中...' : '關閉案件投稿'}
                  </Button>
                )}

                <Button
                  onClick={() => {
                    if (conversation.project?.id) {
                      router.push(`/projects/${conversation.project.id}`);
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 text-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M10.75 16.82A7.462 7.462 0 0115 15.5c.71 0 1.396.098 2.046.282A.75.75 0 0018 15.06v-11a.75.75 0 00-.546-.721A9.006 9.006 0 0015 3a8.963 8.963 0 00-4.25 1.065V16.82zM9.25 4.065A8.963 8.963 0 005 3c-.85 0-1.673.118-2.454.339A.75.75 0 002 4.06v11a.75.75 0 00.954.721A7.506 7.506 0 015 15.5c1.579 0 3.042.487 4.25 1.32V4.065z" />
                  </svg>
                  查看案件詳情
                </Button>
              </div>
            )}
          </div>

          {/* 對話資訊卡片 */}
          <div className="px-4 md:px-6 pb-4">
            <div className="bg-gradient-to-r from-[#f5f3ed] to-white rounded-xl p-4 md:p-5 border border-gray-100">
              <div className="flex items-center gap-4">
                {/* 頭像 */}
                {otherUser.avatar_url ? (
                  <img
                    src={otherUser.avatar_url}
                    alt={otherUser.name}
                    className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-3 border-white shadow-md flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#20263e] text-white flex items-center justify-center text-2xl font-bold flex-shrink-0 shadow-md">
                    {otherUser.name[0]}
                  </div>
                )}
                
                {/* 標題與資訊 */}
                <div className="flex-1 min-w-0">
                  {/* 專案標題或對話標題 */}
                  {conversation.project ? (
                    <div>
                      <h1 className="text-xl md:text-2xl font-bold text-[#20263e] leading-tight mb-1 truncate">
                        {conversation.project.title}
                      </h1>
                      <p className="text-sm text-gray-600 flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
                        </svg>
                        與 <Link href={`/users/${otherUser.id}`} className="font-semibold hover:text-[#20263e] hover:underline transition-colors">{otherUser.name}</Link> 的對話
                      </p>
                    </div>
                  ) : (
                    <h1 className="text-xl md:text-2xl font-bold text-[#20263e] leading-tight">
                      與 <Link href={`/users/${otherUser.id}`} className="hover:text-[#c5ae8c] hover:underline transition-colors">{otherUser.name}</Link> 的對話
                    </h1>
                  )}
                  
                  {/* 狀態標籤 */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-700">
                      {conversation.type === 'direct' ? '💬 直接聯絡' : '📝 提案對話'}
                    </span>
                    {conversation.project?.status && getProjectStatusBadge(conversation.project.status)}
                    {conversation.is_unlocked && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 border border-green-200 rounded-full text-xs text-green-700 font-medium">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                          <path fillRule="evenodd" d="M16.403 12.652a3 3 0 000-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.883l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                        </svg>
                        已解鎖
                      </span>
                    )}
                  </div>

                  {/* 聯絡資訊 */}
                  {(otherUser.email || (conversation.is_unlocked && otherUser.phone)) && (
                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-600">
                      {otherUser.email && (
                        <a href={`mailto:${otherUser.email}`} className="flex items-center gap-1 hover:text-[#20263e] transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                            <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
                            <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
                          </svg>
                          {otherUser.email}
                        </a>
                      )}
                      {conversation.is_unlocked && otherUser.phone && (
                        <a href={`tel:${otherUser.phone}`} className="flex items-center gap-1 hover:text-[#20263e] transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                            <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 012.43 8.326 13.019 13.019 0 012 5V3.5z" clipRule="evenodd" />
                          </svg>
                          {otherUser.phone}
                        </a>
                      )}
                    </div>
                  )}

                  {/* 評價按鈕或狀態 */}
                  {(() => {
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/16ae40bb-efbb-40e4-8ead-681f5fa1e1b7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'conversations/[id]/page.tsx:600',message:'Rendering review button section',data:{type:conversation.type,isProjectProposal:conversation.type==='project_proposal',canReview,hasReviewed,reviewReason},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'E'})}).catch(()=>{});
                    // #endregion
                    return null;
                  })()}
                  {conversation.type === 'project_proposal' && (
                    <div className="mt-3">
                      {hasReviewed ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full text-xs text-green-700 font-medium">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                            <path fillRule="evenodd" d="M16.403 12.652a3 3 0 000-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.883l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                          </svg>
                          已評價
                        </span>
                      ) : canReview ? (
                        <Button
                          onClick={() => setShowReviewModal(true)}
                          size="sm"
                          className="bg-[#c5ae8c] text-white hover:bg-[#b09a75]"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1.5">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          給對方留評價
                        </Button>
                      ) : reviewReason ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-xs text-gray-600 font-medium">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                          </svg>
                          {reviewReason}
                        </span>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 訊息列表區 - 可滾動 */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto bg-[#fafaf8] px-4 md:px-6 py-4"
        >
          
          {/* 提示橫幅 */}
          {conversation.type === 'project_proposal' && !conversation.is_unlocked && (
            <div className="mb-4 space-y-3">
              {/* 解鎖提示（發案者視角） */}
              {needsUnlock && (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 text-center shadow-sm">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-yellow-600">
                      <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                    </svg>
                    <p className="text-base text-yellow-900 font-bold">您收到一份新提案</p>
                  </div>
                  <p className="text-sm text-yellow-700 mb-3">您可以查看提案內容，解鎖後即可與對方聊天</p>
                  <Button onClick={handleUnlock} disabled={unlocking} size="sm" className="bg-[#20263e] text-white hover:bg-[#353e5e] shadow-md">
                    {unlocking ? '處理中...' : '🔓 解鎖提案 - 與對方聊聊 (100 代幣)'}
                  </Button>
                </div>
              )}

              {/* 等待回應提示（接案者視角） */}
              {isInitiator && !conversation.recipient_paid && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                    <p className="text-sm text-blue-700 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                    </svg>
                      {canWithdrawNow 
                        ? '發案者已超過 7 天未回應，您可以撤回提案並退回代幣' 
                        : `等待發案者回應中（${7 - daysPassedSinceProposal} 天後可撤回）`
                      }
                    </p>
                    {canWithdrawNow && (
                      <Button 
                        onClick={handleWithdrawProposal}
                        disabled={withdrawing}
                        variant="outline"
                        size="sm"
                        className={withdrawing 
                          ? "whitespace-nowrap border-[#20263e] text-[#20263e]" 
                          : "whitespace-nowrap border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400"
                        }
                      >
                        {withdrawing ? '處理中...' : '🔄 撤回提案並退回 100 代幣'}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 訊息內容 */}
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mb-3 opacity-40">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
              <p className="text-sm">尚無訊息</p>
              <p className="text-xs mt-1">開始對話吧！</p>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message, index) => {
                const isMine = message.sender_id === userId;
                
                // 日期顯示邏輯
                const currentDate = new Date(message.created_at);
                const prevMessage = index > 0 ? messages[index - 1] : null;
                const prevDate = prevMessage ? new Date(prevMessage.created_at) : null;
                
                let showDateDivider = false;
                if (!prevDate) {
                  showDateDivider = true;
                } else if (
                  currentDate.getDate() !== prevDate.getDate() ||
                  currentDate.getMonth() !== prevDate.getMonth() ||
                  currentDate.getFullYear() !== prevDate.getFullYear()
                ) {
                  showDateDivider = true;
                }

                return (
                  <div key={message.id}>
                    {showDateDivider && (
                      <div className="flex justify-center my-6">
                         <span className="text-xs text-gray-500 bg-white px-4 py-1.5 rounded-full border border-gray-200 shadow-sm font-medium">
                           {currentDate.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })}
                         </span>
                      </div>
                    )}
                    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex flex-col max-w-[85%] md:max-w-[75%] ${isMine ? 'items-end' : 'items-start'}`}>
                      
                        {!isMine && (
                          <span className="text-xs text-gray-500 mb-1.5 ml-1 font-medium">{message.sender.name}</span>
                        )}

                        <div
                          className={`rounded-2xl px-5 py-3.5 shadow-sm ${
                            isMine
                              ? 'bg-[#f5f3ed] text-[#20263e] border border-gray-200 rounded-tr-sm'
                              : 'bg-white text-[#20263e] border border-gray-200 rounded-tl-sm'
                          }`}
                        >
                          <div className="prose prose-sm max-w-none prose-invert
                              [&_h1]:text-base [&_h1]:font-bold [&_h1]:mt-3 [&_h1]:mb-2
                              [&_h2]:text-sm [&_h2]:font-bold [&_h2]:mt-2 [&_h2]:mb-1.5
                              [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1
                              [&_p]:text-sm [&_p]:leading-relaxed [&_p]:mb-2
                              [&_ul]:text-sm [&_ul]:my-2 [&_ul]:pl-5 [&_ul]:list-disc
                              [&_ol]:text-sm [&_ol]:my-2 [&_ol]:pl-5 [&_ol]:list-decimal
                              [&_li]:text-sm [&_li]:mb-1
                              [&_strong]:font-semibold
                              [&_em]:italic
                              [&_a]:underline [&_a]:hover:opacity-80
                              [&_code]:text-xs [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono
                              [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-2 [&_pre]:border [&_pre]:bg-slate-50
                              [&_pre_code]:p-0 [&_pre_code]:text-xs
                              [&_blockquote]:border-l-4 [&_blockquote]:pl-3 [&_blockquote]:my-2 [&_blockquote]:italic
                              [&_table]:w-full [&_table]:my-3 [&_table]:border-collapse
                              [&_th]:font-semibold [&_th]:text-sm [&_th]:px-3 [&_th]:py-2 [&_th]:border [&_th]:text-left
                              [&_td]:text-sm [&_td]:px-3 [&_td]:py-2 [&_td]:border
                              [&_hr]:my-3"
                          >
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[rehypeSanitize]}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1.5 mt-1 mx-1">
                          <span className="text-[10px] text-gray-400">
                            {new Date(message.created_at).toLocaleString('zh-TW', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {/* 已讀狀態顯示（只對自己發送的訊息顯示） */}
                          {isMine && (
                            <span className="text-[10px] text-gray-400">
                              {message.is_read ? (
                                <span className="text-blue-500">✓ 已讀</span>
                              ) : (
                                <span className="text-gray-300">✓</span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 底部輸入區 - 固定在視窗底部 */}
        <div className="flex-none p-4 md:p-5 bg-white border-t border-gray-200">
          {canSend ? (
            <form onSubmit={handleSendMessage} className="flex flex-col gap-2">
              <div className="relative">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="輸入訊息... (支援 Markdown)"
                  rows={1}
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                  className="w-full pl-4 pr-14 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#20263e] focus:border-[#20263e] resize-none text-sm transition-all placeholder:text-gray-400"
                  disabled={sending}
                  onCompositionStart={() => setIsComposing(true)}
                  onCompositionEnd={() => setIsComposing(false)}
                  onKeyDown={(e) => {
                    if (isComposing) return;
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className={
                    !newMessage.trim() || sending 
                      ? 'absolute right-2 bottom-2 p-2 rounded-lg transition-all text-gray-300 bg-gray-100' 
                      : 'absolute right-2 bottom-2 p-2 rounded-lg transition-all text-white bg-[#20263e] hover:bg-[#353e5e] shadow-md hover:shadow-lg'
                  }
                  aria-label="發送訊息"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                  </svg>
                </button>
              </div>
              <div className="text-[10px] text-gray-400 text-center">
                 Enter 發送 • Shift + Enter 換行
              </div>
            </form>
          ) : (
             <div className="text-center py-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
               <span className="text-sm text-gray-500 font-medium">
                 {needsUnlock ? '🔒 請先解鎖提案才能回覆' : (isInitiator ? '⏳ 等待對方解鎖...' : '🔒 請先解鎖提案才能回覆')}
               </span>
             </div>
          )}
        </div>
      </div>

      {/* 評價彈窗 */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              {/* 標題 */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-[#20263e]">給 {otherUser.name} 留評價</h2>
                <button
                  onClick={() => {
                    setShowReviewModal(false);
                    setReviewError(null);
                    setReviewRating(0);
                    setReviewComment('');
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl transition-colors"
                >
                  ×
                </button>
              </div>

              {/* 專案資訊 */}
              {conversation.project && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">專案</p>
                  <p className="text-base font-semibold text-[#20263e]">{conversation.project.title}</p>
                </div>
              )}

              {/* 評分選擇 */}
              <div className="mb-4">
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setReviewRating(rating)}
                      className={`w-9 h-9 rounded-full transition-all flex items-center justify-center ${
                        reviewRating >= rating
                          ? 'bg-[#c5ae8c] text-white'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-4 h-4"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>

              </div>

              {/* 評論輸入 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#20263e] mb-2">評論</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="請分享您的使用體驗..."
                  rows={4}
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#20263e] focus:border-[#20263e] resize-none text-sm transition-all"
                />
              </div>

              {/* 錯誤訊息 */}
              {reviewError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{reviewError}</p>
                </div>
              )}

              {/* 按鈕 */}
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => {
                    setShowReviewModal(false);
                    setReviewError(null);
                    setReviewRating(0);
                    setReviewComment('');
                  }}
                  variant="outline"
                  className="flex-1"
                  disabled={submittingReview}
                >
                  取消
                </Button>
                <Button
                  onClick={handleSubmitReview}
                  className="flex-1 bg-[#20263e] text-white hover:bg-[#2d3550]"
                  disabled={submittingReview || reviewRating === 0 || !reviewComment.trim()}
                  loading={submittingReview}
                >
                  提交評價
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
