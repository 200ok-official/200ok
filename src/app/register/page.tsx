"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { apiPost, apiGet } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 驗證密碼
    if (formData.password !== formData.confirmPassword) {
      setError("密碼不一致");
      return;
    }

    if (formData.password.length < 8) {
      setError("密碼長度至少需要 8 個字元");
      return;
    }

    // 驗證密碼強度（至少包含大小寫字母與數字）
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(formData.password)) {
      setError("密碼需包含大小寫字母與數字");
      return;
    }

    setLoading(true);

    try {
      await apiPost("/api/v1/auth/register", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        roles: ["client"], // 預設為發案者，之後可在個人資料頁面更改
      });

      // 顯示驗證郵件提示
      setShowVerificationMessage(true);
      
      // 5秒後導向登入頁
      setTimeout(() => {
        router.push("/login");
      }, 5000);
    } catch (err: any) {
      setError(err.message || "註冊失敗，請稍後再試");
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

  if (showVerificationMessage) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f5f3ed]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="max-w-md w-full">
            <Card className="p-8 text-center bg-white shadow-lg border-2 border-[#c5ae8c]">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-[#20263e] mb-3">
                註冊成功！
              </h2>
              <p className="text-[#c5ae8c] mb-4">
                我們已經寄送驗證郵件到
              </p>
              <p className="text-lg font-semibold text-[#20263e] mb-6">
                {formData.email}
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>下一步：</strong> 請前往您的信箱點擊驗證連結，完成帳號啟用。
                </p>
              </div>
              <p className="text-xs text-[#c5ae8c] mb-4">
                沒收到郵件？檢查垃圾郵件資料夾，或
              </p>
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    await apiGet(`/api/v1/auth/verify-email?email=${formData.email}`);
                    alert("✅ 驗證郵件已重新發送！");
                  } catch (error: any) {
                    alert(`❌ ${error.message || "重新發送失敗"}`);
                  }
                }}
                className="mb-4"
              >
                重新發送驗證郵件
              </Button>
              <p className="text-sm text-[#c5ae8c]">
                即將自動跳轉到登入頁面...
              </p>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f3ed]">
      <Navbar />
      <main className="flex-1 py-12 px-4">
        <div className="max-w-md w-full mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-[#20263e] mb-3">
              建立您的帳號
            </h2>
            <p className="text-[#c5ae8c]">
              加入我們，開始您的接案或發案之旅
            </p>
          </div>

          {/* Google Login Notice */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-800">
                  <strong>Google 登入修復中</strong>，請先用信箱註冊以體驗完整功能。
                </p>
              </div>
            </div>
          </div>

          {/* Registration Form */}
          <Card className="p-8 bg-white shadow-lg border-2 border-[#c5ae8c]">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded">
                  <p className="font-medium">{error}</p>
                </div>
              )}

              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-semibold text-[#20263e] mb-2"
                >
                  姓名 *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-[#c5ae8c] rounded-lg focus:ring-2 focus:ring-[#20263e] focus:border-[#20263e] transition"
                  placeholder="您的姓名"
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-[#20263e] mb-2"
                >
                  電子郵件 *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-[#c5ae8c] rounded-lg focus:ring-2 focus:ring-[#20263e] focus:border-[#20263e] transition"
                  placeholder="your@email.com"
                />
                <p className="mt-1 text-xs text-[#c5ae8c]">
                  註冊後我們會寄送驗證信到此信箱
                </p>
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-semibold text-[#20263e] mb-2"
                >
                  手機號碼（選填）
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-[#c5ae8c] rounded-lg focus:ring-2 focus:ring-[#20263e] focus:border-[#20263e] transition"
                  placeholder="0912-345-678"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-[#20263e] mb-2"
                >
                  密碼 *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-[#c5ae8c] rounded-lg focus:ring-2 focus:ring-[#20263e] focus:border-[#20263e] transition"
                  placeholder="••••••••"
                />
                <p className="mt-1 text-xs text-[#c5ae8c]">
                  至少 8 個字元，需包含大小寫字母與數字
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-semibold text-[#20263e] mb-2"
                >
                  確認密碼 *
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-[#c5ae8c] rounded-lg focus:ring-2 focus:ring-[#20263e] focus:border-[#20263e] transition"
                  placeholder="••••••••"
                />
              </div>

              {/* Terms */}
              <div className="flex items-start">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  className="h-4 w-4 text-[#20263e] focus:ring-[#20263e] border-[#c5ae8c] rounded mt-1"
                />
                <label htmlFor="terms" className="ml-2 text-sm text-[#20263e]">
                  我同意{" "}
                  <a
                    href="#"
                    className="text-[#20263e] hover:text-[#c5ae8c] transition underline font-semibold"
                  >
                    服務條款
                  </a>{" "}
                  和{" "}
                  <a
                    href="#"
                    className="text-[#20263e] hover:text-[#c5ae8c] transition underline font-semibold"
                  >
                    隱私政策
                  </a>
                </label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full py-3 text-lg bg-[#20263e] hover:bg-[#2d3550] text-white font-semibold"
              >
                {loading ? "註冊中..." : "完成註冊"}
              </Button>
            </form>
          </Card>

          {/* Login Link */}
          <p className="text-center text-sm text-[#20263e] mt-6">
            已經有帳號？{" "}
            <Link
              href="/login"
              className="font-semibold text-[#20263e] hover:text-[#c5ae8c] transition underline"
            >
              立即登入
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
