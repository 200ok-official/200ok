import { NextRequest } from "next/server";
import { UserService } from "@/services/user.service";
import { asyncHandler } from "@/middleware/error.middleware";
import { paginatedResponse, getPaginationParams } from "@/lib/response";

export const dynamic = 'force-dynamic';

/**
 * 取得使用者評價
 * GET /api/v1/users/:id/reviews
 */
export const GET = asyncHandler(
  async (
    request: NextRequest,
    { params }: { params: { id: string } }
  ) => {
    const userId = params.id;
    const { searchParams } = new URL(request.url);
    const { page, limit } = getPaginationParams(searchParams);

    // 取得評價
    const userService = new UserService();
    const result = await userService.getUserReviews(userId, page, limit);

    return paginatedResponse(result.reviews, result.pagination);
  }
);

