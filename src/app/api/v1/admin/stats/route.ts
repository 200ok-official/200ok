import { NextRequest } from "next/server";
import { AdminService } from "@/services/admin.service";
import { asyncHandler } from "@/middleware/error.middleware";
import { requireAuth } from "@/middleware/auth.middleware";
import { successResponse } from "@/lib/response";

/**
 * 取得平台統計資訊（管理員專用）
 * GET /api/v1/admin/stats
 */
export const GET = asyncHandler(async (request: NextRequest) => {
  // 需要登入
  const authUser = requireAuth(request);

  // 取得統計資訊
  const adminService = new AdminService();
  const stats = await adminService.getPlatformStats(authUser.roles);

  return successResponse(stats);
});

