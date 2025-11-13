import { NextRequest } from "next/server";
import { z } from "zod";
import { AuthService } from "@/services/auth.service";
import { asyncHandler } from "@/middleware/error.middleware";
import { validateBody } from "@/middleware/validation.middleware";
import { successResponse } from "@/lib/response";

const logoutSchema = z.object({
  refresh_token: z.string().min(1, "請提供 Refresh Token"),
});

/**
 * 使用者登出
 * POST /api/v1/auth/logout
 */
export const POST = asyncHandler(async (request: NextRequest) => {
  // 驗證請求體
  const { refresh_token } = await validateBody(request, logoutSchema);

  // 登出
  const authService = new AuthService();
  await authService.logout(refresh_token);

  return successResponse(null, "登出成功");
});

