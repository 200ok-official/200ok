import { NextRequest } from "next/server";
import { MessageService } from "@/services/message.service";
import { asyncHandler } from "@/middleware/error.middleware";
import { requireAuth } from "@/middleware/auth.middleware";
import { successResponse } from "@/lib/response";

/**
 * 取得未讀訊息數量
 * GET /api/v1/messages/unread-count
 */
export const GET = asyncHandler(async (request: NextRequest) => {
  // 需要登入
  const authUser = requireAuth(request);

  // 取得未讀數量
  const messageService = new MessageService();
  const result = await messageService.getUnreadCount(authUser.userId);

  return successResponse(result);
});

