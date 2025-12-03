import { NextRequest } from "next/server";
import { z } from "zod";
import { UserService } from "@/services/user.service";
import { asyncHandler } from "@/middleware/error.middleware";
import { requireAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validation.middleware";
import { successResponse } from "@/lib/response";
import { validatePasswordStrength } from "@/utils/password";

export const dynamic = 'force-dynamic';

const updatePasswordSchema = z.object({
  current_password: z.string().min(1, "請輸入目前密碼"),
  new_password: z.string().min(8, "新密碼至少需要 8 個字元"),
});

/**
 * 更新密碼
 * PUT /api/v1/users/me/password
 */
export const PUT = asyncHandler(async (request: NextRequest) => {
  // 需要登入
  const authUser = requireAuth(request);

  // 驗證請求體
  const data = await validateBody(request, updatePasswordSchema);

  // 驗證新密碼強度
  const passwordValidation = validatePasswordStrength(data.new_password);
  if (!passwordValidation.isValid) {
    throw new Error(passwordValidation.errors.join(", "));
  }

  // 更新密碼
  const userService = new UserService();
  await userService.updatePassword(authUser.userId, data);

  return successResponse(null, "密碼更新成功，請重新登入");
});

