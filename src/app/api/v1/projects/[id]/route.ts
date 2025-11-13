import { NextRequest } from "next/server";
import { z } from "zod";
import { ProjectService } from "@/services/project.service";
import { asyncHandler } from "@/middleware/error.middleware";
import { requireAuth, optionalAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validation.middleware";
import {
  successResponse,
  updatedResponse,
  deletedResponse,
} from "@/lib/response";
import { ProjectStatus } from "@/types";

const updateProjectSchema = z.object({
  title: z.string().min(5, "標題至少需要 5 個字元").max(150).optional(),
  description: z.string().min(20, "描述至少需要 20 個字元").optional(),
  project_type: z.string().optional(),
  budget_min: z.number().min(0, "預算不能為負數").optional(),
  budget_max: z.number().min(0, "預算不能為負數").optional(),
  budget_estimate_only: z.boolean().optional(),
  start_date: z.coerce.date().optional(),
  deadline: z.coerce.date().optional(),
  deadline_flexible: z.boolean().optional(),
  required_skills: z.array(z.string()).optional(),
  project_brief: z.any().optional(),
  reference_links: z.array(z.string().url("請輸入有效的連結")).optional(),
  design_style: z.string().optional(),
  payment_method: z.string().optional(),
  payment_schedule: z.any().optional(),
  deliverables: z.array(z.string()).optional(),
  communication_preference: z.array(z.string()).optional(),
  special_requirements: z.string().optional(),
  tag_ids: z.array(z.string()).optional(),
  status: z.enum(["draft", "open", "in_progress", "completed", "closed", "cancelled"]).optional(),
});

/**
 * 取得案件詳情
 * GET /api/v1/projects/:id
 */
export const GET = asyncHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const projectId = params.id;

    // 可選登入（登入後可看到是否收藏、投標資訊等）
    const authUser = optionalAuth(request);

    // 取得案件詳情
    const projectService = new ProjectService();
    const project = await projectService.getProjectById(
      projectId,
      authUser?.userId
    );

    return successResponse(project);
  }
);

/**
 * 更新案件
 * PUT /api/v1/projects/:id
 */
export const PUT = asyncHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const projectId = params.id;

    // 需要登入
    const authUser = requireAuth(request);

    // 驗證請求體
    const data = await validateBody(request, updateProjectSchema);

    // 更新案件
    const projectService = new ProjectService();
    const updatedProject = await projectService.updateProject(
      projectId,
      authUser.userId,
      data
    );

    return updatedResponse(updatedProject, "案件更新成功");
  }
);

/**
 * 刪除案件
 * DELETE /api/v1/projects/:id
 */
export const DELETE = asyncHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const projectId = params.id;

    // 需要登入
    const authUser = requireAuth(request);

    // 刪除案件
    const projectService = new ProjectService();
    await projectService.deleteProject(projectId, authUser.userId);

    return deletedResponse("案件刪除成功");
  }
);

