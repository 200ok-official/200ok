import { NextRequest } from "next/server";
import { z } from "zod";
import { ConversationService } from "@/services/conversation.service";
import { asyncHandler } from "@/middleware/error.middleware";
import { requireAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validation.middleware";
import { successResponse, createdResponse } from "@/lib/response";

const createProposalConversationSchema = z.object({
  type: z.literal("project_proposal"),
  project_id: z.string().uuid("無效的案件 ID"),
  initial_message: z.string().min(1, "提案內容不能為空"),
  bid_data: z.object({
    amount: z.number().positive("報價金額必須大於 0"),
    estimated_days: z.number().int().positive("預估天數必須大於 0"),
    proposal: z.string().min(1, "提案內容不能為空"),
  }),
});

/**
 * GET /api/v1/conversations
 * 取得使用者的所有對話
 */
export const GET = asyncHandler(async (request: NextRequest) => {
  const authUser = requireAuth(request);
  
  const conversationService = new ConversationService();
  const conversations = await conversationService.getUserConversations(authUser.userId);
  
  return successResponse(conversations);
});

/**
 * POST /api/v1/conversations
 * 創建提案對話（付費 100 代幣）
 */
export const POST = asyncHandler(async (request: NextRequest) => {
  const authUser = requireAuth(request);
  const data = await validateBody(request, createProposalConversationSchema);
  
  const conversationService = new ConversationService();
  const conversation = await conversationService.createProposalConversation(
    authUser.userId,
    data.project_id,
    data.initial_message,
    data.bid_data
  );
  
  return createdResponse(conversation, "提案已提交，扣除 100 代幣");
});

