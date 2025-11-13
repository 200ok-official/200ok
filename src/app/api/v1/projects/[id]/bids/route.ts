import { NextRequest } from "next/server";
import { z } from "zod";
import { BidService } from "@/services/bid.service";
import { asyncHandler } from "@/middleware/error.middleware";
import { requireAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validation.middleware";
import { successResponse, createdResponse } from "@/lib/response";

const createBidSchema = z.object({
  proposal: z.string().min(50, "提案內容至少需要 50 個字元"),
  bid_amount: z.number().min(0, "報價不能為負數"),
});

/**
 * 取得案件的所有投標（發案者專用）
 * GET /api/v1/projects/:id/bids
 */
export const GET = asyncHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const projectId = params.id;

    // 需要登入
    const authUser = requireAuth(request);

    // 取得投標列表
    const bidService = new BidService();
    const bids = await bidService.getProjectBids(projectId, authUser.userId);

    return successResponse(bids);
  }
);

/**
 * 建立投標（接案者）
 * POST /api/v1/projects/:id/bids
 */
export const POST = asyncHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const projectId = params.id;

    // 需要登入
    const authUser = requireAuth(request);

    // 驗證請求體
    const data = await validateBody(request, createBidSchema);

    // 建立投標
    const bidService = new BidService();
    const bid = await bidService.createBid(projectId, authUser.userId, data);

    return createdResponse(bid, "投標成功");
  }
);

