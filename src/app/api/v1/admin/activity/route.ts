import { NextRequest } from "next/server";
import { AdminService } from "@/services/admin.service";
import { asyncHandler } from "@/middleware/error.middleware";
import { requireAuth } from "@/middleware/auth.middleware";
import { successResponse } from "@/lib/response";

export const dynamic = 'force-dynamic';

/**
 * 取得最近活動（管理員專用）
 * GET /api/v1/admin/activity
 */
export const GET = asyncHandler(async (request: NextRequest) => {
  // 需要登入
  const authUser = requireAuth(request);

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "20");

  // 取得最近活動
  const adminService = new AdminService();
  const activity = await adminService.getRecentActivity(authUser.roles, limit);

  return successResponse(activity);
});

