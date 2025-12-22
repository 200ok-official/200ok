"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { apiPost } from "@/lib/api";
import { getRememberMe, saveRememberMe, clearRememberMe } from "@/lib/rememberMe";

// 提取使用 useSearchParams 的組件
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: sessionStatus } = useSession();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: boolean; password?: boolean }>({});
  const [loading, setLoading] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [googleLoginProcessed, setGoogleLoginProcessed] = useState(false);

  // 震動效果觸發器
  const triggerShake = () => {
    // 先設為 false 以確保動畫可以重啟
    setIsShaking(false);
    
    setTimeout(() => {
      setIsShaking(true);
    }, 10);

    setTimeout(() => {
      setIsShaking(false);
    }, 600); // 稍微比動畫長一點
  };

  // 檢查是否有從 URL 或 localStorage 來的 returnUrl
  useEffect(() => {
    const urlReturnUrl = searchParams?.get('returnUrl');
    if (urlReturnUrl && typeof window !== 'undefined') {
      localStorage.setItem('returnUrl', urlReturnUrl);
    }
    
    // 檢查是否有 NextAuth 錯誤
    const authError = searchParams?.get('error');
    if (authError) {
      let errorMessage = "登入失敗，請稍後再試";
      
      // 根據錯誤類型顯示不同的錯誤訊息
      if (authError === 'OAuthSignin') {
        errorMessage = "無法連接到 Google 登入服務";
      } else if (authError === 'OAuthCallback') {
        errorMessage = "Google 登入回調失敗";
      } else if (authError === 'OAuthCreateAccount') {
        errorMessage = "無法創建帳號，請稍後再試";
      } else if (authError === 'EmailCreateAccount') {
        errorMessage = "Email 已被使用";
      } else if (authError === 'Callback') {
        errorMessage = "登入驗證失敗";
      } else if (authError === 'OAuthAccountNotLinked') {
        errorMessage = "此 Email 已被其他登入方式使用";
      } else if (authError === 'SessionRequired') {
        errorMessage = "需要重新登入";
      } else if (authError === 'Default') {
        errorMessage = "登入過程中發生錯誤";
      }
      
      setError(errorMessage);
      triggerShake();
    }
    
    // 檢查是否有記住的 email
    const rememberedEmail = getRememberMe();
    if (rememberedEmail) {
      setFormData(prev => ({
        ...prev,
        email: rememberedEmail,
        rememberMe: true,
      }));
    }
  }, [searchParams]);

  // 處理 Google 登入成功後的情況
  useEffect(() => {
    // 如果 session 還在載入中，不處理
    if (sessionStatus === 'loading') {
      return;
    }

    // 如果已經處理過 Google 登入，不再重複處理
    if (googleLoginProcessed) {
      return;
    }

    // 檢查是否有 Google 登入的 tokens
    if (sessionStatus === 'authenticated' && session) {
      try {
        const sessionAny = session as any;
        const accessToken = sessionAny.accessToken;
        const refreshToken = sessionAny.refreshToken;
        const userAny = session.user as any;
        const userId = userAny?.id;
        const userEmail = session.user?.email;
        const userName = session.user?.name;
        const userRoles = userAny?.roles;
        const userAvatarUrl = userAny?.avatar_url;

        // 如果有 accessToken，表示 Google 登入成功
        if (accessToken && refreshToken && userId) {
          // 標記為已處理，避免重複處理
          setGoogleLoginProcessed(true);

          // 將 tokens 和 user 資訊保存到 localStorage
          localStorage.setItem('access_token', accessToken);
          localStorage.setItem('refresh_token', refreshToken);
          localStorage.setItem('user', JSON.stringify({
            id: userId,
            email: userEmail,
            name: userName,
            roles: userRoles || [],
            avatar_url: userAvatarUrl || null,
          }));

          // 檢查是否有返回 URL
          const urlReturnUrl = searchParams?.get('returnUrl');
          const storedReturnUrl = localStorage.getItem('returnUrl');
          const returnUrl = urlReturnUrl || storedReturnUrl;

          // 清除 returnUrl
          if (storedReturnUrl) {
            localStorage.removeItem('returnUrl');
          }

          // 跳轉到返回頁面或首頁
          if (returnUrl && returnUrl !== '/login') {
            router.push(returnUrl);
          } else {
            router.push('/');
          }
          router.refresh();
        } else {
          // 如果沒有 tokens，可能是 Google 登入失敗
          console.warn('Google login failed: missing tokens or user ID');
        }
      } catch (error) {
        console.error('Error processing Google login:', error);
        // 不設置錯誤訊息，避免干擾用戶體驗
      }
    }
  }, [session, sessionStatus, router, searchParams, googleLoginProcessed]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    
    // 前端基本驗證
    const newFieldErrors: { email?: boolean; password?: boolean } = {};
    if (!formData.email) {
      newFieldErrors.email = true;
    }
    if (!formData.password) {
      newFieldErrors.password = true;
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      setError("請填寫所有必要欄位");
      triggerShake();
      return;
    }
    
    setLoading(true);

    try {
      const data = await apiPost("/api/v1/auth/login", formData);

      // 儲存 token
      localStorage.setItem("access_token", data.data.access_token);
      localStorage.setItem("refresh_token", data.data.refresh_token);
      localStorage.setItem("user", JSON.stringify(data.data.user));

      // 根據 rememberMe 狀態處理 email 記憶
      if (formData.rememberMe) {
        saveRememberMe(formData.email);
      } else {
        clearRememberMe();
      }

      // 檢查是否有返回 URL（優先順序：URL query > localStorage）
      const urlReturnUrl = searchParams?.get('returnUrl');
      const storedReturnUrl = localStorage.getItem("returnUrl");
      const returnUrl = urlReturnUrl || storedReturnUrl;

      // 清除 returnUrl
      if (storedReturnUrl) {
        localStorage.removeItem("returnUrl");
      }

      // 跳轉到返回頁面或首頁
      if (returnUrl && returnUrl !== '/login') {
        router.push(returnUrl);
      } else {
        router.push("/");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || "登入失敗，請稍後再試");
      setFieldErrors({ email: true, password: true });
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    // 如果取消勾選「記住我」，立即清除 LocalStorage
    if (name === 'rememberMe' && !checked) {
      clearRememberMe();
    }
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
    // 當用戶開始輸入時，清除該欄位的錯誤狀態
    if (fieldErrors[name as keyof typeof fieldErrors]) {
      setFieldErrors(prev => ({ ...prev, [name]: false }));
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError("");
      
      // 保存當前的 returnUrl 到 localStorage
      const urlReturnUrl = searchParams?.get('returnUrl');
      if (urlReturnUrl) {
        localStorage.setItem('returnUrl', urlReturnUrl);
      }
      
      await signIn("google", { 
        callbackUrl: urlReturnUrl || "/" 
      });
    } catch (error) {
      console.error("Google login error:", error);
      setError("Google 登入失敗，請稍後再試");
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-[#e6dfcf] px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-4">
        {/* Logo / Header */}
        <div className="text-center">
          <Link href="/" className="inline-block mb-2">
            <img 
              src="/200ok_logo_dark.png" 
              alt="200 OK" 
              className="h-20 mx-auto"
            />
          </Link>
          <h2 className="text-2xl font-semibold text-[#20263e] mt-2">
            歡迎回來
          </h2>
          <p className="mt-1 text-[#c5ae8c] text-lg">
            登入您的帳號開始使用
          </p>
        </div>

        {/* Login Form */}
        <Card className="p-6 bg-white shadow-lg border-2 border-[#c5ae8c]">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded">
                <p className="font-medium">{error}</p>
              </div>
            )}

            {/* Email */}
            <div className={`block ${fieldErrors.email && isShaking ? "shake-active" : ""}`}>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-[#20263e] mb-2"
              >
                電子郵件
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 transition-all bg-[#e6dfcf]/30 ${
                  fieldErrors.email 
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500" 
                    : "border-[#c5ae8c] focus:ring-[#20263e] focus:border-[#20263e]"
                }`}
                placeholder="your@email.com"
              />
            </div>

            {/* Password */}
            <div className={`block ${fieldErrors.password && isShaking ? "shake-active" : ""}`}>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-[#20263e] mb-2"
              >
                密碼
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 transition-all bg-[#e6dfcf]/30 ${
                  fieldErrors.password 
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500" 
                    : "border-[#c5ae8c] focus:ring-[#20263e] focus:border-[#20263e]"
                }`}
                placeholder="••••••••"
              />
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <Checkbox
                    id="rememberMe"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                label="記住電子郵件"
              />

              <div className="text-sm">
                <a
                  href="#"
                  className="font-medium text-[#20263e] hover:text-[#c5ae8c] transition underline decoration-[#c5ae8c]/30 underline-offset-4"
                >
                  忘記密碼？
                </a>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-lg bg-[#20263e] hover:bg-[#2d3550] text-white font-semibold disabled:bg-[#c5ae8c] disabled:cursor-not-allowed"
            >
              {loading ? "登入中..." : "登入"}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#c5ae8c]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-[#c5ae8c] font-medium">
                或
              </span>
            </div>
          </div>

          {/* Google Login */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center px-4 py-3 border-2 border-[#c5ae8c] rounded-lg bg-white hover:bg-[#e6dfcf]/50 transition font-semibold text-[#20263e]"
          >
            <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            使用 Google 登入
          </button>
        </Card>

        {/* Register Link */}
        <p className="text-center text-sm text-[#20263e]">
          還沒有帳號？{" "}
          <Link
            href="/register"
            className="font-semibold text-[#20263e] hover:text-[#c5ae8c] transition underline"
          >
            立即註冊
          </Link>
        </p>
      </div>
    </div>
  );
}

// 主頁面組件，用 Suspense 包裹 LoginForm
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#e6dfcf]">
        <div className="text-center">
          <img 
            src="/200ok_logo_dark.png" 
            alt="200 OK" 
            className="h-24 mx-auto mb-4"
          />
          <p className="text-[#c5ae8c]">載入中...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
