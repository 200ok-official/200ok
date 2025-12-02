import { NextRequest, NextResponse } from "next/server";
import { successResponse } from "@/lib/response";
import { AuthService } from "@/services/auth.service";

/**
 * POST /api/v1/auth/verify-email
 * 驗證用戶的電子郵件
 */
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: "驗證 token 為必填" },
        { status: 400 }
      );
    }

    const authService = new AuthService();
    const result = await authService.verifyEmail(token);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message || "驗證失敗" },
        { status: 400 }
      );
    }

    return successResponse(
      { verified: true },
      "電子郵件驗證成功！"
    );
  } catch (error: any) {
    console.error("[VERIFY_EMAIL_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "驗證失敗" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/auth/verify-email?email=xxx
 * 重新發送驗證郵件
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { success: false, error: "電子郵件為必填" },
        { status: 400 }
      );
    }

    const authService = new AuthService();
    const result = await authService.resendVerificationEmail(email);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message || "發送失敗" },
        { status: 400 }
      );
    }

    return successResponse(
      { sent: true },
      "驗證郵件已重新發送！"
    );
  } catch (error: any) {
    console.error("[RESEND_VERIFICATION_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "發送失敗" },
      { status: 500 }
    );
  }
}

