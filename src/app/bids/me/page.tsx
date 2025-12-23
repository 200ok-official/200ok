"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/Badge";
import { apiGet } from "@/lib/api";

interface MyBid {
  id: string;
  project_id: string;
  proposal: string;
  bid_amount: number | null;
  estimated_days: number | null;
  status: string;
  created_at: string;
  project: {
    id: string;
    title: string;
    status: string;
    budget_min: number | null;
    budget_max: number | null;
    client: {
      id: string;
      name: string;
      avatar_url: string | null;
      rating: number | null;
    } | null;
  } | null;
}

export default function MyBidsPage() {
  const router = useRouter();
  const [bids, setBids] = useState<MyBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMyBids();
  }, []);

  const fetchMyBids = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await apiGet("/api/v1/bids/me");
      
      if (response.success && response.data) {
        setBids(response.data.bids || []);
      } else {
        setError("無法載入投標列表");
      }
    } catch (err: any) {
      console.error("Failed to fetch my bids:", err);
      if (err.message?.includes("401") || err.message?.includes("Unauthorized")) {
        router.push("/login");
      } else {
        setError(err.message || "載入投標時發生錯誤");
      }
    } finally {
      setLoading(false);
    }
  };

  const getBidStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: { label: "待審核", className: "bg-yellow-100 text-yellow-800" },
      accepted: { label: "已接受", className: "bg-green-100 text-green-800" },
      rejected: { label: "已拒絕", className: "bg-red-100 text-red-800" },
      withdrawn: { label: "已撤回", className: "bg-gray-100 text-gray-800" },
    };
    
    const statusInfo = statusMap[status] || { label: status, className: "bg-gray-100 text-gray-800" };
    return (
      <Badge className={statusInfo.className}>
        {statusInfo.label}
      </Badge>
    );
  };

  const getProjectStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      draft: { label: "草稿", className: "bg-gray-100 text-gray-800" },
      open: { label: "開放中", className: "bg-green-100 text-green-800" },
      in_progress: { label: "進行中", className: "bg-blue-100 text-blue-800" },
      completed: { label: "已完成", className: "bg-purple-100 text-purple-800" },
      cancelled: { label: "已取消", className: "bg-red-100 text-red-800" },
    };
    
    const statusInfo = statusMap[status] || { label: status, className: "bg-gray-100 text-gray-800" };
    return (
      <Badge className={statusInfo.className}>
        {statusInfo.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatAmount = (amount: number | null) => {
    if (!amount) return "待議";
    return `NT$ ${amount.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f5f3ed]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#20263e]"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f5f3ed]">
        <Navbar />
        <main className="flex-1 py-10 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded">
              <p className="font-medium">{error}</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f3ed]">
      <Navbar />
      <main className="flex-1 py-10 px-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 頁面標題 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#20263e] mb-2">我的投標</h1>
            <p className="text-[#c5ae8c]">查看您投標的所有案件</p>
          </div>

          {/* 投標列表 */}
          {bids.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-[#c5ae8c] text-lg mb-4">目前還沒有投標任何案件，去探索案件開始投標吧！</p>
              <Link
                href="/projects"
                className="inline-block px-6 py-3 bg-[#20263e] text-white rounded-lg hover:bg-[#2a3450] transition-colors"
              >
                探索案件
              </Link>
            </div>
          ) : (
            <div>
              {bids.map((bid, index) => (
                <React.Fragment key={bid.id}>
                  <Link
                    href={`/projects/${bid.project_id}`}
                    className="block py-6 group"
                  >
                    <div className="flex items-center justify-between">
                      {/* 左側：投標資訊 */}
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h2 className="text-xl font-bold text-[#20263e]">
                            {bid.project?.title || "案件已刪除"}
                          </h2>
                          {getBidStatusBadge(bid.status)}
                          {bid.project && getProjectStatusBadge(bid.project.status)}
                        </div>
                        <div className="flex items-center gap-6 text-sm text-[#c5ae8c]">
                          <span>投標金額：{formatAmount(bid.bid_amount)}</span>
                          {bid.estimated_days && (
                            <span>預計天數：{bid.estimated_days} 天</span>
                          )}
                          {bid.project?.client && (
                            <span>發案者：{bid.project.client.name}</span>
                          )}
                          <span>投標時間：{formatDate(bid.created_at)}</span>
                        </div>
                      </div>
                      {/* 右側：箭頭 */}
                      <div className="ml-4">
                        <svg
                          className="w-6 h-6 text-[#c5ae8c] group-hover:text-[#20263e] transition-colors"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </Link>
                  {/* 深藍色分隔線 */}
                  {index < bids.length - 1 && (
                    <div className="border-b-2 border-[#20263e]"></div>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}


