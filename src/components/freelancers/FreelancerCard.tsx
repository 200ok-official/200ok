"use client";

import React, { useState, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { StarIcon } from "@heroicons/react/24/solid";
import { DocumentCheckIcon, ChartBarIcon, CommandLineIcon } from "@heroicons/react/24/outline";

interface FreelancerCardProps {
  freelancer: {
    id: string;
    name: string;
    avatar_url: string | null;
    bio: string | null;
    skills: string[];
    rating: number | null;
    hourly_rate?: number | null;
    _count?: {
        projects_created: number;
        bids: number;
        completed_projects: number;
    };
    bids_count?: number;
    completed_projects_count?: number;
  };
}

export const FreelancerCard: React.FC<FreelancerCardProps> = ({
  freelancer,
}) => {
  const bidsCount = freelancer.bids_count ?? freelancer._count?.bids ?? 0;
  const completedCount = freelancer.completed_projects_count ?? 0; 
  
  const [isHovered, setIsHovered] = useState(false);
  const bioRef = useRef<HTMLParagraphElement>(null);
  const bioContainerRef = useRef<HTMLDivElement>(null);
  const [scrollDistance, setScrollDistance] = useState(0);
  const [isOverflowing, setIsOverflowing] = useState(false);

  // Animation variants - Liquid Effect (Fill from top)
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

  const contentVariants = {
    initial: { opacity: 0, y: 10 },
    hover: { 
      opacity: 1, 
      y: 0, 
      transition: { delay: 0.2, duration: 0.3 } 
    }
  };

  // Measure content for auto-scrolling
  useLayoutEffect(() => {
    if (bioRef.current && bioContainerRef.current) {
        const contentHeight = bioRef.current.offsetHeight;
        const containerHeight = bioContainerRef.current.offsetHeight;
        
        if (contentHeight > containerHeight) {
            setScrollDistance(contentHeight - containerHeight);
            setIsOverflowing(true);
        } else {
            setScrollDistance(0);
            setIsOverflowing(false);
        }
    }
  }, [freelancer.bio, isHovered]);

  const hasSkills = freelancer.skills && freelancer.skills.length > 0;

  return (
    <Link href={`/users/${freelancer.id}`} className="block h-full">
      <div
        className="group relative w-full bg-white rounded-3xl border border-gray-200 hover:border-[#c5ae8c] shadow-sm hover:shadow-[0_8px_30px_rgb(197,174,140,0.15)] transition-all duration-300 overflow-hidden h-full flex flex-col"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Decorative Top Line - Gradient Theme Colors */}
        <div className="h-1.5 w-full bg-[#20263e] relative z-20"></div>

        <div className={`p-5 flex flex-col flex-1 relative ${!hasSkills ? 'justify-center' : ''}`}>
            {/* Top Section: Avatar & Info */}
            <div className="flex gap-4 items-start mb-3">
                <div className="relative flex-shrink-0">
                    {freelancer.avatar_url ? (
                        <img
                            src={freelancer.avatar_url}
                            alt={freelancer.name}
                            className="w-20 h-20 rounded-full object-cover border-2 border-white ring-2 ring-[#e6dfcf] group-hover:ring-[#c5ae8c] shadow-md transition-all duration-300"
                        />
                    ) : (
                        <div className="w-20 h-20 rounded-full bg-[#20263e] flex items-center justify-center text-white text-3xl font-bold border-2 border-white ring-2 ring-[#e6dfcf] group-hover:ring-[#c5ae8c] shadow-md transition-all duration-300">
                            {freelancer.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 bg-white px-2 py-0.5 rounded-full shadow border border-gray-100 flex items-center gap-0.5">
                        <StarIcon className="w-4 h-4 text-[#fbbf24]" />
                        <span className="text-sm font-bold text-[#20263e]">
                            {freelancer.rating !== null ? freelancer.rating.toFixed(1) : 'N/A'}
                        </span>
                    </div>
                </div>

                <div className="flex-1 min-w-0 pt-1">
                    <div className="flex justify-between items-start">
                        <h3 className="text-2xl font-bold text-[#20263e] truncate font-serif tracking-tight leading-tight">
                            {freelancer.name}
                        </h3>
                        {freelancer.hourly_rate && (
                           <span className="flex-shrink-0 text-xs font-medium text-[#20263e] bg-[#fcfbf8] px-2 py-1 rounded-full border border-gray-100 group-hover:border-[#e6dfcf] transition-colors ml-1">
                             ${freelancer.hourly_rate}/hr
                           </span>
                        )}
                    </div>
                    
                    {/* Stats Icons Row - Directly integrated */}
                    <div className="flex items-center gap-4 text-gray-500 mt-2">
                        <div className="flex items-center gap-1.5 group-hover:text-[#c5ae8c] transition-colors" title="投標次數">
                            <DocumentCheckIcon className="w-5 h-5 text-[#c5ae8c] group-hover:text-[#20263e] transition-colors" />
                            <span className="text-base font-bold text-[#20263e]">{bidsCount}</span>
                        </div>
                        <div className="flex items-center gap-1.5 group-hover:text-[#c5ae8c] transition-colors" title="完成專案">
                            <ChartBarIcon className="w-5 h-5 text-[#c5ae8c] group-hover:text-[#20263e] transition-colors" />
                            <span className="text-base font-bold text-[#20263e]">{completedCount}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Skills & Decoration */}
            {hasSkills && (
                <div className="mt-auto pt-1 w-full">
                    <div className="flex items-start gap-3">
                        <CommandLineIcon className="w-5 h-5 text-[#c5ae8c] mt-1 shrink-0" />
                        <div className="flex flex-wrap gap-1.5">
                            {freelancer.skills?.slice(0, 3).map((skill, i) => (
                                <span key={i} className="px-3 py-1 bg-[#c5ae8c] text-white border border-[#c5ae8c] rounded-full text-xs font-medium shadow-sm transition-all duration-300 truncate max-w-[100px]">
                                    {skill}
                                </span>
                            ))}
                            {(freelancer.skills?.length ?? 0) > 3 && (
                                <span className="text-gray-400 text-xs self-center px-1 font-medium">
                                    +{(freelancer.skills?.length ?? 0) - 3}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Hover Overlay - Liquid Effect & Auto-scroll Bio */}
        <motion.div
            className="absolute inset-0 bg-[#20263e]/95 backdrop-blur-md z-20 flex flex-col p-6 items-center"
            initial="initial"
            animate={isHovered ? "hover" : "initial"}
            variants={liquidVariants}
        >
            <motion.div 
               className="w-full h-full flex flex-col items-center justify-center"
               variants={contentVariants}
            >
                <h4 className="text-[#c5ae8c] font-serif font-bold text-lg mb-3 shrink-0">關於我</h4>
                <div className="w-8 h-1 bg-[#c5ae8c] rounded-full mb-4 shrink-0"></div>
                
                <div 
                    ref={bioContainerRef}
                    className={`w-full relative overflow-hidden flex-1 min-h-0 flex ${isOverflowing ? 'items-start' : 'items-center'} justify-center`}
                    style={{
                        maskImage: isOverflowing 
                            ? 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)' 
                            : 'none',
                        WebkitMaskImage: isOverflowing 
                            ? 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)' 
                            : 'none'
                    }}
                >
                    <motion.p 
                        ref={bioRef}
                        className={`text-white/90 text-sm leading-relaxed text-center ${isOverflowing ? 'py-4' : ''}`}
                        animate={isHovered && scrollDistance > 0 ? { y: -scrollDistance } : { y: 0 }}
                        transition={{ 
                            delay: 1.5,
                            duration: Math.max(scrollDistance * 0.05, 3), 
                            ease: "linear"
                        }}
                    >
                        {freelancer.bio || "這位接案者尚未填寫自我介紹。"}
                    </motion.p>
                </div>
            </motion.div>
        </motion.div>
      </div>
    </Link>
  );
};
