import { NextRequest } from "next/server";
import { BidService } from "@/services/bid.service";
import { asyncHandler } from "@/middleware/error.middleware";
import { requireAuth } from "@/middleware/auth.middleware";
import { updatedResponse } from "@/lib/response";

export const dynamic = 'force-dynamic';

/**
 * 接受投標（發案者）
 * POST /api/v1/bids/:id/accept
 */
export const POST = asyncHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const bidId = params.id;

    // 需要登入
    const authUser = requireAuth(request);

    // 接受投標
    const bidService = new BidService();
    const bid = await bidService.acceptBid(bidId, authUser.userId);

    return updatedResponse(bid, "投標已接受，案件進入進行中狀態");
  }
);

