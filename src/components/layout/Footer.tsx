"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { LegalModal } from "@/components/ui/LegalModal";

export const Footer: React.FC = () => {
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalType, setLegalType] = useState<"terms" | "privacy">("terms");

  const openLegalModal = (type: "terms" | "privacy") => {
    setLegalType(type);
    setLegalModalOpen(true);
  };

  return (
    <>
      <footer className="bg-[#20263e] text-white pt-16 pb-8 border-t border-[#c5ae8c]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-12">
            {/* Brand Column */}
            <div className="space-y-6">
              <Link href="/" className="inline-block">
                <Image
                  src="/200ok_logo_light.png"
                  alt="200 OK Logo"
                  width={160}
                  height={160}
                  className="h-12 w-auto"
                />
              </Link>
              <p className="text-gray-400 text-sm leading-relaxed">
                200 OK 是專業的軟體外包接案平台，致力於連結優秀的開發者與需求方，透過透明的機制與 AI 輔助，打造高品質的專案合作體驗。
              </p>
              <div className="flex flex-col space-y-2">
                <a 
                  href="mailto:200okoffic@gmail.com" 
                  className="inline-flex items-center text-gray-400 hover:text-[#c5ae8c] transition-colors group"
                >
                  <span className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center mr-3 group-hover:bg-[#c5ae8c] group-hover:text-[#20263e] transition-all duration-300">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  200okoffic@gmail.com
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-[#c5ae8c] font-semibold text-lg mb-6">平台服務</h3>
              <ul className="space-y-4">
                <li>
                  <Link href="/projects" className="text-gray-400 hover:text-[#c5ae8c] transition-colors flex items-center group">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c5ae8c] mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    探索案件
                  </Link>
                </li>
                <li>
                  <Link href="/freelancers" className="text-gray-400 hover:text-[#c5ae8c] transition-colors flex items-center group">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c5ae8c] mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    尋找接案工程師
                  </Link>
                </li>
                <li>
                  <Link href="/how-it-works" className="text-gray-400 hover:text-[#c5ae8c] transition-colors flex items-center group">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c5ae8c] mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    如何運作
                  </Link>
                </li>
                <li>
                  <Link href="/team" className="text-gray-400 hover:text-[#c5ae8c] transition-colors flex items-center group">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c5ae8c] mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    開發團隊
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-[#c5ae8c] font-semibold text-lg mb-6">支援與幫助</h3>
              <ul className="space-y-4">
                <li>
                  <Link 
                    href="/how-it-works#faq" 
                    className="text-gray-400 hover:text-[#c5ae8c] transition-colors flex items-center group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c5ae8c] mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    常見問題 (FAQ)
                  </Link>
                </li>
                <li>
                  <button 
                    onClick={() => openLegalModal("terms")}
                    className="text-gray-400 hover:text-[#c5ae8c] transition-colors flex items-center group text-left w-full"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c5ae8c] mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    服務條款
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => openLegalModal("privacy")}
                    className="text-gray-400 hover:text-[#c5ae8c] transition-colors flex items-center group text-left w-full"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c5ae8c] mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    隱私權政策
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} 200 OK. All rights reserved.
            </p>
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                系統運作正常
              </span>
            </div>
          </div>
        </div>
      </footer>
      <LegalModal 
        isOpen={legalModalOpen} 
        onClose={() => setLegalModalOpen(false)} 
        type={legalType}
      />
    </>
  );
};
