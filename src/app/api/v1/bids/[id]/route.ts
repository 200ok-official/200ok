import { NextRequest } from "next/server";
import { z } from "zod";
import { BidService } from "@/services/bid.service";
import { asyncHandler } from "@/middleware/error.middleware";
import { requireAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validation.middleware";
import {
  successResponse,
  updatedResponse,
  deletedResponse,
} from "@/lib/response";

const updateBidSchema = z.object({
  proposal: z.string().min(50, "提案內容至少需要 50 個字元").optional(),
  bid_amount: z.number().min(0, "報價不能為負數").optional(),
});

/**
 * 取得投標詳情
 * GET /api/v1/bids/:id
 */
export const GET = asyncHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const bidId = params.id;

    // 需要登入
    const authUser = requireAuth(request);

    // 取得投標詳情
    const bidService = new BidService();
    const bid = await bidService.getBidById(bidId, authUser.userId);

    return successResponse(bid);
  }
);

/**
 * 更新投標（接案者）
 * PUT /api/v1/bids/:id
 */
export const PUT = asyncHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const bidId = params.id;

    // 需要登入
    const authUser = requireAuth(request);

    // 驗證請求體
    const data = await validateBody(request, updateBidSchema);

    // 更新投標
    const bidService = new BidService();
    const updatedBid = await bidService.updateBid(
      bidId,
      authUser.userId,
      data
    );

    return updatedResponse(updatedBid, "投標更新成功");
  }
);

/**
 * 撤回投標（接案者）
 * DELETE /api/v1/bids/:id
 */
export const DELETE = asyncHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const bidId = params.id;

    // 需要登入
    const authUser = requireAuth(request);

    // 撤回投標
    const bidService = new BidService();
    await bidService.withdrawBid(bidId, authUser.userId);

    return deletedResponse("投標已撤回");
  }
);

