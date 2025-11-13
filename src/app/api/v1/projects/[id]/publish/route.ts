import { NextRequest } from "next/server";
import { ProjectService } from "@/services/project.service";
import { asyncHandler } from "@/middleware/error.middleware";
import { requireAuth } from "@/middleware/auth.middleware";
import { updatedResponse } from "@/lib/response";

/**
 * 發布案件（從草稿變為 open）
 * POST /api/v1/projects/:id/publish
 */
export const POST = asyncHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const projectId = params.id;

    // 需要登入
    const authUser = requireAuth(request);

    // 發布案件
    const projectService = new ProjectService();
    const project = await projectService.publishProject(
      projectId,
      authUser.userId
    );

    return updatedResponse(project, "案件發布成功");
  }
);

