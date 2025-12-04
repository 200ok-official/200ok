"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { apiPost } from "@/lib/api";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("缺少驗證 token");
      return;
    }

    // 呼叫驗證 API
    apiPost("/api/v1/auth/verify-email", { token })
      .then(() => {
        setStatus("success");
        setMessage("電子郵件驗證成功！");
        // 3秒後導向登入頁
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      })
      .catch((error: any) => {
        console.error("[VERIFY_EMAIL_ERROR]", error);
        setStatus("error");
        setMessage(error.message || "驗證失敗，請稍後再試");
      });
  }, [token, router]);

  return (
    <Card className="p-8 text-center bg-white shadow-lg border-2 border-[#c5ae8c]">
      {status === "verifying" && (
        <>
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#20263e] mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-[#20263e] mb-2">
            驗證中...
          </h2>
          <p className="text-[#c5ae8c]">
            正在驗證您的電子郵件
          </p>
        </>
      )}

      {status === "success" && (
        <>
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
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#20263e] mb-2">
            驗證成功！
          </h2>
          <p className="text-[#c5ae8c] mb-6">
            {message}
          </p>
          <p className="text-sm text-[#c5ae8c]">
            即將自動跳轉到登入頁面...
          </p>
          <Link href="/login" className="mt-4 inline-block">
            <Button className="mt-4">
              前往登入
            </Button>
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-[#20263e] mb-2">
            驗證失敗
          </h2>
          <p className="text-red-600 mb-6">
            {message}
          </p>
          <div className="space-y-3">
            <Link href="/register">
              <Button variant="secondary" className="w-full">
                重新註冊
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="w-full">
                前往登入
              </Button>
            </Link>
          </div>
        </>
      )}
    </Card>
  );
}

function LoadingFallback() {
  return (
    <Card className="p-8 text-center bg-white shadow-lg border-2 border-[#c5ae8c]">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#20263e] mx-auto mb-6"></div>
      <h2 className="text-2xl font-bold text-[#20263e] mb-2">
        載入中...
      </h2>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#e6dfcf] py-12 px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-5xl font-bold text-[#20263e]">200 OK</h1>
          </Link>
        </div>

        <Suspense fallback={<LoadingFallback />}>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
