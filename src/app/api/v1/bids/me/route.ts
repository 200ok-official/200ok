import { NextRequest } from "next/server";
import { BidService } from "@/services/bid.service";
import { asyncHandler } from "@/middleware/error.middleware";
import { requireAuth } from "@/middleware/auth.middleware";
import { successResponse } from "@/lib/response";
import { BidStatus } from "@/types";

export const dynamic = 'force-dynamic';

/**
 * 取得我的投標（接案者）
 * GET /api/v1/bids/me
 */
export const GET = asyncHandler(async (request: NextRequest) => {
  // 需要登入
  const authUser = requireAuth(request);

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as BidStatus | null;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  // 取得我的投標
  const bidService = new BidService();
  const result = await bidService.getMyBids(
    authUser.userId,
    status || undefined,
    page,
    limit
  );

  return successResponse(result);
});

