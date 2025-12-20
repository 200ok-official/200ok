"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { cubicBezier } from "framer-motion";

export const HeroBanner: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftShapeRef = useRef<HTMLDivElement>(null);
  const rightShapeRef = useRef<HTMLDivElement>(null);
  const [textProgress, setTextProgress] = useState(0);

  // Define easing curve (Standard Ease-In-Out)
  // This curve starts slow, speeds up in the middle, and slows down at the end
  const ease = cubicBezier(0.45, 0.05, 0.55, 0.95);

  // ========== 動畫參數配置 ==========
  // 調整這些參數來改變動畫效果：
  const animationConfig = {
    // 動畫距離倍數（相對於視窗高度）
    // 例如：1.5 表示需要滾動 1.5 個視窗高度才會完成動畫
    // 數值越大，動畫時間越長
    animationDistanceMultiplier: 3,
    
    // 初始偏移量（像素）
    // 兩個圖形初始位置的間距，數值越大，初始分開越遠
    initialOffset: 200,
    
    // 最大移動距離（像素）
    // 圖形從初始位置移動到定點的距離
    // 數值越大，圖形移動越遠，定點越靠外
    maxTranslate: 1500,
  };
  // =================================

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      
      // 計算動畫進度：從頁面頂部開始滾動到動畫結束
      const animationDistance = window.innerHeight * animationConfig.animationDistanceMultiplier;
      const scrolled = window.scrollY;
      const linearProgress = Math.min(1, Math.max(0, scrolled / animationDistance));
      
      // Apply easing to the progress
      const progress = ease(linearProgress);

      // 更新文字顯示進度
      setTextProgress(progress);

      // 計算圖形移動距離（從中間向兩側滑開）
      // 左邊圖形：從 -initialOffset 開始，向左移動到 -(initialOffset + maxTranslate)
      const totalLeftTranslate = -(animationConfig.initialOffset + progress * animationConfig.maxTranslate);
      // 右邊圖形：從 initialOffset 開始，向右移動到 (initialOffset + maxTranslate)
      const totalRightTranslate = animationConfig.initialOffset + progress * animationConfig.maxTranslate;

      // 左邊圖形：從中間偏左位置向左滑動
      if (leftShapeRef.current) {
        leftShapeRef.current.style.transform = `translate(${totalLeftTranslate}px, -50%)`;
        leftShapeRef.current.style.opacity = `${0.25 + progress * 0.1}`;
      }

      // 右邊圖形：從中間偏右位置向右滑動
      if (rightShapeRef.current) {
        rightShapeRef.current.style.transform = `translate(${totalRightTranslate}px, -50%)`;
        rightShapeRef.current.style.opacity = `${0.25 + progress * 0.1}`;
      }
    };

    // 使用 requestAnimationFrame 優化滾動性能
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    handleScroll(); // 初始執行一次
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 計算容器高度（與動畫距離一致）
  const containerHeight = `${animationConfig.animationDistanceMultiplier * 100}vh`;

  // 文字內容
  const subtitleText = "透過 AI 輔助與引導式流程，讓需求更清晰，合作更順暢";
  
  // 計算需要顯示的文字數量（降低倍數讓動畫更慢）
  // 使用 Math.min 確保最大值為 1
  const textDisplayProgress = Math.min(1, textProgress * 1.5);
  const visibleCharCount = Math.floor(textDisplayProgress * subtitleText.length);
  const displayText = subtitleText.slice(0, visibleCharCount);

  // 按鈕出現進度（延遲到文字進度 40% 後才開始出現，讓按鈕更晚出現）
  const buttonProgress = Math.max(0, Math.min(1, (textProgress - 0.4) / 0.6));

  return (
    <div 
      ref={containerRef} 
      className="relative w-full"
      style={{ height: containerHeight }}
    >
      {/* Sticky 容器：在滾動時固定在畫面上，從 Navbar 下方開始 */}
      <div className="sticky top-16 h-[calc(100vh-4rem)] w-full overflow-hidden bg-gradient-to-br from-[#e6dfcf] via-[#f0ebe0] to-[#e6dfcf]">
        
        {/* 背景幾何圖形 - 左邊圓形（初始在中間偏左） */}
        <div
          ref={leftShapeRef}
          className="absolute left-1/2 top-1/2 w-80 h-80 md:w-96 md:h-96 opacity-25"
          style={{ 
            transform: `translate(-${animationConfig.initialOffset}px, -50%)`,
            willChange: "transform, opacity"
          }}
        >
          <svg
            viewBox="0 0 400 400"
            className="w-full h-full"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="200"
              cy="200"
              r="180"
              fill="#20263e"
            />
            <circle
              cx="200"
              cy="200"
              r="120"
              fill="#c5ae8c"
              opacity="0.6"
            />
            <circle
              cx="200"
              cy="200"
              r="60"
              fill="#20263e"
              opacity="0.4"
            />
          </svg>
        </div>

        {/* 背景幾何圖形 - 右邊三角形（初始在中間偏右） */}
        <div
          ref={rightShapeRef}
          className="absolute left-1/2 top-1/2 w-80 h-80 md:w-96 md:h-96 opacity-25"
          style={{ 
            transform: `translate(${animationConfig.initialOffset}px, -50%)`,
            willChange: "transform, opacity"
          }}
        >
          <svg
            viewBox="0 0 400 400"
            className="w-full h-full"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <polygon
              points="200,50 350,300 50,300"
              fill="#20263e"
            />
            <polygon
              points="200,120 280,280 120,280"
              fill="#c5ae8c"
              opacity="0.6"
            />
            <polygon
              points="200,180 240,260 160,260"
              fill="#20263e"
              opacity="0.4"
            />
          </svg>
        </div>

        {/* 內容區域 */}
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-[#20263e] mb-6 leading-tight">
              歡迎來到 200 OK
            </h1>
            <p className="text-xl md:text-2xl text-[#20263e] mb-4 opacity-90">
              專為
              <span className="relative inline-block mx-1">
                <span 
                  className="absolute inset-0 bg-[#c5ae8c] opacity-40"
                  style={{ 
                    width: `${textDisplayProgress * 100}%`,
                    left: 0
                  }}
                />
                <span className="relative">
                  {['軟', '體', '工', '程'].map((char, index) => {
                    // 每個字佔據 25% 的範圍
                    const charStart = index * 0.25;
                    const charEnd = (index + 1) * 0.25;
                    // 計算該字的粗體進度（0-1）
                    const charProgress = Math.min(1, Math.max(0, (textDisplayProgress - charStart) / 0.25));
                    // 當螢光筆進入該字的範圍就開始變粗
                    const isBold = textDisplayProgress > (charStart+charEnd)/2;
                    return (
                      <span
                        key={index}
                        className="transition-all duration-200"
                        style={{
                          fontWeight: isBold ? 700 : 400
                        }}
                      >
                        {char}
                      </span>
                    );
                  })}
                </span>
              </span>
              設計的接案平台
            </p>
            <div className="relative mb-8">
              {/* 底線 - 根據文字進度顯示 */}
              <div 
                className="absolute left-1/2 transform -translate-x-1/2 h-0.5 bg-[#c5ae8c] transition-all duration-300"
                style={{ 
                  width: `${textDisplayProgress * 100}%`,
                  bottom: '-8px'
                }}
              />
              <p className="text-lg md:text-xl text-[#c5ae8c] max-w-2xl mx-auto min-h-[2em]">
                {displayText}
              </p>
            </div>
            <div 
              className="flex flex-col sm:flex-row gap-4 justify-center items-center origin-center"
              style={{
                transform: `scale(${buttonProgress})`,
                opacity: buttonProgress
              }}
            >
              <Link href="/projects/new">
                <Button
                  size="lg"
                  className="bg-[#20263e] hover:bg-[#2d3550] text-white px-8 py-4 text-lg"
                >
                  發布案件
                </Button>
              </Link>
              <Link href="/projects">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-[#20263e] text-[#20263e] hover:bg-[#20263e] hover:text-white px-8 py-4 text-lg"
                >
                  瀏覽案件
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* 向下滾動指示器 */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 animate-bounce">
          <svg
            className="w-6 h-6 text-[#20263e] opacity-60"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </div>
  );
};

