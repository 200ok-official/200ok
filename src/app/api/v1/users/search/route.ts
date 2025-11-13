import { NextRequest } from "next/server";
import { UserService } from "@/services/user.service";
import { asyncHandler } from "@/middleware/error.middleware";
import { paginatedResponse, getPaginationParams } from "@/lib/response";

/**
 * 搜尋接案者
 * GET /api/v1/users/search?skills[]=React&skills[]=Node.js&minRating=4.0&page=1&limit=10
 */
export const GET = asyncHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const { page, limit } = getPaginationParams(searchParams);

  // 取得搜尋參數
  const skills = searchParams.getAll("skills[]");
  const minRating = searchParams.get("minRating")
    ? parseFloat(searchParams.get("minRating")!)
    : undefined;

  // 搜尋接案者
  const userService = new UserService();
  const result = await userService.searchFreelancers({
    skills: skills.length > 0 ? skills : undefined,
    minRating,
    page,
    limit,
  });

  return paginatedResponse(result.users, result.pagination);
});

