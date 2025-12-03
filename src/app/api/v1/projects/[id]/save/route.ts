import { NextRequest } from "next/server";
import { ProjectService } from "@/services/project.service";
import { asyncHandler } from "@/middleware/error.middleware";
import { requireAuth } from "@/middleware/auth.middleware";
import { createdResponse, deletedResponse } from "@/lib/response";

export const dynamic = 'force-dynamic';

/**
 * 收藏案件
 * POST /api/v1/projects/:id/save
 */
export const POST = asyncHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const projectId = params.id;

    // 需要登入
    const authUser = requireAuth(request);

    // 收藏案件
    const projectService = new ProjectService();
    await projectService.saveProject(authUser.userId, projectId);

    return createdResponse(null, "案件收藏成功");
  }
);

/**
 * 取消收藏案件
 * DELETE /api/v1/projects/:id/save
 */
export const DELETE = asyncHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const projectId = params.id;

    // 需要登入
    const authUser = requireAuth(request);

    // 取消收藏
    const projectService = new ProjectService();
    await projectService.unsaveProject(authUser.userId, projectId);

    return deletedResponse("已取消收藏");
  }
);

