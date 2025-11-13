import { NextRequest } from "next/server";
import { UserService } from "@/services/user.service";
import { asyncHandler } from "@/middleware/error.middleware";
import { successResponse } from "@/lib/response";

/**
 * 取得使用者統計資訊
 * GET /api/v1/users/:id/stats
 */
export const GET = asyncHandler(
  async (
    request: NextRequest,
    { params }: { params: { id: string } }
  ) => {
    const userId = params.id;

    // 取得統計資訊
    const userService = new UserService();
    const stats = await userService.getUserStats(userId);

    return successResponse(stats);
  }
);

