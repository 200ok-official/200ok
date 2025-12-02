"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export const Navbar: React.FC = () => {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; id: string } | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    // 檢查是否已登入
    const token = localStorage.getItem("access_token");
    const userData = localStorage.getItem("user");
    
    if (token && userData) {
      setIsLoggedIn(true);
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        // 取得代幣餘額和未讀訊息
        fetchTokenBalance(token);
        fetchUnreadCount(token);
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }
  }, []);

  const fetchTokenBalance = async (token: string) => {
    try {
      const response = await fetch('/api/v1/tokens/balance', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const { data } = await response.json();
        setTokenBalance(data.balance);
      } else if (response.status === 401) {
        // Token 過期或無效，清除登入狀態
        console.warn('Token 無效或已過期，請重新登入');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        setIsLoggedIn(false);
        setUser(null);
        setTokenBalance(null);
      }
    } catch (error) {
      // 靜默處理錯誤，不影響頁面顯示
      setTokenBalance(null);
    }
  };

  const fetchUnreadCount = async (token: string) => {
    try {
      const response = await fetch('/api/v1/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const { data } = await response.json();
        // 計算未讀訊息（簡化版，實際應該從後端 API 取得）
        // 這裡暫時設為 0，之後可以實作專門的未讀 API
        setUnreadCount(0);
      } else if (response.status === 401) {
        // Token 過期或無效，不需要重複清除（fetchTokenBalance 已處理）
        setUnreadCount(0);
      }
    } catch (error) {
      // 靜默處理錯誤，不影響頁面顯示
      setUnreadCount(0);
    }
  };

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
                {/* 代幣餘額 */}
                <Link 
                  href="/tokens" 
                  className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-[#c5ae8c] text-[#20263e] rounded-full hover:bg-[#d4be9c] transition-colors"
                  title="代幣管理"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold">
                    {tokenBalance !== null ? tokenBalance.toLocaleString() : '...'} 
                  </span>
                </Link>

                {/* 訊息通知 */}
                <Link 
                  href="/conversations" 
                  className="relative p-2 hover:text-[#c5ae8c] transition-colors"
                  title="聊天室"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

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
