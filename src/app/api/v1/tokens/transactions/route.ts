import { NextRequest } from "next/server";
import { TokenService } from "@/services/token.service";
import { asyncHandler } from "@/middleware/error.middleware";
import { requireAuth } from "@/middleware/auth.middleware";
import { successResponse } from "@/lib/response";
import { getPaginationParams } from "@/lib/response";

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/tokens/transactions
 * 取得使用者代幣交易記錄
 */
export const GET = asyncHandler(async (request: NextRequest) => {
  const authUser = requireAuth(request);
  const { searchParams } = new URL(request.url);
  const { limit, skip } = getPaginationParams(searchParams);
  
  const tokenService = new TokenService();
  const transactions = await tokenService.getTransactions(authUser.userId, limit, skip);
  
  return successResponse(transactions);
});

