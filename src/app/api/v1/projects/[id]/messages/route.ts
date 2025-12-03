import { NextRequest } from "next/server";
import { z } from "zod";
import { MessageService } from "@/services/message.service";
import { asyncHandler } from "@/middleware/error.middleware";
import { requireAuth } from "@/middleware/auth.middleware";
import { validateBody } from "@/middleware/validation.middleware";
import { successResponse, createdResponse } from "@/lib/response";

export const dynamic = 'force-dynamic';

const sendMessageSchema = z.object({
  content: z.string().min(1, "訊息內容不能為空").max(2000, "訊息內容過長"),
  receiver_id: z.string().uuid("無效的接收者 ID"),
  attachment_urls: z.array(z.string().url("請輸入有效的連結")).optional(),
});

/**
 * 取得案件的訊息列表
 * GET /api/v1/projects/:id/messages
 */
export const GET = asyncHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const projectId = params.id;

    // 需要登入
    const authUser = requireAuth(request);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    // 取得訊息列表
    const messageService = new MessageService();
    const result = await messageService.getProjectMessages(
      projectId,
      authUser.userId,
      page,
      limit
    );

    return successResponse(result);
  }
);

/**
 * 發送訊息
 * POST /api/v1/projects/:id/messages
 */
export const POST = asyncHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const projectId = params.id;

    // 需要登入
    const authUser = requireAuth(request);

    // 驗證請求體
    const data = await validateBody(request, sendMessageSchema);

    // 發送訊息
    const messageService = new MessageService();
    const message = await messageService.sendMessage(
      projectId,
      authUser.userId,
      data
    );

    return createdResponse(message, "訊息已發送");
  }
);

