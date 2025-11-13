import { NextRequest } from "next/server";
import { z } from "zod";
import { UserService } from "@/services/user.service";
import { asyncHandler, BadRequestError } from "@/middleware/error.middleware";
import { requireAuth } from "@/middleware/auth.middleware";
import { successResponse } from "@/lib/response";

/**
 * 上傳大頭照
 * POST /api/v1/users/me/avatar
 * 
 * 注意：這是簡化版本，實際上應該：
 * 1. 接收檔案上傳（multipart/form-data）
 * 2. 驗證檔案類型與大小
 * 3. 上傳到 Cloud Storage (GCS/S3)
 * 4. 回傳公開 URL
 * 
 * 目前僅接受已上傳的 URL（前端自行處理上傳）
 */
export const POST = asyncHandler(async (request: NextRequest) => {
  // 需要登入
  const authUser = requireAuth(request);

  // 取得請求體
  const body = await request.json();
  
  if (!body.avatar_url || typeof body.avatar_url !== "string") {
    throw new BadRequestError("請提供有效的頭像 URL");
  }

  // 驗證 URL 格式
  try {
    new URL(body.avatar_url);
  } catch {
    throw new BadRequestError("無效的 URL 格式");
  }

  // 更新大頭照
  const userService = new UserService();
  const result = await userService.uploadAvatar(authUser.userId, body.avatar_url);

  return successResponse(result, "大頭照更新成功");
});

/**
 * TODO: 實作實際的檔案上傳功能
 * 
 * 使用 formidable 或 multer 處理 multipart/form-data
 * 
 * 範例流程：
 * 1. 接收檔案
 * 2. 驗證檔案（類型、大小、尺寸）
 * 3. 生成唯一檔名
 * 4. 上傳到 Cloud Storage
 * 5. 取得公開 URL
 * 6. 更新資料庫
 * 7. 刪除舊圖片（如果有）
 */

