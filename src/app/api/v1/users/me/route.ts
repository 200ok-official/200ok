import { NextRequest } from "next/server";
import { z } from "zod";
import { UserService } from "@/services/user.service";
import { asyncHandler } from "@/middleware/error.middleware";
import { requireAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validation.middleware";
import { successResponse, updatedResponse } from "@/lib/response";

export const dynamic = 'force-dynamic';

const updateUserSchema = z.object({
  name: z.string().min(2, "姓名至少需要 2 個字元").max(100).optional(),
  phone: z.string().optional(),
  bio: z.string().max(1000, "自我介紹過長").optional(),
  skills: z.array(z.string()).optional(),
  portfolio_links: z.array(z.string().url("請輸入有效的連結")).optional(),
  roles: z.array(z.enum(["freelancer", "client", "admin"])).optional(),
});

/**
 * 取得目前使用者資料
 * GET /api/v1/users/me
 */
export const GET = asyncHandler(async (request: NextRequest) => {
  // 需要登入
  const authUser = requireAuth(request);

  // 取得使用者資料
  const userService = new UserService();
  const user = await userService.getUserProfile(authUser.userId);

  return successResponse(user);
});

/**
 * 更新目前使用者資料
 * PUT /api/v1/users/me
 */
export const PUT = asyncHandler(async (request: NextRequest) => {
  // 需要登入
  const authUser = requireAuth(request);

  // 驗證請求體
  const data = await validateBody(request, updateUserSchema);

  // 更新使用者資料
  const userService = new UserService();
  const updatedUser = await userService.updateUser(authUser.userId, data);

  return updatedResponse(updatedUser, "個人資料更新成功");
});

