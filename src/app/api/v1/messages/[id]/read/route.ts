import { NextRequest } from "next/server";
import { MessageService } from "@/services/message.service";
import { asyncHandler } from "@/middleware/error.middleware";
import { requireAuth } from "@/middleware/auth.middleware";
import { updatedResponse } from "@/lib/response";

/**
 * 標記訊息為已讀
 * PUT /api/v1/messages/:id/read
 */
export const PUT = asyncHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const messageId = params.id;

    // 需要登入
    const authUser = requireAuth(request);

    // 標記為已讀
    const messageService = new MessageService();
    await messageService.markMessageAsRead(messageId, authUser.userId);

    return updatedResponse(null, "訊息已標記為已讀");
  }
);

