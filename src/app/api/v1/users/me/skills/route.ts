import { NextRequest } from "next/server";
import { z } from "zod";
import { UserService } from "@/services/user.service";
import { asyncHandler } from "@/middleware/error.middleware";
import { requireAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validation.middleware";
import { successResponse } from "@/lib/response";

const updateSkillsSchema = z.object({
  skills: z.array(z.string()).max(50, "技能標籤過多"),
});

/**
 * 更新技能標籤
 * PUT /api/v1/users/me/skills
 */
export const PUT = asyncHandler(async (request: NextRequest) => {
  // 需要登入
  const authUser = requireAuth(request);

  // 驗證請求體
  const { skills } = await validateBody(request, updateSkillsSchema);

  // 更新技能標籤
  const userService = new UserService();
  const result = await userService.updateSkills(authUser.userId, skills);

  return successResponse(result, "技能標籤更新成功");
});

