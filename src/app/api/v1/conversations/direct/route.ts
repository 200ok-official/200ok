import { NextRequest } from "next/server";
import { z } from "zod";
import { ConversationService } from "@/services/conversation.service";
import { asyncHandler } from "@/middleware/error.middleware";
import { requireAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validation.middleware";
import { createdResponse } from "@/lib/response";

const createDirectConversationSchema = z.object({
  recipient_id: z.string().uuid("無效的使用者 ID"),
});

/**
 * POST /api/v1/conversations/direct
 * 創建直接聯絡對話（付費 200 代幣）
 */
export const POST = asyncHandler(async (request: NextRequest) => {
  const authUser = requireAuth(request);
  const data = await validateBody(request, createDirectConversationSchema);
  
  const conversationService = new ConversationService();
  const conversation = await conversationService.createDirectConversation(
    authUser.userId,
    data.recipient_id
  );
  
  return createdResponse(conversation, "已解鎖直接聯絡，扣除 200 代幣");
});

