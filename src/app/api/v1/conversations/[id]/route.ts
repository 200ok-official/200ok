import { NextRequest } from "next/server";
import { ConversationService } from "@/services/conversation.service";
import { asyncHandler } from "@/middleware/error.middleware";
import { requireAuth } from "@/middleware/auth.middleware";
import { successResponse } from "@/lib/response";

/**
 * GET /api/v1/conversations/:id
 * 取得單一對話詳情
 */
export const GET = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const authUser = requireAuth(request);
  
  const conversationService = new ConversationService();
  const conversation = await conversationService.getConversation(params.id, authUser.userId);
  
  return successResponse(conversation);
});

