import { NextRequest } from "next/server";
import { AdminService } from "@/services/admin.service";
import { asyncHandler } from "@/middleware/error.middleware";
import { requireAuth } from "@/middleware/auth.middleware";
import { successResponse } from "@/lib/response";

export const dynamic = 'force-dynamic';

/**
 * 取得標籤統計（管理員專用）
 * GET /api/v1/admin/tags/stats
 */
export const GET = asyncHandler(async (request: NextRequest) => {
  // 需要登入
  const authUser = requireAuth(request);

  // 取得標籤統計
  const adminService = new AdminService();
  const stats = await adminService.getTagStats(authUser.roles);

  return successResponse(stats);
});

