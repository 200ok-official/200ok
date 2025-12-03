import { NextRequest } from "next/server";
import { ReviewService } from "@/services/review.service";
import { asyncHandler } from "@/middleware/error.middleware";
import { requireAuth } from "@/middleware/auth.middleware";
import { successResponse } from "@/lib/response";

export const dynamic = 'force-dynamic';

/**
 * 檢查是否可以評價
 * GET /api/v1/projects/:id/can-review
 */
export const GET = asyncHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const projectId = params.id;

    // 需要登入
    const authUser = requireAuth(request);

    // 檢查是否可以評價
    const reviewService = new ReviewService();
    const result = await reviewService.canReview(projectId, authUser.userId);

    return successResponse(result);
  }
);

