import { NextRequest } from "next/server";
import { AdminService } from "@/services/admin.service";
import { asyncHandler } from "@/middleware/error.middleware";
import { requireAuth } from "@/middleware/auth.middleware";
import { successResponse } from "@/lib/response";
import { ProjectStatus } from "@/types";

export const dynamic = 'force-dynamic';

/**
 * 取得所有案件列表（管理員專用）
 * GET /api/v1/admin/projects
 */
export const GET = asyncHandler(async (request: NextRequest) => {
  // 需要登入
  const authUser = requireAuth(request);

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const status = searchParams.get("status") as ProjectStatus | null;
  const search = searchParams.get("search") || undefined;

  // 取得案件列表
  const adminService = new AdminService();
  const result = await adminService.getAllProjects(
    authUser.roles,
    page,
    limit,
    status || undefined,
    search
  );

  return successResponse(result);
});

