"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { apiGet, apiPost, clearAuth, isAuthenticated } from "@/lib/api";

export const Navbar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; id: string } | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    // 檢查是否已登入
    if (isAuthenticated()) {
      const userData = localStorage.getItem("user");
      if (userData) {
        setIsLoggedIn(true);
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          // 只在初始載入時取得一次代幣餘額
          fetchTokenBalance();
          fetchUnreadCount();
        } catch (e) {
          console.error("Failed to parse user data", e);
        }
      }
    }
  }, []);

  useEffect(() => {
    // 監聽代幣餘額更新事件（只在代幣操作時觸發）
    const handleTokenBalanceUpdate = () => {
      if (isAuthenticated()) {
        fetchTokenBalance();
      }
    };

    // 監聽未讀訊息更新事件
    const handleUnreadCountUpdate = () => {
      if (isAuthenticated()) {
        fetchUnreadCount();
      }
    };

    window.addEventListener('token-balance-updated', handleTokenBalanceUpdate);
    window.addEventListener('unread-count-updated', handleUnreadCountUpdate);

    return () => {
      window.removeEventListener('token-balance-updated', handleTokenBalanceUpdate);
      window.removeEventListener('unread-count-updated', handleUnreadCountUpdate);
    };
  }, []);

  // 當路徑變化時，更新未讀數量（例如從對話列表進入對話詳情）
  useEffect(() => {
    if (isAuthenticated() && pathname) {
      // 延遲一點時間，確保後端已經更新
      const timer = setTimeout(() => {
        fetchUnreadCount();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [pathname, isAuthenticated]);

  const fetchTokenBalance = async () => {
    try {
      const { data } = await apiGet('/api/v1/tokens/balance');
      setTokenBalance(data.balance);
    } catch (error: any) {
      // 靜默處理錯誤，不影響頁面顯示
      // 如果是 token 過期，會由 api.ts 自動處理登出
        setTokenBalance(null);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      // 使用專門的未讀訊息 API（修正路徑）
      const { data } = await apiGet('/api/v1/conversations/me/unread-count');
      setUnreadCount(data.unread_count || 0);
    } catch (error) {
      // 靜默處理錯誤，不影響頁面顯示
      setUnreadCount(0);
    }
  };

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem("refresh_token");
      
      if (refreshToken) {
        await apiPost("/api/v1/auth/logout", { refresh_token: refreshToken });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // 清除本地儲存
      clearAuth();
      
      setIsLoggedIn(false);
      setUser(null);
      router.push("/");
      router.refresh();
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#20263e] text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/200ok_logo_light.png"
              alt="200 OK Logo"
              width={140}
              height={140}
              className="h-10 w-auto"
            />
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6 ml-8">
            <Link
              href="/projects"
              className={`hover:text-[#c5ae8c] transition-colors relative group ${
                pathname === "/projects" || pathname?.startsWith("/projects/")
                  ? "after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1px] after:bg-[#c5ae8c]"
                  : "after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[1px] after:bg-[#c5ae8c] after:w-0 after:transition-all after:duration-300 hover:after:w-full"
              }`}
            >
              探索案件
            </Link>
            <Link
              href="/freelancers"
              className={`hover:text-[#c5ae8c] transition-colors relative group ${
                pathname === "/freelancers" || pathname?.startsWith("/freelancers/")
                  ? "after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1px] after:bg-[#c5ae8c]"
                  : "after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[1px] after:bg-[#c5ae8c] after:w-0 after:transition-all after:duration-300 hover:after:w-full"
              }`}
            >
              尋找接案工程師
            </Link>
            <Link
              href="/how-it-works"
              className={`hover:text-[#c5ae8c] transition-colors relative group ${
                pathname === "/how-it-works" || pathname?.startsWith("/how-it-works/")
                  ? "after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1px] after:bg-[#c5ae8c]"
                  : "after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[1px] after:bg-[#c5ae8c] after:w-0 after:transition-all after:duration-300 hover:after:w-full"
              }`}
            >
              如何運作
            </Link>
          </div>

          {/* Auth Section */}
          <div className="flex items-center space-x-4 ml-auto">
            {isLoggedIn ? (
              <>
                {/* 訊息通知 */}
                <Link 
                  href="/conversations" 
                  className="relative p-2 hover:text-[#c5ae8c] transition-all duration-300 hover:scale-110"
                  title="聊天室"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  {(unreadCount ?? 0) > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* 發布案件按鈕 - 加號圖標 */}
                <Link 
                  href="/projects/new" 
                  className="hidden md:flex items-center justify-center p-2 text-white hover:text-[#c5ae8c] transition-all duration-300 hover:rotate-90"
                  title="發布案件"
                >
                  <svg 
                    className="w-6 h-6" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={3} 
                      d="M12 4v16m8-8H4" 
                    />
                  </svg>
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
                        <Link
                          href="/tokens"
                          className="block px-4 py-2 text-[#20263e] hover:bg-[#f5f3ed] transition"
                          onClick={() => setShowDropdown(false)}
                        >
                          <div className="flex items-center justify-between">
                            <span>代幣餘額</span>
                            <span className="font-semibold text-[#c5ae8c]">
                              {tokenBalance !== null ? tokenBalance.toLocaleString() : '...'}
                            </span>
                          </div>
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
                <Link 
                  href="/login"
                  className="hover:text-[#c5ae8c] transition-colors"
                >
                  登入
                </Link>
                <div className="w-px h-5 bg-[#c5ae8c]"></div>
                <Link 
                  href="/register"
                  className="hover:text-[#c5ae8c] transition-colors"
                >
                  註冊
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
