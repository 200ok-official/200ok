import { NextRequest } from "next/server";
import { MessageService } from "@/services/message.service";
import { asyncHandler } from "@/middleware/error.middleware";
import { requireAuth } from "@/middleware/auth.middleware";
import { successResponse } from "@/lib/response";

/**
 * 取得所有對話列表
 * GET /api/v1/messages/conversations
 */
export const GET = asyncHandler(async (request: NextRequest) => {
  // 需要登入
  const authUser = requireAuth(request);

  // 取得對話列表
  const messageService = new MessageService();
  const conversations = await messageService.getConversations(authUser.userId);

  return successResponse(conversations);
});

