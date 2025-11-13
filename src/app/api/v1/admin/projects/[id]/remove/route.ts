import { NextRequest } from "next/server";
import { AdminService } from "@/services/admin.service";
import { asyncHandler } from "@/middleware/error.middleware";
import { requireAuth } from "@/middleware/auth.middleware";
import { updatedResponse } from "@/lib/response";

/**
 * 下架違規案件（管理員專用）
 * POST /api/v1/admin/projects/:id/remove
 */
export const POST = asyncHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const projectId = params.id;

    // 需要登入
    const authUser = requireAuth(request);

    // 下架案件
    const adminService = new AdminService();
    const project = await adminService.removeProject(
      authUser.roles,
      projectId
    );

    return updatedResponse(project, "案件已下架");
  }
);

