import { NextRequest } from "next/server";
import { AdminService } from "@/services/admin.service";
import { asyncHandler } from "@/middleware/error.middleware";
import { requireAuth } from "@/middleware/auth.middleware";
import { successResponse } from "@/lib/response";

export const dynamic = 'force-dynamic';

/**
 * 取得所有使用者列表（管理員專用）
 * GET /api/v1/admin/users
 */
export const GET = asyncHandler(async (request: NextRequest) => {
  // 需要登入
  const authUser = requireAuth(request);

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || undefined;

  // 取得使用者列表
  const adminService = new AdminService();
  const result = await adminService.getAllUsers(
    authUser.roles,
    page,
    limit,
    search
  );

  return successResponse(result);
});

