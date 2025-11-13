"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

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
    rating: number;
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
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
      });

      if (searchKeyword) {
        params.set("keyword", searchKeyword);
      }

      if (selectedTags.length > 0) {
        params.set("tags", selectedTags.join(","));
      }

      const response = await fetch(`/api/v1/projects?${params}`);
      if (response.ok) {
        const data = await response.json();
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
      } else {
        console.error("Failed to fetch projects:", response.status);
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPopularTags = async () => {
    try {
      const response = await fetch("/api/v1/tags?category=tech&limit=10");
      if (response.ok) {
        const data = await response.json();
        const tags = data.data?.map((tag: any) => tag.name) || [];
        setPopularTags(tags);
      } else {
        // 如果 API 還沒準備好，使用預設標籤
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

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#20263e] mb-4">探索案件</h1>
          <p className="text-gray-700">
            瀏覽最新的軟體開發案件，找到適合您的專案
          </p>
        </div>

        {/* 搜尋與篩選 */}
        <Card className="mb-6">
          <div className="p-6">
            <div className="mb-4">
              <input
                type="text"
                placeholder="搜尋案件標題或描述..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#20263e]"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                熱門標籤
              </h3>
              <div className="flex flex-wrap gap-2">
                {popularTags.map((tag) => (
                  <button
                    key={tag}
                    className={`px-3 py-1 rounded-full text-sm ${
                      selectedTags.includes(tag)
                        ? "bg-[#20263e] text-white"
                        : "bg-white text-gray-700 border border-gray-300 hover:border-[#20263e]"
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
        </Card>

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
      </main>

      <Footer />
    </div>
  );
}

