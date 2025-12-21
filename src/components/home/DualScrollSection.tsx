"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useSpring, cubicBezier } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatRelativeTime } from "@/lib/utils";

// Interfaces copied from page.tsx to ensure type safety
export interface Project {
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
  };
  bids_count?: number;
}

export interface Freelancer {
  id: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  skills: string[];
  rating: number | null;
  hourly_rate?: number | null;
  created_at: string;
}

interface DualScrollSectionProps {
  projects: Project[];
  freelancers: Freelancer[];
  projectsLoading: boolean;
  freelancersLoading: boolean;
  isLoggedIn: boolean;
}

export const DualScrollSection: React.FC<DualScrollSectionProps> = ({
  projects,
  freelancers,
  projectsLoading,
  freelancersLoading,
  isLoggedIn,
}) => {
  const targetRef = useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = useState(1200);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    // Execute only on client side
    if (typeof window !== "undefined") {
      handleResize();
      window.addEventListener("resize", handleResize);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", handleResize);
      }
    };
  }, []);
  
  // Track scroll progress of the container
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start end", "end end"],
  });

  // Calculate horizontal scroll distance dynamically based on viewport width
  
  const calculateEndX = (itemCount: number) => {
    // ProjectCard 在橫向滾動中的寬度（與看所有案件頁面的卡片寬度一致）
    const cardWidth = 400; // 調整為更適合 ProjectCard 的寬度
    const gap = 24; // 與看所有案件頁面的 gap-6 一致
    const seeMoreWidth = 192;
    // Padding should match the CSS: pl-4 (16px) for mobile, md:pl-8 (32px) for desktop
    const leftPadding = viewportWidth < 768 ? 16 : 32;
    const rightPadding = viewportWidth < 768 ? 16 : 32; // Safety buffer
    
    // Calculate total width of all cards + see more button + gaps
    const effectiveCount = itemCount; // Use actual count passed in
    const totalContentWidth = (effectiveCount * cardWidth) + (effectiveCount * gap) + seeMoreWidth;
    
    // Calculate the target X position
    // Formula: ViewportWidth - (ContentWidth + LeftPadding + RightPadding)
    return viewportWidth - (totalContentWidth * 0.85 + leftPadding + rightPadding);
  };

  // Determine item counts (fallback to 5 for skeleton/loading state)
  // Projects: Show 5 cards
  // Freelancers: Show 6 cards (moves faster due to longer content)
  const projectCount = projectsLoading ? 5 : Math.min(projects.length, 5);
  const freelancerCount = freelancersLoading ? 6 : Math.min(freelancers.length, 6);

  // Define easing curve for smoother acceleration/deceleration
  // cubic-bezier(0.42, 0, 0.58, 1) is standard ease-in-out
  // Let's use a slightly more pronounced curve for better effect
  const smoothEase = cubicBezier(0.45, 0.05, 0.55, 0.95);

  // Start from positive value (right side) to negative value (left side)
  const xProjects = useTransform(
    scrollYProgress, 
    [0, 1], 
    [`${viewportWidth * 0.6}px`, `${calculateEndX(projectCount)}px`],
    { ease: smoothEase }
  );
  
  const xFreelancers = useTransform(
    scrollYProgress, 
    [0, 1], 
    [`${viewportWidth * 1.15}px`, `${calculateEndX(freelancerCount)}px`],
    { ease: smoothEase }
  );

  // Animation for titles - fly in from center and stop at position
  const xProjectTitle = useTransform(
    scrollYProgress,
    [0, 0.5],
    [viewportWidth / 2, 0],
    { ease: smoothEase }
  );

  const xFreelancerTitle = useTransform(
    scrollYProgress,
    [0, 0.6],
    [viewportWidth * 0.8, 0],
    { ease: smoothEase }
  );

  // Skeleton Loader for Projects - 使用與 ProjectCard 相似的結構（不顯示發案人）
  const ProjectSkeleton = () => (
    <div className="flex gap-6">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="animate-pulse flex-shrink-0 w-[400px] h-[500px]">
          <Card className="p-8 h-full flex flex-col bg-white/40 border-2 border-[#c5ae8c] rounded-[2rem]">
            <div className="mb-4 relative">
              <div className="absolute top-0 right-0 h-3 bg-gray-200 rounded w-16"></div>
              <div className="h-7 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-6"></div>
            </div>
            <div className="flex-1 mb-8">
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-4/5 mb-6"></div>
              <div className="flex gap-2">
                <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                <div className="h-6 bg-gray-200 rounded-full w-18"></div>
              </div>
            </div>
          </Card>
        </div>
      ))}
    </div>
  );

  // Skeleton Loader for Freelancers
  const FreelancerSkeleton = () => (
    <div className="flex gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="animate-pulse flex-shrink-0 w-80">
          <Card className="p-6 h-full">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          </Card>
        </div>
      ))}
    </div>
  );

  return (
    // Height 300vh creates the scroll space. Adjust this to control how "fast" the horizontal scroll feels relative to vertical scroll.
    // Increased to 350vh to make the animation slower and smoother per user request.
    <section ref={targetRef} className="relative h-[300vh] bg-[#e6dfcf]">
      <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
        
        {/* Top Half: Projects */}
        <div className="flex-[1.1] border-b border-[#c5ae8c]/30 flex flex-col justify-center bg-[#e6dfcf] overflow-hidden relative group">
          <motion.div 
            style={{ x: xProjectTitle }}
            className="absolute top-4 left-4 z-10 md:left-8 md:top-6"
          >
            <h2 className="text-2xl font-bold text-[#20263e] mb-1">最新案件</h2>
            <Link href="/projects" className="text-sm text-[#c5ae8c] hover:underline flex items-center gap-1">
              查看全部 <span className="text-xs">→</span>
            </Link>
          </motion.div>
          
          <div className="w-full pl-4 md:pl-8 pt-16 md:pt-0">
             <motion.div style={{ x: xProjects }} className="flex gap-6 items-start">
              {projectsLoading ? (
                <ProjectSkeleton />
              ) : projects.length > 0 ? (
                <>
                  {projects.slice(0, 5).map((project) => {
                    // 處理標題首字母大寫（如果是英文）
                    const capitalizeFirstLetter = (str: string) => {
                      if (!str) return str;
                      const firstChar = str[0];
                      if (/[a-zA-Z]/.test(firstChar)) {
                        return firstChar.toUpperCase() + str.slice(1);
                      }
                      return str;
                    };

                    return (
                      <Link key={project.id} href={`/projects/${project.id}`}>
                        <Card className="p-6 transition-all duration-300 border-2 border-[#c5ae8c] hover:border-[#20263e] flex-shrink-0 w-80 bg-white/90 backdrop-blur-sm cursor-pointer hover:shadow-lg hover:-translate-y-1 flex flex-col" style={{ height: 'calc((100vh - 4rem) / 2 - 40px)', maxHeight: '230px' }}>
                          <div className="mb-4">
                            <h3 className="text-2xl font-bold text-[#20263e] line-clamp-2" style={{ fontFamily: "'Noto Serif TC', serif" }}>
                              {capitalizeFirstLetter(project.title)}
                            </h3>
                          </div>
                          
                          {/* Required Skills */}
                          <div className="mb-4 min-h-[32px] flex flex-wrap gap-2">
                            {project.required_skills && project.required_skills.length > 0 ? (
                              <>
                                {project.required_skills.slice(0, 3).map((skill, index) => (
                                  <span key={index} className="bg-[#f5f3ed] text-[#20263e] px-3 py-1 rounded-full text-sm font-medium">
                                    {skill}
                                  </span>
                                ))}
                                {project.required_skills.length > 3 && (
                                  <span className="text-gray-400 text-xs self-center">+{project.required_skills.length - 3}</span>
                                )}
                              </>
                            ) : null}
                          </div>
                          
                          <div className="flex justify-between items-end mt-auto -mb-2">
                            {/* Left side: Avatar and Time */}
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0">
                                {project.client?.avatar_url ? (
                                  <img
                                    src={project.client.avatar_url}
                                    alt={project.client.name}
                                    className="w-10 h-10 rounded-full object-cover border border-[#c5ae8c]"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-[#20263e] flex items-center justify-center text-white font-medium border border-[#c5ae8c]">
                                    {project.client?.name?.[0] || '?'}
                                  </div>
                                )}
                              </div>
                              <span className="text-sm text-[#c5ae8c]">
                                {formatRelativeTime(project.created_at)}
                              </span>
                            </div>

                            {/* Right side: Budget */}
                            <div className="text-right">
                              <span className="text-xl font-bold text-[#20263e]" style={{ fontFamily: "'Noto Serif TC', serif" }}>
                                <span className="text-sm text-[#c5ae8c] font-normal">預算</span> ${project.budget_min.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    );
                  })}
                  {/* "See More" Card at the end */}
                  <div className="flex-shrink-0 w-48 h-48 flex items-center justify-center">
                    <Link href="/projects">
                       <div className="group/more flex flex-col items-center cursor-pointer">
                          <div className="w-12 h-12 rounded-full border-2 border-[#20263e] flex items-center justify-center mb-2 group-hover/more:bg-[#20263e] transition-colors">
                             <svg className="w-6 h-6 text-[#20263e] group-hover/more:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                          </div>
                          <span className="text-[#20263e] font-bold">查看更多案件</span>
                       </div>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="w-full text-center text-[#c5ae8c]">
                  目前沒有開放的案件
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Bottom Half: Freelancers */}
        <div className="flex-1 flex flex-col justify-center bg-white overflow-hidden relative">
          <motion.div 
            style={{ x: xFreelancerTitle }}
            className="absolute top-4 left-4 z-10 md:left-8 md:top-6"
          >
            <h2 className="text-2xl font-bold text-[#20263e] mb-1">推薦工程師</h2>
            <Link href="/freelancers" className="text-sm text-[#c5ae8c] hover:underline flex items-center gap-1">
              查看全部 <span className="text-xs">→</span>
            </Link>
          </motion.div>

          <div className="w-full pl-4 md:pl-8 pt-16 md:pt-0">
            <motion.div style={{ x: xFreelancers }} className="flex gap-4 items-center">
              {freelancersLoading ? (
                <FreelancerSkeleton />
              ) : freelancers.length > 0 ? (
                <>
                  {freelancers.slice(0, 6).map((freelancer) => (
                    <Link key={freelancer.id} href={`/users/${freelancer.id}`}>
                      <Card className="p-6 transition-all duration-300 border border-[#c5ae8c] flex-shrink-0 w-80 cursor-pointer hover:shadow-lg hover:-translate-y-1 bg-[#fcfcfc]">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            {freelancer.avatar_url ? (
                              <img
                                src={freelancer.avatar_url}
                                alt={freelancer.name}
                                className="w-12 h-12 rounded-full object-cover border-2 border-[#c5ae8c]"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-[#20263e] flex items-center justify-center text-white font-bold">
                                {freelancer.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-[#20263e] truncate">
                              {freelancer.name}
                            </h3>
                            <div className="flex items-center mt-1 mb-2">
                               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-[#fbbf24] mr-1">
                                 <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
                               </svg>
                               <span className="text-sm text-[#20263e] font-semibold">
                                 {freelancer.rating !== null ? freelancer.rating.toFixed(1) : "N/A"}
                               </span>
                            </div>
                            {freelancer.skills && freelancer.skills.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3 h-12 overflow-hidden">
                                {freelancer.skills.slice(0, 3).map((skill, index) => (
                                  <Badge
                                    key={index}
                                    variant="default"
                                    className="text-xs bg-[#e6dfcf] text-[#20263e] border border-[#c5ae8c]"
                                  >
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                  {/* "See More" Card for Freelancers */}
                  <div className="flex-shrink-0 w-48 h-48 flex items-center justify-center">
                    <Link href="/freelancers">
                       <div className="group/more flex flex-col items-center cursor-pointer">
                          <div className="w-12 h-12 rounded-full border-2 border-[#20263e] flex items-center justify-center mb-2 group-hover/more:bg-[#20263e] transition-colors">
                             <svg className="w-6 h-6 text-[#20263e] group-hover/more:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                          </div>
                          <span className="text-[#20263e] font-bold">尋找更多工程師</span>
                       </div>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="w-full text-center text-[#c5ae8c]">
                  目前沒有推薦的接案工程師
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

