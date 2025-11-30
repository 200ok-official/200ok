import { NextRequest, NextResponse } from "next/server";
import { UserService } from "@/services/user.service";
import { asyncHandler } from "@/middleware/error.middleware";

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

    // 強制不緩存
    const response = NextResponse.json(
      {
        success: true,
        data: user,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );

    return response;
  }
);

