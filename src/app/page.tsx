"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroBanner } from "@/components/layout/HeroBanner";
import { Button } from "@/components/ui/Button";
import { DualScrollSection } from "@/components/home/DualScrollSection";
import { apiGet, isAuthenticated } from "@/lib/api";

interface Project {
  id: string;
  title: string;
  budget_min: number;
  budget_max: number;
  status: string;
  created_at: string;
  client: {
    id: string;
    name: string;
  };
}

interface Freelancer {
  id: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  skills: string[];
  rating: number | null;
  hourly_rate?: number | null;
  created_at: string;
}

export default function HomePage() {
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [recommendedFreelancers, setRecommendedFreelancers] = useState<Freelancer[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [freelancersLoading, setFreelancersLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // 使用 ref 防止重複初始化
  const hasInitialized = useRef(false);
  const freelancersRequested = useRef(false);

  // 案件載入完成後，再載入工程師
  const fetchFreelancers = useCallback(async () => {
    // 防止重複調用（如果已經請求過，則跳過）
    if (freelancersRequested.current) {
      return;
    }
    
    freelancersRequested.current = true;
    setFreelancersLoading(true);
    try {
      const freelancersData = await apiGet("/api/v1/users/search", { limit: "8" });
      // API 回應格式: { success: true, data: [...], pagination: {...} }
      setRecommendedFreelancers(freelancersData.data || []);
    } catch (freelancerError) {
      console.error("Error fetching freelancers:", freelancerError);
      setRecommendedFreelancers([]);
    } finally {
      setFreelancersLoading(false);
    }
  }, []);

  // 優先載入案件
  const fetchProjects = useCallback(async () => {
    setProjectsLoading(true);
    try {
      const projectsData = await apiGet("/api/v1/projects", { limit: "8", status: "open" });
      // API 回應格式: { success: true, data: { projects: [...], pagination: {...} } }
      setRecentProjects(projectsData.data?.projects || []);
    } catch (projectError) {
      console.error("Error fetching projects:", projectError);
      setRecentProjects([]);
    } finally {
      setProjectsLoading(false);
      // 案件載入完成後，再載入工程師
      fetchFreelancers();
    }
  }, [fetchFreelancers]);

  useEffect(() => {
    // 防止重複初始化（React StrictMode 會導致執行兩次）
    if (hasInitialized.current) {
      return;
    }
    
    hasInitialized.current = true;
    
    // 檢查是否已登入
    setIsLoggedIn(isAuthenticated());
    
    // 先載入案件（優先顯示）
    fetchProjects();
  }, [fetchProjects]);

  return (
    <div className="min-h-screen flex flex-col bg-[#e6dfcf]">
      <Navbar />

      {/* Hero Banner */}
      <HeroBanner />

      {/* Dual Scroll Section for Projects and Freelancers */}
      <DualScrollSection 
        projects={recentProjects}
        freelancers={recommendedFreelancers}
        projectsLoading={projectsLoading}
        freelancersLoading={freelancersLoading}
        isLoggedIn={isLoggedIn}
      />

      {/* Original Content - Compressed */}
      <section className="py-8 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-[#20263e] mb-2">
              為什麼選擇 200 OK？
            </h2>
            <p className="text-sm text-[#c5ae8c] mb-4">
              專為軟體工程設計，與綜合型接案平台做出區隔
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-[#20263e] text-white rounded-full flex items-center justify-center text-lg mx-auto mb-3">
                🤖
              </div>
              <h3 className="text-lg font-semibold text-[#20263e] mb-2">AI 輔助需求分析</h3>
              <p className="text-sm text-[#c5ae8c]">
                透過引導性類型特化步驟與 AI 輔助，讓您清楚說明需求，了解需求等級、描述完整度與市場定位。
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-[#20263e] text-white rounded-full flex items-center justify-center text-lg mx-auto mb-3">
                💻
              </div>
              <h3 className="text-lg font-semibold text-[#20263e] mb-2">專為工程師設計</h3>
              <p className="text-sm text-[#c5ae8c]">
                專屬技能展示空間，讓接案工程師節省更多力氣去釐清需求，接案流程更流暢。
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-[#20263e] text-white rounded-full flex items-center justify-center text-lg mx-auto mb-3">
                ⚡
              </div>
              <h3 className="text-lg font-semibold text-[#20263e] mb-2">引導式發案流程</h3>
              <p className="text-sm text-[#c5ae8c]">
                即使不懂技術也能透過引導式問答清楚描述需求，快速找到合適的軟體開發者。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Compressed */}
      <section className="py-8 px-4 bg-[#e6dfcf]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-[#20263e] mb-6">運作流程</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { step: "1", title: "發布案件", description: "AI 引導式問答，協助清楚描述軟體需求" },
              { step: "2", title: "AI 需求分析", description: "了解需求等級、完整度與市場定位" },
              { step: "3", title: "收到投標", description: "專業軟體工程師提交提案與報價" },
              { step: "4", title: "完成專案", description: "流暢溝通，驗收成果，互相評價" },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-10 h-10 bg-[#c5ae8c] text-white rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-2">
                  {item.step}
                </div>
                <h3 className="text-sm font-semibold text-[#20263e] mb-1">{item.title}</h3>
                <p className="text-xs text-[#20263e] leading-tight">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Compressed */}
      <section className="py-8 px-4 bg-[#20263e] text-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-xl font-bold mb-4">準備開始您的軟體專案了嗎？</h2>
          <p className="text-sm mb-6 opacity-90">
            立即加入 200 OK，專為軟體工程設計的接案平台，透過 AI 輔助與引導式流程，讓需求更清晰，合作更順暢。
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/projects/new">
              <Button variant="secondary" size="sm">
                發布案件
              </Button>
            </Link>
            <Link href="/projects">
              <Button variant="outline" size="sm" className="border-white text-white hover:bg-white hover:text-[#20263e]">
                查看案件
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
      </div>
  );
}
