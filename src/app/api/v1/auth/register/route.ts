import { NextRequest } from "next/server";
import { z } from "zod";
import { AuthService } from "@/services/auth.service";
import { asyncHandler } from "@/middleware/error.middleware";
import { validateBody } from "@/middleware/validation.middleware";
import { createdResponse } from "@/lib/response";
import { strictRateLimit } from "@/middleware/ratelimit.middleware";
import { validatePasswordStrength } from "@/utils/password";
import { UserRole } from "@/types";

const registerSchema = z.object({
  name: z.string().min(2, "姓名至少需要 2 個字元").max(100, "姓名過長"),
  email: z.string().email("請輸入有效的 Email"),
  password: z.string().min(8, "密碼至少需要 8 個字元"),
  roles: z.array(z.enum(["freelancer", "client", "admin"])).min(1, "請選擇至少一個角色"),
});

/**
 * 註冊新使用者
 * POST /api/v1/auth/register
 */
export const POST = asyncHandler(async (request: NextRequest) => {
  // Rate limiting
  strictRateLimit(request);

  // 驗證請求體
  const data = await validateBody(request, registerSchema);

  // 驗證密碼強度
  const passwordValidation = validatePasswordStrength(data.password);
  if (!passwordValidation.isValid) {
    throw new Error(passwordValidation.errors.join(", "));
  }

  // 註冊使用者
  const authService = new AuthService();
  const result = await authService.register(data);

  return createdResponse(result, "註冊成功");
});

