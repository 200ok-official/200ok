import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

// 定義 CSS 動畫
const styles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fade-in-up {
    animation: fadeInUp 0.8s ease-out forwards;
    opacity: 0; /* 初始狀態為隱藏 */
  }

  .delay-100 {
    animation-delay: 0.1s;
  }
  
  .delay-200 {
    animation-delay: 0.2s;
  }

  .delay-300 {
    animation-delay: 0.3s;
  }
  
  .delay-400 {
    animation-delay: 0.4s;
  }
  
  .delay-500 {
    animation-delay: 0.5s;
  }
`;

const TeamMemberCard = ({ name, role, description, delay }: { name: string, role: string, description: string, delay: string }) => (
  <div className={`bg-white/5 backdrop-blur-sm rounded-xl p-8 flex flex-col items-center text-center transform hover:-translate-y-2 transition-all duration-300 border border-white/10 hover:border-[#c5ae8c]/50 shadow-xl hover:shadow-2xl hover:shadow-[#c5ae8c]/10 animate-fade-in-up ${delay}`}>
    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#c5ae8c] to-[#e6dfcf] flex items-center justify-center mb-6 shadow-lg shadow-black/20 text-[#20263e] text-4xl font-bold ring-4 ring-[#20263e]/50 ring-offset-2 ring-offset-transparent">
      {name[0]}
    </div>
    <h3 className="text-xl font-bold text-white mb-2 tracking-wide">{name}</h3>
    <div className="text-[#c5ae8c] font-medium mb-4">{role}</div>
    <p className="text-gray-300 text-sm leading-relaxed">{description}</p>
  </div>
);

export default function TeamPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="min-h-screen bg-[#20263e] flex flex-col relative overflow-hidden">
        {/* 背景裝飾 */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#c5ae8c]/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-[#c5ae8c]/5 rounded-full blur-3xl"></div>
        </div>

        <Navbar />
        
        <main className="flex-grow pt-12 pb-16 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Header Section */}
            <div className="text-center max-w-3xl mx-auto mb-20 animate-fade-in-up">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                開發團隊
              </h1>
              <div className="w-24 h-1 bg-[#c5ae8c] mx-auto mb-8 rounded-full shadow-[0_0_10px_#c5ae8c]"></div>
              <p className="text-xl text-gray-300 leading-relaxed font-light">
                我們是來自 <span className="font-bold text-[#c5ae8c]">國立臺灣大學 資訊管理學系</span> 的學生。
                <br />
                這是我們在 <span className="font-bold text-[#c5ae8c]">網路服務程式設計</span> 課程中的期末專案。
              </p>
            </div>

            {/* Team Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 mb-20">
              <TeamMemberCard 
                name="Pierre Chen 陳冠宇"
                role="後端工程師 / 資料庫管理"
                description="台大資管系學生，負責系統架構設計與後端開發。"
                delay="delay-200"
              />
              <TeamMemberCard 
                name="陳品翔"
                role="UI/UX 設計師 / 前端工程師"
                description="台大資管系學生，專注於使用者體驗與介面設計。"
                delay="delay-300"
              />
              <TeamMemberCard 
                name="黃聖家"
                role="全端工程師 / 部署測試"
                description="台大資管系學生，負責全端開發與部署測試。"
                delay="delay-400"
              />
            </div>

            {/* Mission/Vision Section */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 md:p-12 shadow-2xl border border-white/10 text-center animate-fade-in-up delay-500 max-w-4xl mx-auto hover:bg-white/10 transition-colors duration-500">
              <h2 className="text-2xl font-bold text-[#c5ae8c] mb-6 tracking-wide">專案理念</h2>
              <p className="text-gray-300 mx-auto leading-relaxed text-lg font-light">
                200 OK 不僅僅是一個代碼，更代表著「成功」與「順利」。我們希望透過這個平台，
                解決接案市場中資訊不對稱與信任建立的問題，讓每一位開發者的才華都能被看見，
                讓每一個專案的需求都能被完美滿足。
              </p>
            </div>

          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
