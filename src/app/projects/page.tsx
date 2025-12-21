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
  ai_summary?: string;
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
  const [budgetRange, setBudgetRange] = useState<{ min: string; max: string }>({ min: "", max: "" });
  const [showBudgetFilter, setShowBudgetFilter] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [popularSkills, setPopularSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [columns, setColumns] = useState<Project[][]>([[], [], []]);
  const masonryRef = useRef<HTMLDivElement>(null);
  const budgetFilterRef = useRef<HTMLDivElement>(null);
  const budgetBtnRef = useRef<HTMLButtonElement>(null);
  
  // Animation states
  const { scrollY } = useScroll();
  const [isCompact, setIsCompact] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useMotionValueEvent(scrollY, "change", (latest) => {
    // 如果動畫正在進行中，忽略所有滾動事件，確保動畫完整執行
    if (isAnimating) {
      return;
    }

    // 雙閾值控制 (Hysteresis)：
    // collapseThreshold: 下滑超過此值 -> 變小 (Compact)
    // expandThreshold: 上滑回到此值以內 -> 變大 (Expand)
    
    // 下滑：只要滑一點點 (100px) 就變小，讓用戶專注於內容
    const collapseThreshold = 100;
    
    // 上滑：必須滑到非常接近頂部 (10px) 才展開 Hero，
    // 這樣在中間往上滑看舊內容時，Hero 不會突然變大擋路
    const expandThreshold = 1;
    
    if (latest > collapseThreshold && !isCompact) {
      setIsCompact(true);
      setIsAnimating(true);
      
      // 清除之前的 timeout（如果有的話）
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      
      // 動畫持續時間 300ms，加上一點 buffer（50ms）確保完全結束
      animationTimeoutRef.current = setTimeout(() => {
        setIsAnimating(false);
      }, 350);
      
    } else if (latest < expandThreshold && isCompact) {
      // 展開時，強制滾動到頂部，避免佈局變化導致的滾動位置改變
      window.scrollTo({ top: 0, behavior: 'instant' });
      
      setIsCompact(false);
      setIsAnimating(true);
      
      // 清除之前的 timeout（如果有的話）
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      
      // 展開動畫需要更長的鎖定時間（600ms），因為：
      // 1. 動畫本身需要 300ms
      // 2. 佈局變化（hero section 變大）會影響頁面高度
      // 3. 需要額外時間讓瀏覽器穩定滾動位置
      animationTimeoutRef.current = setTimeout(() => {
        setIsAnimating(false);
      }, 600);
    }
  });

  useEffect(() => {
    fetchProjects();
    fetchPopularSkills();
  }, [searchKeyword, selectedSkills, budgetRange]);

  // 清理 animation timeout
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 如果點擊的是按鈕本身，讓按鈕自己的 onClick 處理就好
      if (budgetBtnRef.current && budgetBtnRef.current.contains(event.target as Node)) {
        return;
      }
      
      if (budgetFilterRef.current && !budgetFilterRef.current.contains(event.target as Node)) {
        setShowBudgetFilter(false);
      }
    };

    if (showBudgetFilter) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showBudgetFilter]);

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

      if (budgetRange.min) {
        params.budget_min = budgetRange.min;
      }
      if (budgetRange.max) {
        params.budget_max = budgetRange.max;
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
        <div className="sticky top-20 z-30 pointer-events-none">
          {/* 
            pointer-events-none on container to let clicks pass through to content below when not hovering the card,
            but we need to re-enable pointer-events on the card itself.
          */}
          <motion.div 
            layout
            className={`
              mx-auto bg-[#20263e] shadow-2xl relative pointer-events-auto
              ${isCompact ? 'rounded-[2rem] shadow-lg max-w-6xl' : 'rounded-[2.5rem] mt-8 max-w-6xl'}
            `}
            style={{ overflow: isCompact ? 'visible' : 'hidden' }}
            initial={false}
            animate={{
              width: "100%", 
              paddingTop: isCompact ? "0.75rem" : "5rem",
              paddingBottom: isCompact ? "0.75rem" : "5rem",
              paddingLeft: isCompact ? "1.5rem" : "3rem",
              paddingRight: isCompact ? "1.5rem" : "3rem",
            }}
            transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
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
                className={`flex-1 ${isCompact ? 'flex items-center gap-4' : 'w-full'} relative z-50`}
              >
                {/* Search Bar & Budget Filter */}
                <div className={`flex gap-4 ${isCompact ? 'flex-1 max-w-xl' : 'mb-10 w-full flex-col'}`}>
                  <motion.div 
                    layout
                    className={`relative ${isCompact ? 'w-full' : 'w-full'}`}
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
                    
                    <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-2 ${isCompact ? 'right-1.5' : 'right-3'}`}>
                       {/* Budget Filter Button */}
                       <button
                        ref={budgetBtnRef}
                        className={`text-[#20263e] hover:bg-gray-100 rounded-full transition-colors flex items-center gap-1
                          ${isCompact ? 'p-1.5' : 'px-4 py-2 bg-gray-50 mr-2'}
                          ${(budgetRange.min || budgetRange.max) ? 'text-[#c5ae8c] font-medium' : ''}
                        `}
                        onClick={() => setShowBudgetFilter(!showBudgetFilter)}
                        title="預算篩選"
                      >
                         <span className={isCompact ? 'hidden' : 'text-sm'}>
                           {(budgetRange.min || budgetRange.max) 
                             ? `${budgetRange.min ? '$'+budgetRange.min : '$0'} - ${budgetRange.max ? '$'+budgetRange.max : '不限'}`
                             : '預算範圍'
                           }
                         </span>
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`${isCompact ? 'w-4 h-4' : 'w-5 h-5'}`}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                      </button>

                      {/* Search Button Icon */}
                      <button className={`bg-[#20263e] text-white rounded-full hover:bg-[#2d3550] transition-colors
                        ${isCompact ? 'p-1.5' : 'p-3'}
                      `}>
                        <svg className={`${isCompact ? 'w-4 h-4' : 'w-6 h-6'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>

                    {/* Budget Filter Popup */}
                    <AnimatePresence>
                      {showBudgetFilter && (
                        <motion.div
                          ref={budgetFilterRef}
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-50 overflow-hidden"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-[#20263e]">預算範圍 (TWD)</h4>
                            <button 
                              onClick={() => {
                                setBudgetRange({ min: "", max: "" });
                                setShowBudgetFilter(false);
                              }}
                              className="text-xs text-[#c5ae8c] hover:text-[#b59b75] font-medium"
                            >
                              清除設定
                            </button>
                          </div>
                          
                          <div className="flex items-center gap-2 mb-4">
                            <div className="relative flex-1">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c5ae8c] text-sm">$</span>
                              <input
                                type="number"
                                placeholder="最低"
                                className="w-full pl-6 pr-2 py-2 border border-[#e6dfcf] rounded-lg text-sm focus:outline-none focus:border-[#c5ae8c] focus:ring-1 focus:ring-[#c5ae8c] text-[#20263e] placeholder:text-[#c5ae8c]/50"
                                value={budgetRange.min}
                                onChange={(e) => setBudgetRange(prev => ({ ...prev, min: e.target.value }))}
                              />
                            </div>
                            <span className="text-[#c5ae8c]">-</span>
                            <div className="relative flex-1">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c5ae8c] text-sm">$</span>
                              <input
                                type="number"
                                placeholder="最高"
                                className="w-full pl-6 pr-2 py-2 border border-[#e6dfcf] rounded-lg text-sm focus:outline-none focus:border-[#c5ae8c] focus:ring-1 focus:ring-[#c5ae8c] text-[#20263e] placeholder:text-[#c5ae8c]/50"
                                value={budgetRange.max}
                                onChange={(e) => setBudgetRange(prev => ({ ...prev, max: e.target.value }))}
                              />
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {[
                              { label: "5k 以下", min: "", max: "5000" },
                              { label: "5k - 20k", min: "5000", max: "20000" },
                              { label: "20k - 50k", min: "20000", max: "50000" },
                              { label: "50k - 100k", min: "50000", max: "100000" },
                              { label: "100k 以上", min: "100000", max: "" },
                            ].map((preset) => (
                              <button
                                key={preset.label}
                                className="px-2 py-1 text-xs rounded-md bg-[#f5f3ed] hover:bg-[#e6dfcf] text-[#20263e] border border-[#e6dfcf] hover:border-[#c5ae8c] transition-colors"
                                onClick={() => setBudgetRange({ min: preset.min, max: preset.max })}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>

                {/* Filter Tags */}
                <motion.div 
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
                  
                  <div className={`flex ${isCompact ? 'gap-2 items-center pr-4' : 'flex-wrap gap-3 justify-center'}`}>
                {popularSkills.map((skill) => (
                  <button
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
                  </button>
                ))}
              </div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* 
          動態間距：
          - 當 hero section 未縮小時，需要足夠的頂部間距來容納完整的 hero section
          - 當 hero section 縮小後，減少間距讓 project cards 剛好對齊到 search bar 下方
        */}
        <div 
          className="max-w-6xl mx-auto transition-all duration-300 ease-in-out"
          style={{ 
            paddingTop: isCompact ? '6rem' : '32rem' // compact: 對齊到縮小的 hero 下方, expanded: 足夠空間給完整 hero
          }}
        >
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
