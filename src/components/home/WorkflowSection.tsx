"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const steps = [
  { 
    step: "01", 
    title: "發布案件", 
    description: "AI 引導式問答，協助清楚描述軟體需求",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    )
  },
  { 
    step: "02", 
    title: "AI 需求分析", 
    description: "了解需求等級、完整度與市場定位",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )
  },
  { 
    step: "03", 
    title: "收到投標", 
    description: "專業軟體工程師提交提案與報價",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  { 
    step: "04", 
    title: "完成專案", 
    description: "流暢溝通，驗收成果，互相評價",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
];

export const WorkflowSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Create a timeline progress based on scroll through this section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  return (
    <section ref={containerRef} className="py-24 px-4 bg-[#e6dfcf] overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-[#20263e] mb-4">運作流程</h2>
          <p className="text-[#8c8172]">簡單四步驟，開啟您的專案旅程</p>
        </motion.div>

        <div className="relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-1 bg-[#dcd3c1] -translate-y-1/2 z-0 rounded-full" />
          <motion.div 
            className="hidden md:block absolute top-1/2 left-0 h-1 bg-[#20263e] -translate-y-1/2 z-0 rounded-full origin-left"
            style={{ scaleX: scrollYProgress, width: '100%' }}
          />

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
            {steps.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="group relative"
              >
                {/* Connecting Line (Mobile) */}
                {index !== steps.length - 1 && (
                  <div className="md:hidden absolute left-1/2 top-full h-8 w-1 bg-[#dcd3c1] -translate-x-1/2 z-0" />
                )}

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#c5ae8c]/20 hover:border-[#20263e] transition-all duration-300 hover:shadow-xl hover:-translate-y-2 text-center h-full flex flex-col items-center">
                  <div className="w-14 h-14 bg-[#20263e] text-white rounded-full flex items-center justify-center text-xl font-bold mb-4 group-hover:bg-[#c5ae8c] transition-colors duration-300 shadow-md">
                    {item.icon}
                  </div>
                  <div className="text-xs font-bold text-[#c5ae8c] tracking-widest uppercase mb-2">Step {item.step}</div>
                  <h3 className="text-xl font-bold text-[#20263e] mb-2">{item.title}</h3>
                  <p className="text-sm text-[#6b7280] leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

