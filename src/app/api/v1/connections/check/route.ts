import { NextRequest } from "next/server";
import { ConnectionService } from "@/services/connection.service";
import { asyncHandler } from "@/middleware/error.middleware";
import { requireAuth } from "@/middleware/auth.middleware";
import { successResponse } from "@/lib/response";

/**
 * 檢查與目標用戶的連接狀態
 * GET /api/v1/connections/check?target_user_id=xxx&type=direct
 */
export const GET = asyncHandler(async (request: NextRequest) => {
  const authUser = requireAuth(request);
  const { searchParams } = new URL(request.url);
  
  const targetUserId = searchParams.get('target_user_id');
  const type = (searchParams.get('type') as 'direct' | 'project_proposal') || 'direct';

  if (!targetUserId) {
    return successResponse(null, "缺少目標用戶 ID");
  }

  const connectionService = new ConnectionService();
  const status = await connectionService.getConnectionStatus(
    authUser.userId,
    targetUserId,
    type
  );

  return successResponse(status);
});

