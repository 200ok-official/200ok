import { NextRequest } from "next/server";
import { BidService } from "@/services/bid.service";
import { asyncHandler } from "@/middleware/error.middleware";
import { requireAuth } from "@/middleware/auth.middleware";
import { updatedResponse } from "@/lib/response";

/**
 * 拒絕投標（發案者）
 * POST /api/v1/bids/:id/reject
 */
export const POST = asyncHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const bidId = params.id;

    // 需要登入
    const authUser = requireAuth(request);

    // 拒絕投標
    const bidService = new BidService();
    const bid = await bidService.rejectBid(bidId, authUser.userId);

    return updatedResponse(bid, "投標已拒絕");
  }
);

