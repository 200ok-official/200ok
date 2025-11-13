import { NextRequest } from "next/server";
import { ReviewService } from "@/services/review.service";
import { asyncHandler } from "@/middleware/error.middleware";
import { successResponse } from "@/lib/response";

/**
 * 取得使用者的評價統計
 * GET /api/v1/users/:id/reviews/stats
 */
export const GET = asyncHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const userId = params.id;

    // 取得評價統計
    const reviewService = new ReviewService();
    const stats = await reviewService.getReviewStats(userId);

    return successResponse(stats);
  }
);

