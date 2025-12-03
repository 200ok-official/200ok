import { NextRequest } from "next/server";
import { z } from "zod";
import { AuthService } from "@/services/auth.service";
import { asyncHandler } from "@/middleware/error.middleware";
import { validateBody } from "@/middleware/validation.middleware";
import { successResponse } from "@/lib/response";
import { requireAuth } from "@/middleware/auth.middleware";
import { strictRateLimit } from "@/middleware/ratelimit.middleware";

export const dynamic = 'force-dynamic';

const sendCodeSchema = z.object({
  phone: z.string().regex(/^09\d{8}$/, "請輸入有效的台灣手機號碼"),
});

const verifyCodeSchema = z.object({
  phone: z.string().regex(/^09\d{8}$/, "請輸入有效的台灣手機號碼"),
  code: z.string().length(6, "驗證碼應為 6 位數字"),
});

/**
 * 發送手機驗證碼
 * POST /api/v1/auth/verify-phone
 */
export const POST = asyncHandler(async (request: NextRequest) => {
  // Rate limiting
  strictRateLimit(request);

  // 需要登入
  const user = requireAuth(request);

  // 驗證請求體
  const { phone } = await validateBody(request, sendCodeSchema);

  // 發送驗證碼
  const authService = new AuthService();
  const code = await authService.sendPhoneVerificationCode(phone);

  // 在開發環境回傳驗證碼（生產環境不應回傳）
  const responseData =
    process.env.NODE_ENV === "development"
      ? { message: "驗證碼已發送", code }
      : { message: "驗證碼已發送" };

  return successResponse(responseData);
});

/**
 * 驗證手機號碼
 * PUT /api/v1/auth/verify-phone
 */
export const PUT = asyncHandler(async (request: NextRequest) => {
  // 需要登入
  const user = requireAuth(request);

  // 驗證請求體
  const { phone, code } = await validateBody(request, verifyCodeSchema);

  // TODO: 實際應該從 Redis 取得儲存的驗證碼並比對
  // 這裡僅模擬驗證成功

  // 更新使用者手機號碼
  const authService = new AuthService();
  await authService.verifyPhone(user.userId, phone);

  return successResponse({ verified: true }, "手機驗證成功");
});

