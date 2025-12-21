"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { formatRelativeTime } from "@/lib/utils";
import { apiGet } from "@/lib/api";
import { 
  CommandLineIcon, 
  CheckIcon,
} from "@heroicons/react/24/outline";

interface ProjectCardProps {
  project: {
    id: string;
    title: string;
    description: string;
    ai_summary?: string;
    budget_min: number;
    budget_max: number;
    status: string;
    created_at: string;
    required_skills?: string[];
    features?: string[]; // 對應 new_features
    deliverables?: string[]; // 對應 new_deliverables
    new_features?: string[];
    new_deliverables?: string[];
    maint_new_features?: string;
    tags?: Array<{
      tag: {
        name: string;
        color: string;
      };
    }>;
    client: {
      name: string;
      avatar_url?: string;
      rating: number | null;
    };
    bids_count?: number;
    _count?: {
      bids: number;
    };
  };
  showActions?: boolean;
  hideClient?: boolean;
  fixedHeight?: boolean;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  showActions = true,
  hideClient = false,
  fixedHeight = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [fullProjectData, setFullProjectData] = useState<any>(null);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);

  // 使用 Intersection Observer 只在卡片進入視窗時才加載數據
  React.useEffect(() => {
    if (!cardRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // 當卡片進入視窗（或接近視窗）時加載數據
          if (entry.isIntersecting && !hasLoadedData) {
            fetchProjectDetails();
          }
        });
      },
      {
        // rootMargin: 提前 300px 開始加載，讓用戶滾動到時數據已準備好
        rootMargin: '300px',
        threshold: 0.01
      }
    );

    observer.observe(cardRef.current);

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, [hasLoadedData]);

  const fetchProjectDetails = async () => {
    if (hasLoadedData) return; // 避免重複加載
    
    try {
      setHasLoadedData(true);
      const data = await apiGet(`/api/v1/projects/${project.id}`);
      if (data.success) {
        setFullProjectData(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch project details:", error);
    }
  };

  const handleHoverStart = () => {
    setIsHovered(true);
  };

  const handleHoverEnd = () => {
    setIsHovered(false);
  };

  // 定義液體流動的動畫變體
  const liquidVariants = {
    initial: { 
      clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",
    },
    hover: { 
      clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      transition: { 
        duration: 0.5, 
        ease: [0.4, 0, 0.2, 1] as const
      }
    }
  };

  // 內容淡入淡出
  const contentVariants = {
    initial: { opacity: 0, y: 10 },
    hover: { 
      opacity: 1, 
      y: 0, 
      transition: { delay: 0.2, duration: 0.3 } 
    }
  };

  return (
    <Link href={`/projects/${project.id}`} className="block h-full">
      <motion.div
        ref={cardRef}
        className="group relative w-full rounded-[2rem] bg-white/40 shadow-none border-2 border-[#c5ae8c] hover:border-[#20263e] overflow-hidden h-full backdrop-blur-sm"
        onHoverStart={handleHoverStart}
        onHoverEnd={handleHoverEnd}
        whileHover={{ y: -5 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        {/* === 1. 原始內容層 (白色背景) === */}
        <div className="relative z-10 p-8 h-full flex flex-col">
           {/* Header: Title */}
           <div className="mb-4 flex justify-between items-start">
             <h3 className="text-2xl font-bold text-[#20263e] tracking-tight leading-tight line-clamp-2" style={{ fontFamily: "'Noto Serif TC', serif" }}>
               {project.title}
             </h3>
           </div>
           
           {/* Price */}
           <div className="mb-6">
              <span className="text-xl font-bold text-[#20263e]" style={{ fontFamily: "'Noto Serif TC', serif" }}>
                ${project.budget_min.toLocaleString()} - ${project.budget_max.toLocaleString()}
              </span>
           </div>
           
           {/* Body: Description - 優先顯示 AI 摘要 */}
           <p className="text-gray-600 text-lg mb-8 leading-relaxed line-clamp-3 flex-grow">
             {project.ai_summary ? project.ai_summary : (project.description || "暫無專案描述")}
           </p>

           {/* Technical Specs Preview */}
           <div className="mb-8 space-y-4">
              {project.required_skills && project.required_skills.length > 0 && (
                <div className="flex items-start gap-3">
                  <CommandLineIcon className="w-5 h-5 text-[#c5ae8c] mt-1 shrink-0" />
                  <div className="flex flex-wrap gap-2">
                    {project.required_skills.slice(0, 3).map((skill, i) => (
                      <span key={i} className="bg-[#f5f3ed] text-[#20263e] px-3 py-1 rounded-full text-sm font-medium">
                        {skill}
                      </span>
                    ))}
                    {project.required_skills.length > 3 && (
                      <span className="text-gray-400 text-xs self-center">+{project.required_skills.length - 3}</span>
                    )}
                  </div>
                </div>
              )}
           </div>

           {/* Footer: Client Info */}
           <div className="pt-6 border-t border-[#20263e]/10 mt-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {project.client.avatar_url ? (
                    <img
                      src={project.client.avatar_url}
                      alt={project.client.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#20263e] flex items-center justify-center text-white text-lg font-medium">
                      {project.client.name[0]}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-bold text-[#20263e]">
                      {project.client.name}
                    </p>
                    <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                      <span className="text-[#fbbf24]">★</span>
                      <span>
                        {project.client.rating !== null ? project.client.rating.toFixed(1) : "N/A"} · {project.bids_count || project._count?.bids || 0} 個投標
                      </span>
                    </p>
                  </div>
                </div>
                <div className="text-xs text-gray-500 font-medium">
                  {formatRelativeTime(project.created_at)}
                </div>
              </div>
           </div>
        </div>

        {/* === 2. 液體填充層 (深色背景) === */}
        <motion.div
          className="absolute inset-0 bg-[#20263e] z-20 flex flex-col p-8 text-white"
          initial="initial"
          animate={isHovered ? "hover" : "initial"}
          variants={liquidVariants}
        >
          <motion.div 
            className="h-full flex flex-col"
            variants={contentVariants}
          >
            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-2 text-[#c5ae8c]" style={{ fontFamily: "'Noto Serif TC', serif" }}>
                {project.title}
              </h3>
              <div className="w-12 h-1 bg-[#c5ae8c] rounded-full"></div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-6">
              {/* 功能需求 Section */}
              {fullProjectData?.new_features && fullProjectData.new_features.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-6 bg-white rounded-full"></div>
                    <h4 className="text-xl font-bold text-white">功能需求</h4>
                  </div>
                  <div className="grid grid-cols-1 gap-y-3 gap-x-4">
                    {fullProjectData.new_features.map((feature: string, i: number) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckIcon className="w-5 h-5 text-white shrink-0" strokeWidth={2.5} />
                        <span className="text-lg text-white/90">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 需交付文件/檔案 Section */}
              {fullProjectData?.new_deliverables && fullProjectData.new_deliverables.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-6 bg-white rounded-full"></div>
                    <h4 className="text-xl font-bold text-white">需交付文件/檔案</h4>
                  </div>
                  <ul className="space-y-3 list-none">
                    {fullProjectData.new_deliverables.map((item: string, i: number) => (
                      <li key={i} className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 bg-white rounded-full shrink-0"></div>
                        <span className="text-lg text-white/90">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 如果沒有數據，顯示項目描述作為後備 */}
              {(!fullProjectData?.new_features || fullProjectData.new_features.length === 0) && 
               (!fullProjectData?.new_deliverables || fullProjectData.new_deliverables.length === 0) && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-6 bg-white rounded-full"></div>
                    <h4 className="text-xl font-bold text-white">項目詳情</h4>
                  </div>
                  <p className="text-lg text-white/90 leading-relaxed">
                    {project.ai_summary ? project.ai_summary : (project.description || "暫無專案描述")}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </Link>
  );
};
