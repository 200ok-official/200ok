"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroBanner } from "@/components/layout/HeroBanner";
import { DualScrollSection } from "@/components/home/DualScrollSection";
import { FeatureSection } from "@/components/home/FeatureSection";
import { WorkflowSection } from "@/components/home/WorkflowSection";
import { CTASection } from "@/components/home/CTASection";
import { apiGet, isAuthenticated } from "@/lib/api";

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
    id: string;
    name: string;
    avatar_url?: string;
    rating: number | null;
  };
  bids_count?: number;
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

  // 計算工程師的資訊完整度分數
  const calculateCompletenessScore = (freelancer: Freelancer): number => {
    let score = 0;
    
    // 基本資訊 (最多 40 分)
    if (freelancer.name) score += 10;
    if (freelancer.avatar_url) score += 10;
    if (freelancer.bio && freelancer.bio.length > 20) score += 20; // 有意義的自我介紹
    
    // 專業資訊 (最多 60 分)
    if (freelancer.skills && freelancer.skills.length > 0) {
      score += Math.min(freelancer.skills.length * 5, 30); // 每個技能 5 分，最多 30 分
    }
    if (freelancer.hourly_rate && freelancer.hourly_rate > 0) score += 15;
    if (freelancer.rating !== null && freelancer.rating > 0) score += 15;
    
    return score;
  };

  // 案件載入完成後，再載入工程師
  const fetchFreelancers = useCallback(async () => {
    // 防止重複調用（如果已經請求過，則跳過）
    if (freelancersRequested.current) {
      return;
    }
    
    freelancersRequested.current = true;
    setFreelancersLoading(true);
    try {
      const freelancersData = await apiGet("/api/v1/users/search", { limit: "50" }); // 增加請求數量以便篩選
      // API 回應格式: { success: true, data: [...], pagination: {...} }
      const freelancers = freelancersData.data || [];
      
      // 排序：1) 評分從高到低 2) 資訊完整度從高到低
      const sortedFreelancers = freelancers.sort((a: Freelancer, b: Freelancer) => {
        // 首先按評分排序（從高到低）
        // 有評分的優先於沒有評分的
        const ratingA = a.rating ?? -1; // null 或 undefined 設為 -1，讓它們排在最後
        const ratingB = b.rating ?? -1;
        
        if (ratingB !== ratingA) {
          return ratingB - ratingA;
        }
        
        // 評分相同時，按資訊完整度排序（從高到低）
        const scoreA = calculateCompletenessScore(a);
        const scoreB = calculateCompletenessScore(b);
        
        return scoreB - scoreA;
      });
      
      // 取前 8 名
      setRecommendedFreelancers(sortedFreelancers.slice(0, 8));
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

      {/* Redesigned Sections with Interactions */}
      <FeatureSection />
      
      <WorkflowSection />
      
      <CTASection />

      <Footer />
    </div>
  );
}
