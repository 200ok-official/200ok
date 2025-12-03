import { NextRequest } from "next/server";
import { ProjectService } from "@/services/project.service";
import { asyncHandler } from "@/middleware/error.middleware";
import { requireAuth } from "@/middleware/auth.middleware";
import { updatedResponse } from "@/lib/response";

export const dynamic = 'force-dynamic';

/**
 * 取消案件
 * POST /api/v1/projects/:id/cancel
 */
export const POST = asyncHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const projectId = params.id;

    // 需要登入
    const authUser = requireAuth(request);

    // 取消案件
    const projectService = new ProjectService();
    const project = await projectService.cancelProject(
      projectId,
      authUser.userId
    );

    return updatedResponse(project, "案件已取消");
  }
);

