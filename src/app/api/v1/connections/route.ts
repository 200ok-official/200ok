import { NextRequest } from "next/server";
import { ConnectionService } from "@/services/connection.service";
import { asyncHandler } from "@/middleware/error.middleware";
import { requireAuth } from "@/middleware/auth.middleware";
import { successResponse } from "@/lib/response";

export const dynamic = 'force-dynamic';

/**
 * 獲取當前用戶的所有連接
 * GET /api/v1/connections?status=connected
 */
export const GET = asyncHandler(async (request: NextRequest) => {
  const authUser = requireAuth(request);
  const { searchParams } = new URL(request.url);
  
  const status = searchParams.get('status') as 'pending' | 'connected' | 'expired' | null;

  const connectionService = new ConnectionService();
  const connections = await connectionService.getUserConnections(
    authUser.userId,
    status || undefined
  );

  return successResponse(connections);
});

