"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

type UserRole = "freelancer" | "client";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    roles: [] as UserRole[],
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setFormData({
      ...formData,
      roles: [role],
    });
  };

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
      const response = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          roles: formData.roles,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "註冊失敗");
      }

      // 儲存 token
      localStorage.setItem("access_token", data.data.access_token);
      localStorage.setItem("refresh_token", data.data.refresh_token);
      localStorage.setItem("user", JSON.stringify(data.data.user));

      // 導向首頁
      router.push("/");
      router.refresh();
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

  return (
    <div className="min-h-screen bg-[#e6dfcf] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <h1 className="text-5xl font-bold text-[#20263e]">200 OK</h1>
          </Link>
          <h2 className="text-2xl font-semibold text-[#20263e] mt-4">
            建立您的帳號
          </h2>
          <p className="mt-2 text-[#c5ae8c] text-lg">
            加入我們，開始您的接案或發案之旅
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div
              className={`flex items-center ${
                step === 1 ? "text-[#20263e]" : "text-[#c5ae8c]"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                  step === 1
                    ? "bg-[#20263e] text-white"
                    : "bg-[#c5ae8c]/30 text-[#c5ae8c]"
                }`}
              >
                1
              </div>
              <span className="ml-3 font-semibold hidden sm:inline">
                選擇身份
              </span>
            </div>

            <div className="w-20 h-1 bg-[#c5ae8c]/30"></div>

            <div
              className={`flex items-center ${
                step === 2 ? "text-[#20263e]" : "text-[#c5ae8c]"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                  step === 2
                    ? "bg-[#20263e] text-white"
                    : "bg-[#c5ae8c]/30 text-[#c5ae8c]"
                }`}
              >
                2
              </div>
              <span className="ml-3 font-semibold hidden sm:inline">
                填寫資料
              </span>
            </div>
          </div>
        </div>

        {/* Step 1: Role Selection */}
        {step === 1 && (
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Freelancer Card */}
            <Card
              className={`p-8 transition-all hover:shadow-xl ${
                selectedRole === "freelancer"
                  ? "border-4 border-[#20263e] bg-white shadow-lg scale-105"
                  : selectedRole === "client"
                  ? "border-2 border-[#c5ae8c] bg-gray-50 opacity-60 hover:opacity-80"
                  : "border-2 border-[#c5ae8c] bg-white hover:border-[#20263e] hover:scale-102"
              }`}
              onClick={() => handleRoleSelect("freelancer")}
            >
              <div className="text-center">
                <div className="w-24 h-24 bg-[#20263e] rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    className="w-12 h-12 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-[#20263e] mb-3">
                  我是接案工程師
                </h3>
                <p className="text-[#c5ae8c] mb-6 text-lg">
                  展示您的專業技能，接取心儀的案件
                </p>
                <ul className="text-left space-y-3 text-sm text-[#20263e]">
                  <li className="flex items-center">
                    <svg
                      className="w-5 h-5 text-[#20263e] mr-3 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    瀏覽並投標案件
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-5 h-5 text-[#20263e] mr-3 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    建立個人作品集
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-5 h-5 text-[#20263e] mr-3 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    累積評價與信用
                  </li>
                </ul>
              </div>
            </Card>

            {/* Client Card */}
            <Card
              className={`p-8 transition-all hover:shadow-xl ${
                selectedRole === "client"
                  ? "border-4 border-[#20263e] bg-white shadow-lg scale-105"
                  : selectedRole === "freelancer"
                  ? "border-2 border-[#c5ae8c] bg-gray-50 opacity-60 hover:opacity-80"
                  : "border-2 border-[#c5ae8c] bg-white hover:border-[#20263e] hover:scale-102"
              }`}
              onClick={() => handleRoleSelect("client")}
            >
              <div className="text-center">
                <div className="w-24 h-24 bg-[#20263e] rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    className="w-12 h-12 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-[#20263e] mb-3">
                  我是發案者
                </h3>
                <p className="text-[#c5ae8c] mb-6 text-lg">
                  發布您的需求，尋找最適合的專業人才
                </p>
                <ul className="text-left space-y-3 text-sm text-[#20263e]">
                  <li className="flex items-center">
                    <svg
                      className="w-5 h-5 text-[#20263e] mr-3 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    快速發布案件需求
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-5 h-5 text-[#20263e] mr-3 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    收到專業報價
                  </li>
                  <li className="flex items-center">
                    <svg
                      className="w-5 h-5 text-[#20263e] mr-3 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    安全的交易保障
                  </li>
                </ul>
              </div>
            </Card>
          </div>
        )}

        {step === 1 && (
          <div className="text-center mt-8">
            <Button
              onClick={() => setStep(2)}
              disabled={!selectedRole}
              className="px-12 py-3 text-lg bg-[#20263e] hover:bg-[#2d3550] text-white font-semibold disabled:bg-[#c5ae8c] disabled:cursor-not-allowed"
            >
              下一步
            </Button>
          </div>
        )}

        {/* Step 2: Registration Form */}
        {step === 2 && (
          <Card className="p-8 max-w-2xl mx-auto bg-white border-2 border-[#c5ae8c] shadow-lg">
            <div className="mb-6 flex items-center">
              <Badge
                variant="default"
                className="text-base px-4 py-2"
              >
                {selectedRole === "freelancer" ? "接案工程師" : "發案者"}
              </Badge>
              <button
                onClick={() => setStep(1)}
                className="ml-4 text-sm text-[#20263e] hover:text-[#c5ae8c] transition font-medium"
              >
                ← 變更身份
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded">
                  <p className="font-medium">{error}</p>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
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
                    className="w-full px-4 py-3 border-2 border-[#c5ae8c] rounded-lg focus:ring-2 focus:ring-[#20263e] focus:border-[#20263e] transition bg-[#e6dfcf]/30"
                    placeholder="您的姓名"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-semibold text-[#20263e] mb-2"
                  >
                    手機號碼
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-[#c5ae8c] rounded-lg focus:ring-2 focus:ring-[#20263e] focus:border-[#20263e] transition bg-[#e6dfcf]/30"
                    placeholder="0912-345-678"
                  />
                  <p className="mt-1 text-xs text-[#c5ae8c]">
                    用於安全驗證（可稍後設定）
                  </p>
                </div>
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
                  密碼 * (至少 8 個字元，需包含大小寫字母與數字)
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
                  className="w-full px-4 py-3 border-2 border-[#c5ae8c] rounded-lg focus:ring-2 focus:ring-[#20263e] focus:border-[#20263e] transition bg-[#e6dfcf]/30"
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
              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 border-2 border-[#c5ae8c] text-[#20263e] hover:bg-[#e6dfcf]"
                >
                  上一步
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-[#20263e] hover:bg-[#2d3550] text-white font-semibold disabled:bg-[#c5ae8c] disabled:cursor-not-allowed"
                >
                  {loading ? "註冊中..." : "完成註冊"}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Login Link */}
        <p className="text-center text-sm text-[#20263e] mt-8">
          已經有帳號？{" "}
          <Link
            href="/login"
            className="font-semibold text-[#20263e] hover:text-[#c5ae8c] transition underline"
          >
            立即登入
          </Link>
        </p>
      </div>
    </div>
  );
}
