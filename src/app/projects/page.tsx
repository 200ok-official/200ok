"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { Button } from "@/components/ui/Button";
import { apiGet } from "@/lib/api";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";

interface Project {
  id: string;
  title: string;
  description: string;
  budget_min: number;
  budget_max: number;
  status: string;
  created_at: string;
  required_skills?: string[];
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
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [popularSkills, setPopularSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [columns, setColumns] = useState<Project[][]>([[], [], []]);
  const masonryRef = useRef<HTMLDivElement>(null);
  
  // Animation states
  const { scrollY } = useScroll();
  const [isCompact, setIsCompact] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    // 當滾動超過 50px 時切換為緊湊模式
    // 添加一些緩衝以避免頻繁切換
    if (latest > 100 && !isCompact) {
      setIsCompact(true);
    } else if (latest < 50 && isCompact) {
      setIsCompact(false);
    }
  });

  useEffect(() => {
    fetchProjects();
    fetchPopularSkills();
  }, [searchKeyword, selectedSkills]);

  // Masonry 佈局：將專案分配到不同的列，保持從左到右的順序
  useEffect(() => {
    if (projects.length === 0) {
      setColumns([[], [], []]);
      return;
    }

    const numColumns = typeof window !== 'undefined' 
      ? window.innerWidth >= 1024 ? 3 : window.innerWidth >= 768 ? 2 : 1
      : 3;
    
    const newColumns: Project[][] = Array.from({ length: numColumns }, () => []);
    
    // 按照順序將專案分配到最短的列
    projects.forEach((project) => {
      // 找到最短的列
      const shortestColumnIndex = newColumns.reduce((minIndex, column, index) => 
        column.length < newColumns[minIndex].length ? index : minIndex, 0
      );
      newColumns[shortestColumnIndex].push(project);
    });
    
    setColumns(newColumns);
  }, [projects]);

  // 處理視窗大小變化
  useEffect(() => {
    const handleResize = () => {
      if (projects.length === 0) return;
      
      const numColumns = window.innerWidth >= 1024 ? 3 : window.innerWidth >= 768 ? 2 : 1;
      const newColumns: Project[][] = Array.from({ length: numColumns }, () => []);
      
      projects.forEach((project) => {
        const shortestColumnIndex = newColumns.reduce((minIndex, column, index) => 
          column.length < newColumns[minIndex].length ? index : minIndex, 0
        );
        newColumns[shortestColumnIndex].push(project);
      });
      
      setColumns(newColumns);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [projects]);

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

      if (selectedSkills.length > 0) {
        params.skills = selectedSkills.join(",");
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

  const fetchPopularSkills = async () => {
    // 不再從 API 取得 tags，直接使用預設的熱門技能
    setPopularSkills([
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
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#e6dfcf]">
      <Navbar />

      <main className="flex-1 w-full pt-16 pb-8 px-8 md:px-16 lg:px-40 xl:px-40 2xl:px-40">
        {/* Sticky Hero Section Container */}
        <div className="sticky top-16 z-30 mb-8 -mx-4 md:-mx-8 lg:-mx-12 transition-all duration-300 pointer-events-none">
          {/* 
            pointer-events-none on container to let clicks pass through to content below when not hovering the card,
            but we need to re-enable pointer-events on the card itself.
          */}
          <motion.div 
            layout
            className={`
              mx-auto bg-[#20263e] shadow-2xl relative overflow-hidden pointer-events-auto
              ${isCompact ? 'rounded-b-2xl shadow-lg' : 'rounded-[2.5rem] mt-8'}
            `}
            initial={false}
            animate={{
              width: isCompact ? "100%" : "100%", // 可以根據需要調整寬度，這裡保持全寬但 padding 不同
              maxWidth: isCompact ? "100%" : "72rem", // max-w-6xl = 72rem
              paddingTop: isCompact ? "1rem" : "5rem",
              paddingBottom: isCompact ? "1rem" : "5rem",
              paddingLeft: isCompact ? "1.5rem" : "3rem",
              paddingRight: isCompact ? "1.5rem" : "3rem",
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Decorative Background Elements - Fade out in compact mode */}
            <motion.div 
              className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none"
              animate={{ opacity: isCompact ? 0 : 0.1 }}
            >
              <div className="absolute -top-24 -left-24 w-96 h-96 bg-white rounded-full blur-[100px]"></div>
              <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] bg-[#c5ae8c] rounded-full blur-[120px]"></div>
            </motion.div>

            <div className={`relative z-10 mx-auto ${isCompact ? 'max-w-7xl flex items-center gap-6' : 'max-w-4xl text-center'}`}>
              
              {/* Title & Description - Hide in compact mode */}
              <AnimatePresence>
                {!isCompact && (
                  <motion.div
                    initial={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                    transition={{ duration: 0.2 }}
                  >
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
                      探索案件
                    </h1>
                    <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                      瀏覽最新的軟體開發案件，找到適合您的專案
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 搜尋與篩選區域 */}
              <motion.div 
                layout 
                className={`flex-1 ${isCompact ? 'flex items-center gap-4' : 'w-full'}`}
              >
                {/* Search Bar */}
                <motion.div 
                  layout
                  className={`relative ${isCompact ? 'flex-1 max-w-xl' : 'mb-10 w-full'}`}
                >
                  <input
                    type="text"
                    placeholder={isCompact ? "搜尋案件..." : "搜尋案件標題或描述..."}
                    className={`w-full border-none focus:outline-none focus:ring-4 focus:ring-[#c5ae8c]/50 transition bg-white text-[#20263e] placeholder:text-gray-400
                      ${isCompact ? 'py-2.5 px-5 rounded-full text-sm' : 'px-8 py-5 text-lg rounded-full shadow-lg'}
                    `}
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                  />
                  <button className={`absolute right-1 top-1/2 -translate-y-1/2 bg-[#20263e] text-white rounded-full hover:bg-[#2d3550] transition-colors
                    ${isCompact ? 'p-1.5 right-1.5' : 'p-3 right-3'}
                  `}>
                    <svg className={`${isCompact ? 'w-4 h-4' : 'w-6 h-6'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </motion.div>

                {/* Filter Tags */}
                <motion.div 
                  layout
                  className={`${isCompact ? 'flex-1 overflow-x-auto no-scrollbar mask-gradient-right' : ''}`}
                >
                   <AnimatePresence>
                    {!isCompact && (
                      <motion.h3 
                        initial={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        className="text-sm font-bold text-[#c5ae8c] mb-6 uppercase tracking-widest"
                      >
                        熱門技能
                      </motion.h3>
                    )}
                   </AnimatePresence>
                  
                  <motion.div 
                    layout
                    className={`flex ${isCompact ? 'gap-2 items-center pr-4' : 'flex-wrap gap-3 justify-center'}`}
                  >
                    {popularSkills.map((skill) => (
                      <motion.button
                        layout
                        key={skill}
                        className={`font-medium transition-all duration-300 whitespace-nowrap
                          ${isCompact 
                            ? `px-3 py-1.5 rounded-full text-xs ${selectedSkills.includes(skill) ? "bg-white text-[#20263e]" : "bg-white/10 text-white hover:bg-white/20"}`
                            : `px-5 py-2.5 rounded-full text-sm ${selectedSkills.includes(skill) ? "bg-white text-[#20263e] shadow-[0_0_15px_rgba(255,255,255,0.3)] transform scale-105" : "bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:border-white/40 backdrop-blur-sm"}`
                          }
                        `}
                        onClick={() => {
                          if (selectedSkills.includes(skill)) {
                            setSelectedSkills(selectedSkills.filter((s) => s !== skill));
                          } else {
                            setSelectedSkills([...selectedSkills, skill]);
                          }
                        }}
                      >
                        {skill}
                      </motion.button>
                    ))}
                  </motion.div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* 載入狀態 */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#20263e]"></div>
            <p className="mt-4 text-[#c5ae8c]">載入中...</p>
          </div>
        )}

        {/* 案件列表 - Masonry Layout (瀑布流，從左到右，從上到下) */}
        {!loading && projects.length > 0 && (
          <div ref={masonryRef} className="flex gap-6">
            {columns.map((column, columnIndex) => (
              <div key={columnIndex} className="flex-1 flex flex-col gap-6">
                {column.map((project) => (
                  <div key={project.id}>
                    <ProjectCard project={project} />
                  </div>
                ))}
              </div>
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
