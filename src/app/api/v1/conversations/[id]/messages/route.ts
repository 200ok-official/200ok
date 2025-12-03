import { NextRequest } from "next/server";
import { z } from "zod";
import { ConversationService } from "@/services/conversation.service";
import { asyncHandler } from "@/middleware/error.middleware";
import { requireAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validation.middleware";
import { successResponse, createdResponse, getPaginationParams } from "@/lib/response";

export const dynamic = 'force-dynamic';

const sendMessageSchema = z.object({
  content: z.string().min(1, "訊息內容不能為空").max(5000, "訊息內容過長"),
});

/**
 * GET /api/v1/conversations/:id/messages
 * 取得對話的訊息列表
 */
export const GET = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const authUser = requireAuth(request);
  const { searchParams } = new URL(request.url);
  const { limit, skip } = getPaginationParams(searchParams);
  
  const conversationService = new ConversationService();
  const messages = await conversationService.getMessages(params.id, authUser.userId, limit, skip);
  
  return successResponse(messages);
});

/**
 * POST /api/v1/conversations/:id/messages
 * 發送訊息
 */
export const POST = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const authUser = requireAuth(request);
  const data = await validateBody(request, sendMessageSchema);
  
  const conversationService = new ConversationService();
  const message = await conversationService.sendMessage(
    params.id,
    authUser.userId,
    data.content
  );
  
  return createdResponse(message, "訊息已發送");
});

