import { NextRequest } from "next/server";
import { z } from "zod";
import { ProjectService } from "@/services/project.service";
import { asyncHandler } from "@/middleware/error.middleware";
import { requireAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validation.middleware";
import { successResponse, createdResponse } from "@/lib/response";
import { ProjectStatus } from "@/types";

export const dynamic = 'force-dynamic';

// 基礎共用欄位
const baseProjectSchema = z.object({
  title: z.string().min(3, "標題至少需要 3 個字元").max(150),
  description: z.string().min(10, "描述至少需要 10 個字元"),
  project_mode: z.enum(["new_development", "maintenance_modification"]).default("new_development"),
  project_type: z.string().optional(),
  budget_min: z.number().min(0, "預算不能為負數"),
  budget_max: z.number().min(0, "預算不能為負數"),
  budget_estimate_only: z.boolean().optional(),
  start_date: z.coerce.date().optional(),
  deadline: z.coerce.date().optional(),
  deadline_flexible: z.boolean().optional(),
  reference_links: z.array(z.string().url("請輸入有效的連結")).optional(),
  payment_method: z.string().optional(),
  payment_schedule: z.any().optional(),
  special_requirements: z.string().optional(),
  tag_ids: z.array(z.string()).optional(),
  status: z.enum(["draft", "open", "in_progress", "completed", "closed", "cancelled"]).optional(),
});

// 全新開發專案 schema
const newDevelopmentSchema = baseProjectSchema.extend({
  project_mode: z.literal("new_development"),
  project_type: z.string().min(1, "請選擇專案類型"),
  
  // 全新開發獨立欄位
  new_usage_scenario: z.string().optional(),
  new_goals: z.string().optional(),
  new_features: z.array(z.string()).optional(),
  new_outputs: z.array(z.string()).optional(),
  new_outputs_other: z.string().optional(),
  new_design_style: z.array(z.string()).optional(),
  new_integrations: z.array(z.string()).optional(),
  new_integrations_other: z.string().optional(),
  new_deliverables: z.array(z.string()).optional(),
  new_communication_preference: z.array(z.string()).optional(),
  new_special_requirements: z.string().optional(),
  new_concerns: z.array(z.string()).optional(),
});

// 修改維護專案 schema
const maintenanceSchema = baseProjectSchema.extend({
  project_mode: z.literal("maintenance_modification"),
  
  // 修改維護獨立欄位
  maint_system_name: z.string().min(1, "請輸入系統名稱"),
  maint_system_purpose: z.string().min(10, "請說明系統用途"),
  maint_current_users_count: z.string().optional(),
  maint_system_age: z.string().optional(),
  maint_current_problems: z.string().min(20, "請描述目前的問題"),
  maint_desired_improvements: z.string().min(20, "請描述希望的改善"),
  maint_new_features: z.string().optional(),
  maint_known_tech_stack: z.array(z.string()).optional(),
  maint_has_source_code: z.boolean().optional(),
  maint_has_documentation: z.boolean().optional(),
  maint_can_provide_access: z.boolean().optional(),
  maint_technical_contact: z.string().optional(),
  maint_expected_outcomes: z.string().min(20, "請描述預期成果"),
  maint_success_criteria: z.string().optional(),
  maint_additional_notes: z.string().optional(),
});

// 聯合驗證 schema
const createProjectSchema = z.discriminatedUnion("project_mode", [
  newDevelopmentSchema,
  maintenanceSchema,
]);

/**
 * 取得案件列表（支援搜尋與篩選）
 * GET /api/v1/projects
 */
export const GET = asyncHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);

  // 解析查詢參數
  const status = searchParams.get("status");
  const project_mode = searchParams.get("project_mode") as "new_development" | "maintenance_modification" | null;
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
    project_mode: project_mode || undefined,
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

