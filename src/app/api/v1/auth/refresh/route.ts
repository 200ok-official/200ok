import { NextRequest } from "next/server";
import { z } from "zod";
import { AuthService } from "@/services/auth.service";
import { asyncHandler } from "@/middleware/error.middleware";
import { validateBody } from "@/middleware/validation.middleware";
import { successResponse } from "@/lib/response";

const refreshSchema = z.object({
  refresh_token: z.string().min(1, "請提供 Refresh Token"),
});

/**
 * 刷新 Access Token
 * POST /api/v1/auth/refresh
 */
export const POST = asyncHandler(async (request: NextRequest) => {
  // 驗證請求體
  const { refresh_token } = await validateBody(request, refreshSchema);

  // 刷新 token
  const authService = new AuthService();
  const result = await authService.refreshAccessToken(refresh_token);

  return successResponse(result, "Token 刷新成功");
});

