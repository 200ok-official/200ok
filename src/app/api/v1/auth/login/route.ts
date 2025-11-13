import { NextRequest } from "next/server";
import { z } from "zod";
import { AuthService } from "@/services/auth.service";
import { asyncHandler } from "@/middleware/error.middleware";
import { validateBody } from "@/middleware/validation.middleware";
import { successResponse } from "@/lib/response";
import { strictRateLimit } from "@/middleware/ratelimit.middleware";

const loginSchema = z.object({
  email: z.string().email("請輸入有效的 Email"),
  password: z.string().min(1, "請輸入密碼"),
});

/**
 * 使用者登入
 * POST /api/v1/auth/login
 */
export const POST = asyncHandler(async (request: NextRequest) => {
  // Rate limiting
  strictRateLimit(request);

  // 驗證請求體
  const credentials = await validateBody(request, loginSchema);

  // 登入
  const authService = new AuthService();
  const result = await authService.login(credentials);

  return successResponse(result, "登入成功");
});

