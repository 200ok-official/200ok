import { NextRequest } from "next/server";
import { TokenService } from "@/services/token.service";
import { asyncHandler } from "@/middleware/error.middleware";
import { requireAuth } from "@/middleware/auth.middleware";
import { successResponse } from "@/lib/response";

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/tokens/balance
 * 取得使用者代幣餘額
 */
export const GET = asyncHandler(async (request: NextRequest) => {
  const authUser = requireAuth(request);
  
  const tokenService = new TokenService();
  const balance = await tokenService.getBalance(authUser.userId);
  
  return successResponse(balance);
});

