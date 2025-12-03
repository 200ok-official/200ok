import { NextRequest } from "next/server";
import { z } from "zod";
import { ConversationService } from "@/services/conversation.service";
import { asyncHandler } from "@/middleware/error.middleware";
import { requireAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validation.middleware";
import { successResponse } from "@/lib/response";

export const dynamic = 'force-dynamic';

const unlockProposalSchema = z.object({
  conversation_id: z.string().uuid("無效的對話 ID"),
});

/**
 * POST /api/v1/conversations/unlock-proposal
 * 發案者解鎖提案（付費 100 代幣）
 */
export const POST = asyncHandler(async (request: NextRequest) => {
  const authUser = requireAuth(request);
  const data = await validateBody(request, unlockProposalSchema);
  
  const conversationService = new ConversationService();
  const conversation = await conversationService.unlockProposal(
    data.conversation_id,
    authUser.userId
  );
  
  return successResponse(conversation, "已解鎖提案，扣除 100 代幣");
});

