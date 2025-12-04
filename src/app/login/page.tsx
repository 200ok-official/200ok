"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { apiPost } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await apiPost("/api/v1/auth/login", formData);

      // 儲存 token
      localStorage.setItem("access_token", data.data.access_token);
      localStorage.setItem("refresh_token", data.data.refresh_token);
      localStorage.setItem("user", JSON.stringify(data.data.user));

      // 檢查是否有返回 URL
      const returnUrl = localStorage.getItem("returnUrl");
      if (returnUrl) {
        localStorage.removeItem("returnUrl");
        router.push(returnUrl);
      } else {
        // 導向首頁或儀表板
        router.push("/");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || "登入失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#e6dfcf] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo / Header */}
        <div className="text-center">
          <Link href="/" className="inline-block mb-4">
            <h1 className="text-5xl font-bold text-[#20263e]">200 OK</h1>
          </Link>
          <h2 className="text-2xl font-semibold text-[#20263e] mt-4">
            歡迎回來
          </h2>
          <p className="mt-2 text-[#c5ae8c] text-lg">
            登入您的帳號開始使用
          </p>
        </div>

        {/* Login Form */}
        <Card className="p-8 bg-white shadow-lg border-2 border-[#c5ae8c]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded">
                <p className="font-medium">{error}</p>
              </div>
            )}

            {/* Email */}
            <div>
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
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-[#c5ae8c] rounded-lg focus:ring-2 focus:ring-[#20263e] focus:border-[#20263e] transition bg-[#e6dfcf]/30"
                placeholder="your@email.com"
              />
            </div>

            {/* Password */}
            <div>
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
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-[#c5ae8c] rounded-lg focus:ring-2 focus:ring-[#20263e] focus:border-[#20263e] transition bg-[#e6dfcf]/30"
                placeholder="••••••••"
              />
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-[#20263e] focus:ring-[#20263e] border-[#c5ae8c] rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-[#20263e]"
                >
                  記住我
                </label>
              </div>

              <div className="text-sm">
                <a
                  href="#"
                  className="font-medium text-[#20263e] hover:text-[#c5ae8c] transition"
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
