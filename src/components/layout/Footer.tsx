"use client";

import React from "react";
import Link from "next/link";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#20263e] text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 關於我們 */}
          <div>
            <h3 className="text-lg font-semibold mb-4">關於 200 OK</h3>
            <p className="text-sm text-gray-300">
              專業的軟體接案平台，連結優秀的開發者與需求方，打造高品質的軟體專案。
            </p>
          </div>

          {/* 快速連結 */}
          <div>
            <h3 className="text-lg font-semibold mb-4">快速連結</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/projects" className="text-gray-300 hover:text-[#c5ae8c]">
                  探索案件
                </Link>
              </li>
              <li>
                <Link href="/freelancers" className="text-gray-300 hover:text-[#c5ae8c]">
                  尋找接案工程師
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-gray-300 hover:text-[#c5ae8c]">
                  如何運作
                </Link>
              </li>
            </ul>
          </div>

          {/* 服務條款 */}
          <div>
            <h3 className="text-lg font-semibold mb-4">法律資訊</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="text-gray-300 hover:text-[#c5ae8c]">
                  服務條款
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-300 hover:text-[#c5ae8c]">
                  隱私政策
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-300 hover:text-[#c5ae8c]">
                  常見問題
                </Link>
              </li>
            </ul>
          </div>

          {/* 聯絡我們 */}
          <div>
            <h3 className="text-lg font-semibold mb-4">聯絡我們</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>Email: support@200ok.com</li>
              <li>電話: 0800-200-200</li>
              <li>Line: @200ok</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-300">
          <p>&copy; {new Date().getFullYear()} 200 OK. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

