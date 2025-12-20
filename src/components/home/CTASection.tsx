"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useMotionTemplate, useMotionValue } from "framer-motion";
import { Button } from "@/components/ui/Button";

export const CTASection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [-50, 50]);
  
  // Mouse interaction for background
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    mouseX.set((clientX - left) / width);
    mouseY.set((clientY - top) / height);
  }

  return (
    <section 
      ref={containerRef} 
      className="relative py-32 px-4 bg-[#20263e] overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Dynamic Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <motion.div 
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            x: useTransform(mouseX, [0, 1], [-20, 20]),
            y: useTransform(mouseY, [0, 1], [-20, 20]),
          }}
        />
      </div>

      {/* Decorative Orbs */}
      <motion.div 
        className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#c5ae8c] rounded-full blur-[150px] opacity-20 pointer-events-none"
        style={{ y: useTransform(scrollYProgress, [0, 1], [-100, 100]) }}
      />
      <motion.div 
        className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#4f46e5] rounded-full blur-[150px] opacity-10 pointer-events-none"
        style={{ y: useTransform(scrollYProgress, [0, 1], [50, -50]) }}
      />

      <div className="relative max-w-4xl mx-auto text-center z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
            準備開始您的<span className="text-[#c5ae8c]">軟體專案</span>了嗎？
          </h2>
          <p className="text-gray-300 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            立即加入 200 OK，專為軟體工程設計的接案平台。<br className="hidden md:block" />
            透過 AI 輔助與引導式流程，讓需求更清晰，合作更順暢。
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 items-center">
            <Link href="/projects/new">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="secondary" 
                  size="md" 
                  className="px-8 py-3 text-lg bg-[#c5ae8c] hover:bg-[#b09b7c] text-[#20263e] font-bold border-none transition-all"
                >
                  發布案件
                </Button>
              </motion.div>
            </Link>
            
            <Link href="/projects">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="outline" 
                  size="md" 
                  className="px-8 py-3 text-lg border-2 border-white/20 text-white backdrop-blur-sm hover:bg-transparent hover:text-white"
                >
                  探索案件
                </Button>
              </motion.div>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

