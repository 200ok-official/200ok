"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { apiGet } from "@/lib/api";

interface Project {
  id: string;
  title: string;
  description: string;
  budget_min: number;
  budget_max: number;
  status: string;
  created_at: string;
  client: {
    name: string;
    avatar_url?: string;
    rating: number | null;
  };
  tags: Array<{
    tag: {
      name: string;
      color: string;
    };
  }>;
  _count: {
    bids: number;
  };
}

export default function ProjectsPage() {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [popularTags, setPopularTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchProjects();
    fetchPopularTags();
  }, [searchKeyword, selectedTags]);

  const fetchProjects = async (loadMore = false) => {
    try {
      const currentPage = loadMore ? page + 1 : 1;
      const params: Record<string, string> = {
        page: currentPage.toString(),
        limit: "10",
      };

      if (searchKeyword) {
        params.keyword = searchKeyword;
      }

      if (selectedTags.length > 0) {
        params.tags = selectedTags.join(",");
      }

      const data = await apiGet("/api/v1/projects", params);
      // API 回應格式: { success: true, data: { projects: [...], pagination: {...} } }
      const newProjects = data.data?.projects || [];

      if (loadMore) {
        setProjects(prev => [...prev, ...newProjects]);
        setPage(currentPage);
      } else {
        setProjects(newProjects);
        setPage(1);
      }

      setHasMore(newProjects.length === 10);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPopularTags = async () => {
    try {
      const data = await apiGet("/api/v1/tags", { category: "tech", limit: "10" });
      const tags = data.data?.map((tag: any) => tag.name) || [];
      setPopularTags(tags);
    } catch (error) {
      console.error("Failed to fetch popular tags:", error);
      // 使用預設標籤作為後備
      setPopularTags([
        "React",
        "Vue",
        "Next.js",
        "Node.js",
        "Python",
        "電商",
        "App",
        "LineBot",
        "UI/UX",
      ]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#e6dfcf]">
      <Navbar />

      <main className="flex-1 w-full pt-24 px-4 pb-8">
        {/* Full-width Rounded Hero Section */}
        <div className="w-full max-w-[98%] mx-auto bg-[#20263e] rounded-[2.5rem] py-20 px-6 md:px-12 shadow-2xl overflow-hidden relative mb-12">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-white rounded-full blur-[100px]"></div>
            <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] bg-[#c5ae8c] rounded-full blur-[120px]"></div>
          </div>

          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
              探索案件
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              瀏覽最新的軟體開發案件，找到適合您的專案
            </p>

            {/* 搜尋與篩選 */}
            <div className="mb-10 relative">
              <input
                type="text"
                placeholder="搜尋案件標題或描述..."
                className="w-full px-8 py-5 text-lg border-none rounded-full focus:outline-none focus:ring-4 focus:ring-[#c5ae8c]/50 transition bg-white text-[#20263e] placeholder:text-gray-400 shadow-lg"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#20263e] text-white p-3 rounded-full hover:bg-[#2d3550] transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>

            <div>
              <h3 className="text-sm font-bold text-[#c5ae8c] mb-6 uppercase tracking-widest">
                熱門標籤
              </h3>
              <div className="flex flex-wrap gap-3 justify-center">
                {popularTags.map((tag) => (
                  <button
                    key={tag}
                    className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                      selectedTags.includes(tag)
                        ? "bg-white text-[#20263e] shadow-[0_0_15px_rgba(255,255,255,0.3)] transform scale-105"
                        : "bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:border-white/40 backdrop-blur-sm"
                    }`}
                    onClick={() => {
                      if (selectedTags.includes(tag)) {
                        setSelectedTags(selectedTags.filter((t) => t !== tag));
                      } else {
                        setSelectedTags([...selectedTags, tag]);
                      }
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4">
          {/* 載入狀態 */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#20263e]"></div>
            <p className="mt-4 text-[#c5ae8c]">載入中...</p>
          </div>
        )}

        {/* 案件列表 */}
        {!loading && projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}

        {/* 空狀態 */}
        {!loading && projects.length === 0 && (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-16 w-16 text-[#c5ae8c] mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-[#20263e] mb-2">
              目前沒有符合條件的案件
            </h3>
            <p className="text-[#c5ae8c] mb-6">
              請嘗試調整搜尋條件或稍後再來查看
            </p>
            <Link href="/projects/new" className="inline-block">
              <Button className="bg-[#20263e] hover:bg-[#2d3550] text-white">
                成為第一個發布案件的人
              </Button>
            </Link>
          </div>
        )}

        {/* 載入更多 */}
        {!loading && projects.length > 0 && hasMore && (
          <div className="flex justify-center mt-8">
            <Button
              variant="outline"
              onClick={() => fetchProjects(true)}
              className="text-[#20263e] border-[#c5ae8c] hover:bg-[#e6dfcf]"
            >
              載入更多案件
            </Button>
          </div>
        )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

