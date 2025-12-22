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
              <div className="flex space-x-4">
                {/* Facebook */}
                <a
                  href="#"
                  className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-[#c5ae8c] hover:text-[#20263e] transition-all duration-300"
                  onClick={(e) => e.preventDefault()}
                  aria-label="Facebook"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                {/* Twitter/X */}
                <a
                  href="#"
                  className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-[#c5ae8c] hover:text-[#20263e] transition-all duration-300"
                  onClick={(e) => e.preventDefault()}
                  aria-label="Twitter"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                {/* GitHub */}
                <a
                  href="#"
                  className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-[#c5ae8c] hover:text-[#20263e] transition-all duration-300"
                  onClick={(e) => e.preventDefault()}
                  aria-label="GitHub"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
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
                <li>
                  <a href="mailto:contact@200ok.io" className="text-gray-400 hover:text-[#c5ae8c] transition-colors flex items-center group">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c5ae8c] mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    聯絡我們
                  </a>
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
