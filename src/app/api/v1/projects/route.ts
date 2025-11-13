import { NextRequest } from "next/server";
import { z } from "zod";
import { ProjectService } from "@/services/project.service";
import { asyncHandler } from "@/middleware/error.middleware";
import { requireAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validation.middleware";
import { successResponse, createdResponse } from "@/lib/response";
import { ProjectStatus } from "@/types";

const createProjectSchema = z.object({
  title: z.string().min(5, "標題至少需要 5 個字元").max(150),
  description: z.string().min(20, "描述至少需要 20 個字元"),
  project_type: z.string().optional(),
  budget_min: z.number().min(0, "預算不能為負數"),
  budget_max: z.number().min(0, "預算不能為負數"),
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
 * 取得案件列表（支援搜尋與篩選）
 * GET /api/v1/projects
 */
export const GET = asyncHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);

  // 解析查詢參數
  const status = searchParams.get("status");
  const skills = searchParams.get("skills")?.split(",").filter(Boolean);
  const tags = searchParams.get("tags")?.split(",").filter(Boolean);
  const budget_min = searchParams.get("budget_min");
  const budget_max = searchParams.get("budget_max");
  const project_type = searchParams.get("project_type");
  const keyword = searchParams.get("keyword");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const sort_by = searchParams.get("sort_by") as any;
  const sort_order = searchParams.get("sort_order") as "asc" | "desc";

  // 搜尋案件
  const projectService = new ProjectService();
  const result = await projectService.searchProjects({
    status: status as any,
    skills,
    tags,
    budget_min: budget_min ? parseFloat(budget_min) : undefined,
    budget_max: budget_max ? parseFloat(budget_max) : undefined,
    project_type: project_type || undefined,
    keyword: keyword || undefined,
    page,
    limit,
    sort_by,
    sort_order,
  });

  return successResponse(result);
});

/**
 * 建立新案件
 * POST /api/v1/projects
 */
export const POST = asyncHandler(async (request: NextRequest) => {
  // 需要登入且為發案者
  const authUser = requireAuth(request);

  // 驗證請求體
  const data = await validateBody(request, createProjectSchema);

  // 建立案件
  const projectService = new ProjectService();
  const project = await projectService.createProject(authUser.userId, data);

  return createdResponse(project, "案件建立成功");
});

