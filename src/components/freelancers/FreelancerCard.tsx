import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

interface FreelancerCardProps {
  freelancer: {
    id: string;
    name: string;
    avatar_url: string | null;
    bio: string | null;
    skills: string[];
    rating: number | null;
    hourly_rate?: number | null;
  };
}

export const FreelancerCard: React.FC<FreelancerCardProps> = ({
  freelancer,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Animation variants (same as ProjectCard)
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

  return (
    <Link href={`/users/${freelancer.id}`} className="block h-full">
      <motion.div
        className="group relative w-full rounded-[2rem] bg-white/40 shadow-none border-2 border-[#c5ae8c] hover:border-[#20263e] overflow-hidden h-full backdrop-blur-sm"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        whileHover={{ y: -5 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        {/* === 1. 原始內容層 (白色背景) === */}
        <div className="relative z-10 p-8 h-full flex flex-col">
           {/* Header: Avatar & Name */}
           <div className="mb-6 flex flex-col items-center text-center">
             <div className="mb-4 relative">
                {freelancer.avatar_url ? (
                    <img
                        src={freelancer.avatar_url}
                        alt={freelancer.name}
                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                    />
                ) : (
                    <div className="w-24 h-24 rounded-full bg-[#20263e] flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-md">
                        {freelancer.name.charAt(0).toUpperCase()}
                    </div>
                )}
                {freelancer.rating !== null && (
                    <div className="absolute -bottom-2 -right-2 bg-white px-2 py-1 rounded-full shadow-sm border border-gray-100 flex items-center gap-1">
                        <span className="text-[#fbbf24]">★</span>
                        <span className="text-sm font-bold text-[#20263e]">{freelancer.rating.toFixed(1)}</span>
                    </div>
                )}
             </div>
             
             <h3 className="text-2xl font-bold text-[#20263e] tracking-tight mb-1" style={{ fontFamily: "'Noto Serif TC', serif" }}>
               {freelancer.name}
             </h3>
             
             {freelancer.hourly_rate && (
                <p className="text-[#c5ae8c] font-medium">
                    ${freelancer.hourly_rate} <span className="text-gray-400 text-sm">/ hr</span>
                </p>
             )}
           </div>
           
           {/* Skills */}
           <div className="mt-auto w-full">
              <div className="flex flex-wrap gap-2 justify-center">
                {freelancer.skills && freelancer.skills.slice(0, 5).map((skill, i) => (
                  <span key={i} className="bg-[#f5f3ed] text-[#20263e] px-3 py-1 rounded-full text-sm font-medium">
                    {skill}
                  </span>
                ))}
                {freelancer.skills && freelancer.skills.length > 5 && (
                  <span className="text-gray-400 text-xs self-center">+{freelancer.skills.length - 5}</span>
                )}
              </div>
           </div>
        </div>

        {/* === 2. 液體填充層 (深色背景) === */}
        <motion.div
          className="absolute inset-0 bg-[#20263e] z-20 flex flex-col p-8 text-white text-center items-center justify-center"
          initial="initial"
          animate={isHovered ? "hover" : "initial"}
          variants={liquidVariants}
        >
          <motion.div 
            className="flex flex-col items-center w-full"
            variants={contentVariants}
          >
            <h3 className="text-xl font-bold mb-4 text-[#c5ae8c]" style={{ fontFamily: "'Noto Serif TC', serif" }}>
                關於我
            </h3>
            <div className="w-12 h-1 bg-[#c5ae8c] rounded-full mb-6"></div>
            
            <p className="text-white/90 text-lg leading-relaxed line-clamp-4 mb-8">
                {freelancer.bio || "這位接案者尚未填寫自我介紹。"}
            </p>
            
            <div>
                 <span className="text-sm text-[#c5ae8c] border border-[#c5ae8c] px-4 py-2 rounded-full">
                    查看完整檔案
                 </span>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </Link>
  );
};

