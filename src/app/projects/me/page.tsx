"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/Badge";
import { apiGet, apiPut } from "@/lib/api";

interface MyProject {
  id: string;
  title: string;
  status: string;
  budget_min: number | null;
  budget_max: number | null;
  created_at: string;
  bids_count: number;
}

export default function MyProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<MyProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMyProjects();
  }, []);

  const fetchMyProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await apiGet("/api/v1/projects/me/list");
      
      if (response.success && response.data) {
        setProjects(response.data.projects || []);
      } else {
        setError("無法載入案件列表");
      }
    } catch (err: any) {
      console.error("Failed to fetch my projects:", err);
      if (err.message?.includes("401") || err.message?.includes("Unauthorized")) {
        router.push("/login");
      } else {
        setError(err.message || "載入案件時發生錯誤");
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
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

  const handleStatusToggle = async (e: React.MouseEvent, project: MyProject) => {
    e.preventDefault();
    e.stopPropagation();

    // 只允许 open、closed、completed 状态切换
    if (project.status !== 'open' && project.status !== 'closed' && project.status !== 'completed') return;

    // 切换逻辑：open → closed, closed → open, completed → closed
    let newStatus: string;
    let actionName: string;
    
    if (project.status === 'open') {
      newStatus = 'closed';
      actionName = '關閉';
    } else if (project.status === 'completed') {
      newStatus = 'closed';
      actionName = '標記為已關閉';
    } else { // closed
      newStatus = 'open';
      actionName = '重新開放';
    }

    if (!confirm(`確定要${actionName}此案件嗎？`)) return;
    
    try {
      const response = await apiPut(`/api/v1/projects/${project.id}`, { status: newStatus });
      
      if (response.success) {
        setProjects(projects.map(p => 
          p.id === project.id ? { ...p, status: newStatus } : p
        ));
      } else {
        alert(response.message || "更新狀態失敗");
      }
    } catch (err: any) {
      console.error("Failed to update status:", err);
      alert(err.message || "更新狀態時發生錯誤");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return "待議";
    if (min && max) {
      return `NT$ ${min.toLocaleString()} - ${max.toLocaleString()}`;
    }
    if (min) {
      return `NT$ ${min.toLocaleString()} 以上`;
    }
    return `NT$ ${max?.toLocaleString()} 以下`;
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
            <h1 className="text-3xl font-bold text-[#20263e] mb-2">我的案件</h1>
            <p className="text-[#c5ae8c]">管理您發起的所有專案</p>
          </div>

          {/* 案件列表 */}
          {projects.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-[#c5ae8c] text-lg mb-4">目前還沒有發起任何案件，按右上角的加號來發起第一則案件吧！</p>
            </div>
          ) : (
            <div>
              {projects.map((project, index) => (
                <React.Fragment key={project.id}>
                  <Link
                    href={`/projects/${project.id}`}
                    className="block py-6 group"
                  >
                    <div className="flex items-center justify-between">
                      {/* 左側：案件資訊 */}
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h2 className="text-xl font-bold text-[#20263e]">
                            {project.title}
                          </h2>
                          {getStatusBadge(project.status)}
                          
                          {(project.status === 'open' || project.status === 'closed' || project.status === 'completed') && (
                            <button
                              onClick={(e) => handleStatusToggle(e, project)}
                              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                                project.status === 'open' 
                                  ? 'border-gray-400 text-gray-600 hover:bg-gray-100' 
                                  : 'border-green-600 text-green-600 hover:bg-green-50'
                              }`}
                            >
                              {project.status === 'open' ? '關閉案件' : project.status === 'completed' ? '標記為已關閉' : '重新開放'}
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-6 text-sm text-[#c5ae8c]">
                          <span>預算：{formatBudget(project.budget_min, project.budget_max)}</span>
                          <span>提案數：{project.bids_count}</span>
                          <span>建立時間：{formatDate(project.created_at)}</span>
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
                  {index < projects.length - 1 && (
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

