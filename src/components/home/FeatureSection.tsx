"use client";

import React, { useRef } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import { Card } from "@/components/ui/Card";

const features = [
  {
    icon: "🤖",
    title: "AI 輔助需求分析",
    description: "透過引導性類型特化步驟與 AI 輔助，讓您清楚說明需求，了解需求等級、描述完整度與市場定位。",
  },
  {
    icon: "💻",
    title: "專為工程師設計",
    description: "專屬技能展示空間，讓接案工程師節省更多力氣去釐清需求，接案流程更流暢。",
  },
  {
    icon: "⚡",
    title: "引導式發案流程",
    description: "即使不懂技術也能透過引導式問答清楚描述需求，快速找到合適的軟體開發者。",
  },
];

const FeatureCard = ({ item, index }: { item: typeof features[0]; index: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  
  // Mouse position values
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth spring animation for mouse movement
  const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
  const mouseY = useSpring(y, { stiffness: 500, damping: 100 });

  function onMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    x.set(clientX - left);
    y.set(clientY - top);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.2 }}
      className="h-full"
    >
      <div
        className="group relative h-full rounded-xl border border-[#c5ae8c]/30 bg-white px-8 py-10 shadow-none transition-all duration-300 hover:shadow-2xl"
        onMouseMove={onMouseMove}
        ref={ref}
      >
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
          style={{
            background: useMotionTemplate`
              radial-gradient(
                650px circle at ${mouseX}px ${mouseY}px,
                rgba(197, 174, 140, 0.15),
                transparent 80%
              )
            `,
          }}
        />
        <div className="relative flex flex-col items-center text-center h-full">
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#20263e] text-3xl text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
            {item.icon}
            </div>
            <h3 className="mb-4 text-xl font-bold text-[#20263e]">{item.title}</h3>
            <p className="text-[#c5ae8c] leading-relaxed text-sm md:text-base">
            {item.description}
            </p>
        </div>
      </div>
    </motion.div>
  );
};

export const FeatureSection = () => {
  return (
    <section className="relative py-20 px-4 overflow-hidden bg-white">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-30">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-[#e6dfcf] rounded-full blur-[100px]" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-[#c5ae8c] rounded-full blur-[120px] opacity-50" />
      </div>

      <div className="relative max-w-6xl mx-auto z-10">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-[#20263e] mb-4"
          >
            為什麼選擇 200 OK？
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-[#c5ae8c] text-lg font-medium"
          >
            專為軟體工程設計，與綜合型接案平台做出區隔
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} item={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

