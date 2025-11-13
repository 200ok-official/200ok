"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export const Navbar: React.FC = () => {
  // 這裡之後可以加入登入狀態判斷
  const isLoggedIn = false;

  return (
    <nav className="bg-[#20263e] text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold">200 OK</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/projects"
              className="hover:text-[#c5ae8c] transition-colors"
            >
              探索案件
            </Link>
            <Link
              href="/freelancers"
              className="hover:text-[#c5ae8c] transition-colors"
            >
              尋找接案工程師
            </Link>
            <Link
              href="/how-it-works"
              className="hover:text-[#c5ae8c] transition-colors"
            >
              如何運作
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            {isLoggedIn ? (
              <>
                <Link href="/dashboard">
                  <Button variant="outline" size="sm">
                    控制台
                  </Button>
                </Link>
                <Link href="/projects/new">
                  <Button variant="secondary" size="sm">
                    發布案件
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline" size="sm">
                    登入
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="secondary" size="sm">
                    註冊
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

