import { NextRequest } from "next/server";
import { ProjectService } from "@/services/project.service";
import { asyncHandler } from "@/middleware/error.middleware";
import { requireAuth } from "@/middleware/auth.middleware";
import { successResponse } from "@/lib/response";

export const dynamic = 'force-dynamic';

/**
 * 取得我的收藏案件
 * GET /api/v1/projects/saved
 */
export const GET = asyncHandler(async (request: NextRequest) => {
  // 需要登入
  const authUser = requireAuth(request);

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  // 取得收藏案件
  const projectService = new ProjectService();
  const result = await projectService.getMySavedProjects(
    authUser.userId,
    page,
    limit
  );

  return successResponse(result);
});

