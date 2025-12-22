"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { cubicBezier } from "framer-motion";

export const HeroBanner: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftShapeRef = useRef<HTMLDivElement>(null);
  const rightShapeRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const rightBoxRef = useRef<HTMLDivElement>(null);
  const leftBoxRef = useRef<HTMLDivElement>(null);
  const [textProgress, setTextProgress] = useState(0);

  // Define easing curve (Standard Ease-In-Out)
  const ease = cubicBezier(0.45, 0.05, 0.55, 0.95);

  // Helper to map a value from one range to another
  const mapRange = (value: number, inMin: number, inMax: number, outMin: number, outMax: number) => {
    if (value <= inMin) return outMin;
    if (value >= inMax) return outMax;
    const percentage = (value - inMin) / (inMax - inMin);
    return outMin + (percentage * (outMax - outMin));
  };

  // ========== 動畫參數配置 ==========
  const animationConfig = {
    animationDistanceMultiplier: 4, // 增加滾動距離，讓動畫更從容
    initialOffset: 300,
    leftOffset: -200,
    leftDownOffset: 80,
    initialScale: 1.2,
    rightInitialScale: 0.9,
    initialOpacity: 0.25, // 增加初始透明度，因為現在是主角
  };

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const animationDistance = window.innerHeight * animationConfig.animationDistanceMultiplier;
      const scrolled = window.scrollY;
      const linearProgress = Math.min(1, Math.max(0, scrolled / animationDistance));
      const progress = ease(linearProgress);

      setTextProgress(progress);

      // Animation Timeline
      // 0.00 - 0.15: Cursor enters and moves to Right Image
      // 0.15 - 0.20: Click Right Image (Box appears)
      // 0.20 - 0.32: Pause (Right Box stays visible)
      // 0.32 - 0.45: Drag Right Image to Right (Exit)
      
      // 0.45 - 0.55: Cursor moves to Left Image
      // 0.55 - 0.60: Click Left Image (Box appears)
      // 0.60 - 0.72: Pause (Left Box stays visible)
      // 0.72 - 0.85: Drag Left Image to Left (Exit)
      
      // 0.85 - 1.00: End

      const rightImageCenterX = animationConfig.initialOffset + animationConfig.leftOffset;
      const leftImageCenterX = -animationConfig.initialOffset + animationConfig.leftOffset;
      
      // Cursor Position & Opacity
      let cursorX = 0;
      let cursorY = 0; // Relative to center
      let cursorOpacity = 0;
      let cursorScale = 1;

      // Right Image Transform
      let rightX = rightImageCenterX;
      let rightOpacity = animationConfig.initialOpacity || 1; // Default visible

      // Left Image Transform
      let leftX = leftImageCenterX;
      let leftOpacity = animationConfig.initialOpacity || 1; // Default visible

      // Box Opacities
      let rightBoxOpacity = 0;
      let leftBoxOpacity = 0;

      // Phase 1: Cursor Enters & Moves to Right
      if (progress < 0.15) {
        cursorOpacity = mapRange(progress, 0.05, 0.1, 0, 1);
        cursorX = mapRange(progress, 0.05, 0.15, 0, rightImageCenterX);
        cursorY = mapRange(progress, 0.05, 0.15, 200, -50); // From bottom to center-ish
      } 
      // Phase 2: Click Right
      else if (progress < 0.20) {
        cursorOpacity = 1;
        cursorX = rightImageCenterX;
        cursorY = -50;
        // Click effect
        if (progress > 0.18) {
          cursorScale = 0.9;
          rightBoxOpacity = mapRange(progress, 0.18, 0.20, 0, 1);
        }
      }
      // Phase 2.5: Pause Right
      else if (progress < 0.32) {
        cursorOpacity = 1;
        cursorX = rightImageCenterX;
        cursorY = -50;
        cursorScale = 1;
        rightBoxOpacity = 1;
      }
      // Phase 3: Drag Right Out
      else if (progress < 0.45) {
        cursorOpacity = 1;
        rightBoxOpacity = 1;
        const dragProgress = mapRange(progress, 0.32, 0.45, 0, 1);
        const dragDist = 1000; // Drag far right
        
        cursorX = rightImageCenterX + dragDist * dragProgress;
        cursorY = -50;
        
        rightX = cursorX; // Image follows cursor
        rightOpacity = mapRange(progress, 0.4, 0.45, 1, 0); // Fade out near end
      }
      // Phase 4: Move to Left
      else if (progress < 0.55) {
        // Right image is gone
        rightX = 2000; // Far away
        rightOpacity = 0;
        
        // Move from right-ish to left image
        if (progress < 0.50) {
             cursorOpacity = mapRange(progress, 0.45, 0.48, 1, 0);
             cursorX = rightImageCenterX + 1000; 
             cursorY = -50;
        } else {
             cursorOpacity = mapRange(progress, 0.50, 0.53, 0, 1);
             // Move to Left Image
             cursorX = mapRange(progress, 0.50, 0.55, 0, leftImageCenterX); 
             cursorY = mapRange(progress, 0.50, 0.55, 100, -50); // slight arc
        }
      }
      // Phase 5: Click Left
      else if (progress < 0.60) {
        rightOpacity = 0;
        cursorOpacity = 1;
        cursorX = leftImageCenterX;
        cursorY = -50;
        
        if (progress > 0.58) {
          cursorScale = 0.9;
          leftBoxOpacity = mapRange(progress, 0.58, 0.60, 0, 1);
        }
      }
      // Phase 5.5: Pause Left
      else if (progress < 0.72) {
        rightOpacity = 0;
        cursorOpacity = 1;
        cursorX = leftImageCenterX;
        cursorY = -50;
        cursorScale = 1;
        leftBoxOpacity = 1;
      }
      // Phase 6: Drag Left Out
      else if (progress < 0.85) {
        rightOpacity = 0;
        cursorOpacity = 1;
        leftBoxOpacity = 1;
        
        const dragProgress = mapRange(progress, 0.72, 0.85, 0, 1);
        const dragDist = -1000; // Drag far left
        
        cursorX = leftImageCenterX + dragDist * dragProgress;
        cursorY = -50;
        
        leftX = cursorX;
        leftOpacity = mapRange(progress, 0.80, 0.85, 1, 0);
      }
      // Phase 7: End
      else {
         rightOpacity = 0;
         leftOpacity = 0;
         cursorOpacity = mapRange(progress, 0.85, 0.90, 1, 0); // Fade cursor out
         cursorX = leftImageCenterX - 1000;
      }

      // Apply styles
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${cursorX}px, ${cursorY}px) scale(${cursorScale})`;
        cursorRef.current.style.opacity = `${cursorOpacity}`;
      }

      if (rightShapeRef.current) {
        // Adjust right image specific transforms
        // Note: original had calc(-50%) for Y. We need to maintain that.
        // My cursorY is relative to center. I should probably treat it as offset.
        // Actually, let's just use the calculated X/Y for the image container center.
        // The original code: translate(X, -50%). 
        // We will animate X.
        rightShapeRef.current.style.transform = `translate(${rightX}px, -50%) scale(${animationConfig.rightInitialScale})`;
        rightShapeRef.current.style.opacity = `${rightOpacity}`;
      }

      if (leftShapeRef.current) {
        // Original: translate(X, calc(-50% + 80px)) scale(1.2)
        // We'll keep the scale and Y offset logic but override X
        leftShapeRef.current.style.transform = `translate(${leftX}px, calc(-50% + ${animationConfig.leftDownOffset}px)) scale(${animationConfig.initialScale})`;
        leftShapeRef.current.style.opacity = `${leftOpacity}`;
      }
      
      if (rightBoxRef.current) {
        rightBoxRef.current.style.opacity = `${rightBoxOpacity}`;
        rightBoxRef.current.style.transform = `scale(${rightBoxOpacity > 0 ? 1 : 0.8})`;
      }
      
      if (leftBoxRef.current) {
        leftBoxRef.current.style.opacity = `${leftBoxOpacity}`;
        leftBoxRef.current.style.transform = `scale(${leftBoxOpacity > 0 ? 1 : 0.8})`;
      }
    };

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
    handleScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const containerHeight = `${animationConfig.animationDistanceMultiplier * 100}vh`;

  // Text Logic
  const subtitleText = "透過 AI 輔助與引導式流程，讓需求更清晰，合作更順暢";
  const rawProgress = Math.min(1, textProgress * 1.5); // Keep existing text timing or delay it?
  // Maybe delay text until images start clearing? 
  // User didn't specify, but "Hero Banner" usually introduces things. 
  // Let's keep it but maybe delay the "Welcome" slightly or sync with the clearing.
  // Actually, let's keep the text logic as is, it works well in parallel.
  
  const visibleCharCount = Math.floor(rawProgress * subtitleText.length);
  const displayText = subtitleText.slice(0, visibleCharCount);
  const typingSteps = 4;
  const typingStepProgress = Math.floor(rawProgress * typingSteps);
  const textDisplayProgress = typingStepProgress / typingSteps;
  const buttonProgress = Math.max(0, Math.min(1, (textProgress - 0.4) / 0.45));

  return (
    <div 
      ref={containerRef} 
      className="relative w-full"
      style={{ height: containerHeight }}
    >
      <div className="sticky top-16 h-[calc(100vh-4rem)] w-full overflow-hidden bg-gradient-to-br from-[#e6dfcf] via-[#f0ebe0] to-[#e6dfcf]">
        
        {/* Left Shape */}
        <div
          ref={leftShapeRef}
          className="absolute left-1/2 top-1/2 w-96 h-96 md:w-[32rem] md:h-[32rem] transition-transform duration-75"
          style={{ 
            transform: `translate(${-animationConfig.initialOffset + animationConfig.leftOffset}px, calc(-50% + ${animationConfig.leftDownOffset}px)) scale(${animationConfig.initialScale})`,
            opacity: animationConfig.initialOpacity,
            willChange: "transform, opacity"
          }}
        >
          <img
            src="/hero_left.png"
            alt=""
            className="w-full h-full object-contain relative z-10"
          />
          {/* Interactive Box Overlay for Left */}
          <div 
             ref={leftBoxRef}
             className="absolute inset-0 z-20 border-4 border-[#20263e] rounded-xl bg-[#20263e]/10 backdrop-blur-[2px] transition-all duration-300"
             style={{ opacity: 0 }}
          >
             <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#20263e] text-white px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap shadow-xl">
                接案工程師
             </div>
          </div>
        </div>

        {/* Right Shape */}
        <div
          ref={rightShapeRef}
          className="absolute left-1/2 top-1/2 w-96 h-96 md:w-[32rem] md:h-[32rem] transition-transform duration-75"
          style={{ 
            transform: `translate(${animationConfig.initialOffset + animationConfig.leftOffset}px, -50%) scale(${animationConfig.rightInitialScale})`,
            opacity: animationConfig.initialOpacity,
            willChange: "transform, opacity"
          }}
        >
          <img
            src="/hero_right.png"
            alt=""
            className="w-full h-full object-contain relative z-10"
          />
           {/* Interactive Box Overlay for Right */}
           <div 
             ref={rightBoxRef}
             className="absolute inset-0 z-20 border-4 border-[#20263e] rounded-xl bg-[#20263e]/10 backdrop-blur-[2px] transition-all duration-300"
             style={{ opacity: 0 }}
          >
             <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#20263e] text-white px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap shadow-xl">
                發案客戶
             </div>
          </div>
        </div>

        {/* Cursor Element */}
        <div
          ref={cursorRef}
          className="absolute left-1/2 top-1/2 z-50 pointer-events-none transition-transform duration-75"
          style={{ 
            marginTop: 0, 
            marginLeft: 0,
            width: '32px',
            height: '32px',
            opacity: 0,
            willChange: "transform, opacity"
          }}
        >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 -ml-3 -mt-2 drop-shadow-xl">
                <path d="M5.5 3.5L11.5 19.5L14.5 13.5L20.5 19.5L22.5 17.5L16.5 11.5L22.5 8.5L5.5 3.5Z" fill="#20263e" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
        </div>

        {/* Content Area */}
        <div className="relative z-10 flex items-center justify-center h-full pointer-events-none">
           {/* Pointer events none to let clicks pass through if needed, but here we just show text. 
               Actually, buttons need pointer-events-auto. */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pointer-events-auto">
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
                    // 當游標到達該字的右邊時才顯示（游標經過後才出現）
                    const isVisible = textDisplayProgress >= charEnd;
                    return (
                      <span
                        key={index}
                        className="transition-all duration-200"
                        style={{
                          fontWeight: 700, // 直接顯示為粗體
                          opacity: isVisible ? 1 : 0
                        }}
                      >
                        {char}
                      </span>
                    );
                  })}
                </span>
                {/* 打字游標效果 */}
                <span
                  className="absolute top-0 bottom-0 w-0.5 bg-[#20263e] opacity-80"
                  style={{
                    left: `${textDisplayProgress * 100}%`,
                    animation: 'blink 1s infinite'
                  }}
                />
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
                  size="md"
                  className="bg-[#20263e] hover:bg-[#2d3550] text-white px-8 py-3 text-lg"
                >
                  發布案件
                </Button>
              </Link>
              <Link href="/projects">
                <Button
                  variant="outline"
                  size="md"
                  className="border-2 border-[#20263e] text-[#20263e] px-8 py-3 text-lg hover:bg-transparent hover:text-[#20263e]"
                >
                  探索案件
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

