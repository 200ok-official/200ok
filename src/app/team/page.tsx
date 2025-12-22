import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

const TeamMemberCard = ({ name, role, description, delay }: { name: string, role: string, description: string, delay: string }) => (
  <div className={`bg-white rounded-xl shadow-lg p-6 flex flex-col items-center text-center transform hover:-translate-y-2 transition-all duration-300 border border-gray-100 animate-fade-in-up ${delay}`}>
    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#20263e] to-[#c5ae8c] flex items-center justify-center mb-6 shadow-inner text-white text-4xl font-bold">
      {name[0]}
    </div>
    <h3 className="text-xl font-bold text-[#20263e] mb-2">{name}</h3>
    <div className="text-[#c5ae8c] font-medium mb-4">{role}</div>
    <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
  </div>
);

export default function TeamPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header Section */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-[#20263e] mb-6">
              開發團隊
            </h1>
            <div className="w-24 h-1 bg-[#c5ae8c] mx-auto mb-8 rounded-full"></div>
            <p className="text-xl text-gray-600 leading-relaxed">
              我們是來自 <span className="font-bold text-[#20263e]">國立臺灣大學 資訊管理學系</span> 的學生。
              <br />
              這是我們在 <span className="font-bold text-[#20263e]">網路服務程式設計</span> 課程中的期末專案。
            </p>
          </div>

          {/* Team Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 mb-20">
            <TeamMemberCard 
              name="Pierre Chen 陳冠宇"
              role="後端工程師 / 資料庫管理"
              description="台大資管系學生，負責系統架構設計與後端開發。"
              delay="delay-0"
            />
            <TeamMemberCard 
              name="陳品翔"
              role="UI/UX 設計師 / 前端工程師"
              description="台大資管系學生，專注於使用者體驗與介面設計。"
              delay="delay-100"
            />
            <TeamMemberCard 
              name="黃聖家"
              role="全端工程師 / 部署測試"
              description="台大資管系學生，負責全端開發與部署測試。"
              delay="delay-200"
            />
          </div>

          {/* Mission/Vision Section */}
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-gray-100 text-center">
            <h2 className="text-2xl font-bold text-[#20263e] mb-6">專案理念</h2>
            <p className="text-gray-600 max-w-4xl mx-auto leading-relaxed">
              200 OK 不僅僅是一個代碼，更代表著「成功」與「順利」。我們希望透過這個平台，
              解決接案市場中資訊不對稱與信任建立的問題，讓每一位開發者的才華都能被看見，
              讓每一個專案的需求都能被完美滿足。
            </p>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}

