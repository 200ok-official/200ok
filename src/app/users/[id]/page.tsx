"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StarRating } from "@/components/ui/StarRating";
import { confirmPayment, paymentPresets } from "@/utils/paymentConfirm";
import { apiGet, apiPost, isAuthenticated } from "@/lib/api";
import { triggerTokenBalanceUpdate } from "@/hooks/useSession";
import { 
  ChatBubbleLeftRightIcon, 
  GlobeAltIcon, 
  SparklesIcon, 
  HandThumbUpIcon,
  StarIcon as StarIconSolid
} from "@heroicons/react/24/solid";
import { 
  UserCircleIcon,
  ChatBubbleBottomCenterTextIcon,
  UserIcon, 
  StarIcon, 
  ChatBubbleLeftEllipsisIcon, 
  LockClosedIcon, 
  LockOpenIcon, 
  ClockIcon, 
  CalendarIcon,
  InboxIcon,
  BriefcaseIcon,
  DocumentCheckIcon,
  ChartBarIcon
} from "@heroicons/react/24/outline";

interface User {
  id: string;
  name: string;
  email: string;
  roles: string[];
  bio?: string;
  skills?: string[];
  avatar_url?: string;
  portfolio_links?: string[];
  rating?: number;
  created_at: string;
  _count?: {
    projects_created: number;
    bids: number;
    reviews_received: number;
  };
}

interface Review {
  id: string;
  rating: number;
  comment?: string;
  tags?: string[];
  created_at: string;
  reviewer: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  project: {
    id: string;
    title: string;
  };
}

interface UserStats {
  rating: number;
  projects_created: number;
  bids_count: number;
  completed_projects: number;
  is_freelancer: boolean;
  is_client: boolean;
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [existingConversation, setExistingConversation] = useState<any>(null);

  // 檢查登入狀態（支援 NextAuth 和 localStorage）
  useEffect(() => {
    // 優先使用 NextAuth session
    if (session?.user) {
      setCurrentUserId((session.user as any).id);
    } else {
      // 回退到 localStorage
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setCurrentUserId(parsedUser.id);
        } catch (e) {
          console.error('Failed to parse user data:', e);
        }
      }
    }
  }, [session]);

  useEffect(() => {
    if (userId) {
      console.log("Fetching user data for ID:", userId);
      fetchUserData();
      fetchUserStats();
      fetchUserReviews();
    } else {
      console.error("No userId provided");
      setError("無效的使用者 ID");
      setLoading(false);
    }
  }, [userId]);

  // 檢查是否已經有連接存在
  const checkExistingConversation = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token || !currentUserId) return;

      // 使用新的 API 檢查連接狀態
      const { data } = await apiGet(`/api/v1/connections/check`, {
        userId: userId,  // Backend 期望的參數名稱是 userId
      });
      setExistingConversation(data);
    } catch (error) {
      console.error('Failed to check existing conversation:', error);
    }
  }, [userId, currentUserId]);

  useEffect(() => {
    if (currentUserId && userId && currentUserId !== userId) {
      checkExistingConversation();
    }
  }, [currentUserId, userId, checkExistingConversation]);

  const fetchUserData = async () => {
    try {
      const url = `/api/v1/users/${userId}`;
      console.log("Fetching from:", url);
      const data = await apiGet(url, { t: Date.now().toString() });
      console.log("Response data:", data);
      console.log("Bio from API:", data.data?.bio?.substring(0, 50));
      if (data.success && data.data) {
        setUser(data.data);
      } else {
        const errorMsg = data.error || "無法載入使用者資料";
        console.error("API returned error:", errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      console.error("Failed to fetch user:", err);
      setError("載入使用者資料時發生錯誤");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const data = await apiGet(`/api/v1/users/${userId}/stats`);
      setStats(data.data);
    } catch (err) {
      console.error("Failed to fetch user stats:", err);
    }
  };

  const fetchUserReviews = async () => {
    try {
      const data = await apiGet(`/api/v1/users/${userId}/reviews`, { limit: '10' });
      setReviews(data.data || []);
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#e6dfcf] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#20263e]"></div>
            <p className="mt-4 text-[#20263e] font-semibold">載入中...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-2xl mx-auto text-center">
            <CardContent className="py-12">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                {error || "找不到使用者"}
              </h2>
              <Link href="/freelancers">
                <Button variant="primary">返回接案者列表</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const isFreelancer = user.roles.includes("freelancer");
  const isClient = user.roles.includes("client");
  const displayRating = user.rating || stats?.rating || 0;
  const isOwnProfile = currentUserId === userId;

  const handleUnlockContact = async () => {
    if (!currentUserId) {
      // 儲存當前頁面，登入後返回
      localStorage.setItem('returnUrl', window.location.pathname);
      router.push('/login');
      return;
    }

    const confirmed = await confirmPayment(
      paymentPresets.directContact(user.name)
    );

    if (!confirmed) return;

    setUnlocking(true);
    try {
      if (!isAuthenticated()) {
        alert('請先登入');
        router.push('/login');
        return;
      }

      const result = await apiPost('/api/v1/conversations/direct', { recipient_id: userId });

      if (result.success && result.data) {
        alert('已解鎖聯絡方式！已扣除 200 代幣');
        // 通知 Navbar 更新代幣餘額
        triggerTokenBalanceUpdate();
        // 重新檢查連接狀態
        await checkExistingConversation();
        router.push(`/conversations/${result.data.conversation_id || result.data.id}`);
      } else {
        alert(`解鎖失敗：${result.error || '未知錯誤'}`);
      }
    } catch (error: any) {
      alert(`解鎖失敗：${error.message || '請稍後再試'}`);
    } finally {
      setUnlocking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#e6dfcf]">
      <Navbar />
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
        {/* Profile Header Card */}
        <Card padding="none" className="mb-8 border-none shadow-lg overflow-hidden bg-[#fdfbf7] rounded-3xl relative">
          {/* Decorative Background - Full Card Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#e6dfcf] via-[#fdfbf7] to-[#e6dfcf] opacity-50"></div>
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#c5ae8c] to-[#d8cfbd]"></div>
          
          <div className="p-8 md:p-10 relative">
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
              {/* Avatar Section */}
              <div className="flex-shrink-0">
                <div className="relative">
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-white/30 p-1.5 shadow-xl ring-1 ring-black/5 backdrop-blur-sm">
                    <div className="w-full h-full rounded-full bg-gray-100 overflow-hidden relative">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#20263e] text-white text-5xl font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Rating Badge Overlay */}
                  {displayRating > 0 && (
                    <div className="absolute -bottom-2 -right-2 bg-white px-3 py-1.5 rounded-full shadow-lg border border-gray-100 flex items-center gap-1.5 z-10">
                      <StarRating rating={displayRating} size="sm" showNumber={true} />
                    </div>
                  )}
                </div>
              </div>

              {/* Info Section */}
              <div className="flex-1 text-center md:text-left w-full">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-4xl md:text-5xl font-bold text-[#20263e] mb-3 font-serif tracking-tight">
                      {user.name}
                    </h1>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-4">
                      {isFreelancer && (
                        <span className="bg-[#20263e] text-white px-4 py-1.5 text-sm font-medium rounded-full shadow-sm">
                          接案工程師
                        </span>
                      )}
                      {isClient && (
                        <span className="bg-[#c5ae8c] text-white px-4 py-1.5 text-sm font-medium rounded-full shadow-sm">
                          發案者
                        </span>
                      )}
                      {user.roles.includes("admin") && (
                        <span className="bg-[#fef3c7] text-[#92400e] px-4 py-1.5 text-sm font-medium rounded-full shadow-sm">
                          管理員
                        </span>
                      )}
                      <span className="text-[#20263e]/70 text-sm ml-2 flex items-center gap-1.5 font-medium">
                        <CalendarIcon className="w-4 h-4 text-[#20263e]/60" />
                        加入時間：{formatDate(user.created_at)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  {!isOwnProfile && currentUserId && (
                    <div className="flex-shrink-0 md:mt-2">
                      {(() => {
                        const iHaveUnlocked = existingConversation?.has_connection && (
                          existingConversation.is_initiator 
                            ? existingConversation.initiator_unlocked 
                            : existingConversation.recipient_unlocked
                        );

                        if (iHaveUnlocked) {
                          if (existingConversation.conversation_id) {
                            return (
                              <Button
                                onClick={() => router.push(`/conversations/${existingConversation.conversation_id}`)}
                                className="bg-[#20263e] hover:bg-[#2d3748] text-white px-6 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all w-full md:w-auto flex items-center justify-center gap-2"
                              >
                                <ChatBubbleLeftEllipsisIcon className="w-5 h-5" />
                                已解鎖，前往聯絡
                              </Button>
                            );
                          } else {
                            return (
                              <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm border border-blue-100 flex items-center gap-2">
                                <ClockIcon className="w-4 h-4" />
                                等待對方解鎖...
                              </div>
                            );
                          }
                        } else if (existingConversation?.has_connection) {
                          return (
                            <Button
                              onClick={handleUnlockContact}
                              disabled={unlocking}
                              className="bg-[#c5ae8c] hover:bg-[#b89d7a] text-[#20263e] px-6 py-2.5 rounded-full shadow-md hover:shadow-lg transition-all w-full md:w-auto flex items-center justify-center gap-2 font-semibold"
                            >
                              <LockOpenIcon className="w-5 h-5" />
                              {unlocking ? '處理中...' : '解鎖聯絡 (200 代幣)'}
                            </Button>
                          );
                        } else {
                          return (
                            <Button
                              onClick={handleUnlockContact}
                              disabled={unlocking}
                              className="bg-[#20263e] hover:bg-[#2d3748] text-white px-6 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all w-full md:w-auto flex items-center justify-center gap-2"
                            >
                              <LockClosedIcon className="w-5 h-5" />
                              {unlocking ? '處理中...' : '解鎖聯絡方式 (200 代幣)'}
                            </Button>
                          );
                        }
                      })()}
                    </div>
                  )}
                  
                  {!isOwnProfile && !currentUserId && (
                    <Button
                      onClick={() => router.push('/login')}
                      variant="outline"
                      className="rounded-full border-[#20263e] text-[#20263e] hover:bg-gray-50"
                    >
                      登入以聯絡
                    </Button>
                  )}
                </div>

                  {/* Skills Section - Moved up to Header */}
                  {user.skills && Array.isArray(user.skills) && user.skills.length > 0 && (
                    <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
                      {user.skills.map((skill, index) => (
                        <span 
                          key={index}
                          className="px-3 py-1 bg-white/60 border border-white/50 text-[#20263e] rounded-full text-sm font-medium shadow-sm backdrop-blur-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Portfolio Links - Moved up to Header */}
                  {user.portfolio_links && Array.isArray(user.portfolio_links) && user.portfolio_links.length > 0 && (
                    <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4 text-sm">
                      {user.portfolio_links.map((link, index) => (
                        <a
                          key={index}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-[#20263e]/80 hover:text-[#20263e] transition-colors font-medium"
                        >
                          <GlobeAltIcon className="w-4 h-4 mr-1 opacity-70" />
                          {new URL(link).hostname}
                        </a>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card padding="none" className="border-none shadow-md hover:shadow-lg transition-all bg-white rounded-2xl overflow-hidden group">
              <div className="h-1.5 w-full bg-[#20263e]"></div>
              <CardContent className="p-6 text-center">
                <div className="mb-2 text-[#20263e] opacity-20 group-hover:opacity-100 transition-opacity transform group-hover:scale-110 duration-300">
                  <BriefcaseIcon className="w-8 h-8 mx-auto" />
                </div>
                <div className="text-3xl font-bold text-[#20263e] mb-1 font-serif group-hover:text-[#c5ae8c] transition-colors">
                  {stats.projects_created}
                </div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">發起專案</div>
              </CardContent>
            </Card>
            {isFreelancer && (
              <>
                <Card padding="none" className="border-none shadow-md hover:shadow-lg transition-all bg-white rounded-2xl overflow-hidden group">
                  <div className="h-1.5 w-full bg-[#c5ae8c]"></div>
                  <CardContent className="p-6 text-center">
                    <div className="mb-2 text-[#c5ae8c] opacity-20 group-hover:opacity-100 transition-opacity transform group-hover:scale-110 duration-300">
                      <DocumentCheckIcon className="w-8 h-8 mx-auto" />
                    </div>
                    <div className="text-3xl font-bold text-[#20263e] mb-1 font-serif group-hover:text-[#c5ae8c] transition-colors">
                      {stats.bids_count}
                    </div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">投標次數</div>
                  </CardContent>
                </Card>
                <Card padding="none" className="border-none shadow-md hover:shadow-lg transition-all bg-white rounded-2xl overflow-hidden group">
                  <div className="h-1.5 w-full bg-[#20263e]"></div>
                  <CardContent className="p-6 text-center">
                    <div className="mb-2 text-[#20263e] opacity-20 group-hover:opacity-100 transition-opacity transform group-hover:scale-110 duration-300">
                      <ChartBarIcon className="w-8 h-8 mx-auto" />
                    </div>
                    <div className="text-3xl font-bold text-[#20263e] mb-1 font-serif group-hover:text-[#c5ae8c] transition-colors">
                      {stats.completed_projects}
                    </div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">完成專案</div>
                  </CardContent>
                </Card>
              </>
            )}
            <Card padding="none" className="border-none shadow-md hover:shadow-lg transition-all bg-white rounded-2xl overflow-hidden group">
              <div className="h-1.5 w-full bg-[#fbbf24]"></div>
              <CardContent className="p-6 text-center">
                <div className="mb-2 text-[#fbbf24] opacity-20 group-hover:opacity-100 transition-opacity transform group-hover:scale-110 duration-300">
                  <StarIcon className="w-8 h-8 mx-auto" />
                </div>
                <div className="text-3xl font-bold text-[#20263e] mb-1 font-serif group-hover:text-[#fbbf24] transition-colors">
                  {stats.rating > 0 ? stats.rating.toFixed(1) : "—"}
                </div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">平均評分</div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Bio */}
          <div className="lg:col-span-2 space-y-8">
            {user.bio ? (
              <Card className="border-none shadow-md bg-white overflow-hidden rounded-2xl">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 p-6">
                  <CardTitle className="text-xl font-bold text-[#20263e] flex items-center gap-3">
                    <UserIcon className="w-6 h-6 text-[#c5ae8c]" />
                    <span>關於我</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <article className="prose prose-slate prose-lg max-w-none text-gray-700
                    prose-headings:text-[#20263e] prose-headings:font-bold prose-headings:font-serif
                    prose-a:text-[#c5ae8c] prose-a:no-underline hover:prose-a:underline hover:prose-a:text-[#b09675]
                    prose-strong:text-[#20263e] prose-strong:font-semibold
                    prose-ul:list-disc prose-ul:pl-5 prose-ul:my-4
                    prose-ol:list-decimal prose-ol:pl-5 prose-ol:my-4
                    prose-li:my-1
                    prose-blockquote:border-l-4 prose-blockquote:border-[#c5ae8c] prose-blockquote:bg-gray-50 prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:rounded-r-lg prose-blockquote:italic prose-blockquote:text-gray-600
                    prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-[#c7254e] prose-code:font-mono prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
                    prose-pre:bg-[#20263e] prose-pre:text-white prose-pre:rounded-lg prose-pre:p-4 prose-pre:shadow-inner
                    prose-img:rounded-xl prose-img:shadow-md
                    prose-hr:border-gray-200
                  ">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {user.bio}
                    </ReactMarkdown>
                  </article>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-none shadow-sm bg-white p-12 text-center text-gray-500">
                <p>這位使用者尚未填寫自我介紹。</p>
              </Card>
            )}
          </div>

          {/* Right Column: Reviews & Sidebar Info */}
          <div className="space-y-8">
            {/* Reviews Section */}
            <Card className="border-none shadow-md bg-white overflow-hidden rounded-2xl h-fit sticky top-24">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 p-6 flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-bold text-[#20263e] flex items-center gap-2">
                  <StarIcon className="w-5 h-5 text-[#fbbf24]" />
                  評價 ({reviews.length})
                </CardTitle>
                {user._count && user._count.reviews_received > reviews.length && (
                  <Link href={`/users/${userId}/reviews`} className="text-sm text-[#c5ae8c] hover:text-[#20263e] font-medium transition-colors">
                    查看全部 →
                  </Link>
                )}
              </CardHeader>
              <CardContent className="p-0">
                {reviews.length > 0 ? (
                  <div className="divide-y divide-gray-50">
                    {reviews.map((review) => (
                      <div key={review.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                              {review.reviewer.avatar_url ? (
                                <img
                                  src={review.reviewer.avatar_url}
                                  alt={review.reviewer.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-[#20263e] text-white font-bold text-sm">
                                  {review.reviewer.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <div className="font-bold text-[#20263e] text-sm leading-tight">
                                {review.reviewer.name}
                              </div>
                              <Link
                                href={`/projects/${review.project.id}`}
                                className="text-xs text-gray-400 hover:text-[#c5ae8c] truncate max-w-[150px] transition-colors mt-0.5"
                              >
                                {review.project.title}
                              </Link>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex justify-end">
                              <StarRating
                                rating={review.rating}
                                size="sm"
                                showNumber={true}
                              />
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {formatDate(review.created_at)}
                            </div>
                          </div>
                        </div>
                        {review.comment && (
                          <div className="bg-gray-50 rounded-lg p-3 relative">
                            <span className="absolute top-2 left-2 text-gray-300 text-xl leading-none font-serif">&quot;</span>
                            <p className="text-gray-600 text-sm leading-relaxed px-2 pt-1 relative z-10 italic">
                              {review.comment}
                            </p>
                          </div>
                        )}
                        {review.tags && review.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {review.tags.map((tag, i) => (
                              <span key={i} className="px-2 py-0.5 bg-white border border-gray-200 text-gray-500 text-xs rounded-full shadow-sm">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <div className="flex justify-center mb-3">
                      <InboxIcon className="w-12 h-12 text-gray-300" />
                    </div>
                    <div className="text-gray-500 font-medium">尚無評價紀錄</div>
                    <p className="text-gray-400 text-sm mt-1">這位使用者還沒有收到任何評價</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
