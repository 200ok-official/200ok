"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export const Navbar: React.FC = () => {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    // 檢查是否已登入
    const token = localStorage.getItem("access_token");
    const userData = localStorage.getItem("user");
    
    if (token && userData) {
      setIsLoggedIn(true);
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }
  }, []);

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem("refresh_token");
      
      if (refreshToken) {
        await fetch("/api/v1/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // 清除本地儲存
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      
      setIsLoggedIn(false);
      setUser(null);
      router.push("/");
      router.refresh();
    }
  };

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

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {isLoggedIn ? (
              <>
                {/* 發布案件按鈕 */}
                <Link href="/projects/new" className="hidden md:inline-block">
                  <Button variant="secondary" size="sm">
                    發布案件
                  </Button>
                </Link>

                {/* 使用者選單 */}
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center space-x-2 hover:text-[#c5ae8c] transition-colors"
                  >
                    <div className="w-8 h-8 bg-[#c5ae8c] rounded-full flex items-center justify-center">
                      <span className="text-[#20263e] font-bold text-sm">
                        {user?.name?.charAt(0).toUpperCase() || "U"}
                      </span>
                    </div>
                    <span className="hidden md:inline">{user?.name}</span>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {showDropdown && (
                    <>
                      {/* 背景遮罩 */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowDropdown(false)}
                      ></div>
                      
                      {/* 下拉選單 */}
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-20 border border-[#c5ae8c]">
                        <Link
                          href="/profile"
                          className="block px-4 py-2 text-[#20263e] hover:bg-[#f5f3ed] transition"
                          onClick={() => setShowDropdown(false)}
                        >
                          個人資料
                        </Link>
                        <Link
                          href="/projects/me"
                          className="block px-4 py-2 text-[#20263e] hover:bg-[#f5f3ed] transition"
                          onClick={() => setShowDropdown(false)}
                        >
                          我的案件
                        </Link>
                        <Link
                          href="/bids/me"
                          className="block px-4 py-2 text-[#20263e] hover:bg-[#f5f3ed] transition"
                          onClick={() => setShowDropdown(false)}
                        >
                          我的投標
                        </Link>
                        <hr className="my-2 border-[#c5ae8c]" />
                        <button
                          onClick={() => {
                            setShowDropdown(false);
                            handleLogout();
                          }}
                          className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition"
                        >
                          登出
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="secondary" size="sm">
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
