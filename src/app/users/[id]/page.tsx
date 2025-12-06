"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StarRating } from "@/components/ui/StarRating";
import { confirmPayment, paymentPresets } from "@/utils/paymentConfirm";
import { apiGet, apiPost, isAuthenticated } from "@/lib/api";
import { triggerTokenBalanceUpdate } from "@/hooks/useSession";

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
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#20263e]"></div>
            <p className="mt-4 text-gray-600">載入中...</p>
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
        alert('❌ 請先登入');
        router.push('/login');
        return;
      }

      const result = await apiPost('/api/v1/conversations/direct', { recipient_id: userId });

      if (result.success && result.data) {
        alert('✅ 已解鎖聯絡方式！已扣除 200 代幣');
        // 通知 Navbar 更新代幣餘額
        triggerTokenBalanceUpdate();
        // 重新檢查連接狀態
        await checkExistingConversation();
        router.push(`/conversations/${result.data.conversation_id || result.data.id}`);
      } else {
        alert(`❌ 解鎖失敗：${result.error || '未知錯誤'}`);
      }
    } catch (error: any) {
      alert(`❌ 解鎖失敗：${error.message || '請稍後再試'}`);
    } finally {
      setUnlocking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* 個人資料卡片 */}
        <Card className="mb-6">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-6">
              {/* 頭像區 */}
              <div className="flex-shrink-0">
                <div className="w-32 h-32 rounded-full bg-gray-200 overflow-hidden border-4 border-white shadow-lg">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#20263e] to-[#c5ae8c] text-white text-4xl font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              {/* 基本資訊 */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-[#20263e] mb-2">
                      {user.name}
                    </h1>
                    <div className="flex items-center gap-3 mb-3">
                      {isFreelancer && (
                        <Badge variant="success" size="sm">
                          接案工程師
                        </Badge>
                      )}
                      {isClient && (
                        <Badge variant="info" size="sm">
                          發案者
                        </Badge>
                      )}
                      {user.roles.includes("admin") && (
                        <Badge variant="warning" size="sm">
                          管理員
                        </Badge>
                      )}
                    </div>
                    {displayRating > 0 && (
                      <div className="mb-3">
                        <StarRating rating={displayRating} size="md" />
                        <span className="ml-2 text-sm text-gray-600">
                          ({user._count?.reviews_received || 0} 則評價)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 聯絡按鈕（非本人） */}
                {!isOwnProfile && currentUserId && (
                  <div className="mb-4">
                    {(() => {
                      // 判斷我是否已經解鎖（不論是 initiator 還是 recipient）
                      const iHaveUnlocked = existingConversation?.has_connection && (
                        existingConversation.is_initiator 
                          ? existingConversation.initiator_unlocked 
                          : existingConversation.recipient_unlocked
                      );

                      if (iHaveUnlocked) {
                        // 我已經付費解鎖了
                        if (existingConversation.conversation_id) {
                          // 有對話 ID，可以開始對話
                          return (
                            <>
                      <Button
                        onClick={() => router.push(`/conversations/${existingConversation.conversation_id}`)}
                        variant="primary"
                        className="w-full md:w-auto"
                      >
                        💬 開始對話
                      </Button>
                              <div className="mt-2 text-xs text-green-600">
                                ✓ 已解鎖聯絡方式
                              </div>
                            </>
                          );
                        } else {
                          // 我已解鎖但還沒有對話 ID（等待對方解鎖）
                          return (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <p className="text-sm text-blue-800">
                                ⏳ 等待對方解鎖...
                              </p>
                              <p className="text-xs text-blue-600 mt-1">
                                ✓ 您已解鎖此聯絡，等待對方回應
                        </p>
                      </div>
                          );
                        }
                      } else if (existingConversation?.has_connection) {
                        // 對方已發起連接，但我還沒解鎖
                        return (
                          <>
                            <Button
                              onClick={handleUnlockContact}
                              disabled={unlocking}
                              variant="primary"
                              className="w-full md:w-auto"
                            >
                              {unlocking ? '解鎖中...' : '🔓 解鎖聯絡方式 (200 代幣)'}
                            </Button>
                            <p className="text-xs text-gray-500 mt-2">
                              對方已發起聯絡，解鎖後可開通對話
                            </p>
                          </>
                        );
                      } else {
                        // 沒有任何連接
                        return (
                      <>
                        <Button
                          onClick={handleUnlockContact}
                          disabled={unlocking}
                          variant="primary"
                          className="w-full md:w-auto"
                        >
                          {unlocking ? '解鎖中...' : '🔓 解鎖聯絡方式 (200 代幣)'}
                        </Button>
                        <p className="text-xs text-gray-500 mt-2">
                          解鎖後可查看聯絡資訊並開通站內文字通訊
                        </p>
                      </>
                        );
                      }
                    })()}
                  </div>
                )}
                
                {!isOwnProfile && !currentUserId && (
                  <div className="mb-4">
                    <Button
                      onClick={() => router.push('/login')}
                      variant="secondary"
                      className="w-full md:w-auto"
                    >
                      登入以聯絡此使用者
                    </Button>
                  </div>
                )}

                {/* 個人介紹 */}
                {user.bio && (
                  <div className="mb-4">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {user.bio}
                    </p>
                  </div>
                )}

                {/* 技能標籤 */}
                {user.skills && Array.isArray(user.skills) && user.skills.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">
                      技能標籤
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {user.skills.map((skill, index) => (
                        <Badge
                          key={index}
                          variant="default"
                          className="bg-[#e6dfcf] text-[#20263e] border border-[#c5ae8c]"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* 作品集連結 */}
                {user.portfolio_links && Array.isArray(user.portfolio_links) && user.portfolio_links.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">
                      作品集
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {user.portfolio_links.map((link, index) => (
                        <a
                          key={index}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#20263e] hover:text-[#c5ae8c] underline text-sm"
                        >
                          {new URL(link).hostname}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* 加入時間 */}
                <div className="text-sm text-gray-500">
                  加入時間：{formatDate(user.created_at)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 統計資訊 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-[#20263e] mb-2">
                  {stats.projects_created}
                </div>
                <div className="text-sm text-gray-600">發起專案</div>
              </CardContent>
            </Card>
            {isFreelancer && (
              <>
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold text-[#20263e] mb-2">
                      {stats.bids_count}
                    </div>
                    <div className="text-sm text-gray-600">投標次數</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold text-[#20263e] mb-2">
                      {stats.completed_projects}
                    </div>
                    <div className="text-sm text-gray-600">完成專案</div>
                  </CardContent>
                </Card>
              </>
            )}
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-[#20263e] mb-2">
                  {stats.rating > 0 ? stats.rating.toFixed(1) : "—"}
                </div>
                <div className="text-sm text-gray-600">平均評分</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 評價區塊 */}
        {reviews.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>評價 ({reviews.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {review.reviewer.avatar_url ? (
                          <img
                            src={review.reviewer.avatar_url}
                            alt={review.reviewer.name}
                            className="w-12 h-12 rounded-full"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#20263e] to-[#c5ae8c] flex items-center justify-center text-white font-semibold">
                            {review.reviewer.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-[#20263e]">
                              {review.reviewer.name}
                            </h4>
                            <Link
                              href={`/projects/${review.project.id}`}
                              className="text-sm text-gray-500 hover:text-[#c5ae8c]"
                            >
                              專案：{review.project.title}
                            </Link>
                          </div>
                          <div className="text-right">
                            <StarRating
                              rating={review.rating}
                              size="sm"
                              showNumber={false}
                            />
                            <div className="text-xs text-gray-500 mt-1">
                              {formatDate(review.created_at)}
                            </div>
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-gray-700 mb-2">{review.comment}</p>
                        )}
                        {review.tags && Array.isArray(review.tags) && review.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {review.tags.map((tag, index) => (
                              <Badge
                                key={index}
                                variant="default"
                                size="sm"
                                className="bg-gray-100 text-gray-700"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {user._count && user._count.reviews_received > reviews.length && (
                <div className="mt-6 text-center">
                  <Link href={`/users/${userId}/reviews`}>
                    <Button variant="outline" size="sm">
                      查看所有評價 ({user._count.reviews_received})
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 如果沒有評價 */}
        {reviews.length === 0 && displayRating === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              尚無評價
            </CardContent>
          </Card>
        )}
      </div>
      <Footer />
    </div>
  );
}
