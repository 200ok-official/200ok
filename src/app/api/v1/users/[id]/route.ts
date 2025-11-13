import { NextRequest } from "next/server";
import { UserService } from "@/services/user.service";
import { asyncHandler } from "@/middleware/error.middleware";
import { successResponse } from "@/lib/response";

/**
 * 取得使用者公開資料
 * GET /api/v1/users/:id
 */
export const GET = asyncHandler(
  async (
    request: NextRequest,
    { params }: { params: { id: string } }
  ) => {
    const userId = params.id;

    // 取得使用者資料
    const userService = new UserService();
    const user = await userService.getUserById(userId);

    return successResponse(user);
  }
);

