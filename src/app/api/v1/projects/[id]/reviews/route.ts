import { NextRequest } from "next/server";
import { z } from "zod";
import { ReviewService } from "@/services/review.service";
import { asyncHandler } from "@/middleware/error.middleware";
import { requireAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validation.middleware";
import { successResponse, createdResponse } from "@/lib/response";

const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5, "評分必須在 1 到 5 之間"),
  comment: z.string().max(1000, "評論內容過長").optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * 取得案件的評價（雙方互評後才顯示）
 * GET /api/v1/projects/:id/reviews
 */
export const GET = asyncHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const projectId = params.id;

    // 取得案件評價
    const reviewService = new ReviewService();
    const result = await reviewService.getProjectReviews(projectId);

    return successResponse(result);
  }
);

/**
 * 建立評價
 * POST /api/v1/projects/:id/reviews
 */
export const POST = asyncHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const projectId = params.id;

    // 需要登入
    const authUser = requireAuth(request);

    // 驗證請求體
    const data = await validateBody(request, createReviewSchema);

    // 建立評價
    const reviewService = new ReviewService();
    const review = await reviewService.createReview(
      projectId,
      authUser.userId,
      data
    );

    return createdResponse(review, "評價已提交");
  }
);

