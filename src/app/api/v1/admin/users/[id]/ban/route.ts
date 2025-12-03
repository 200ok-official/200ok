import { NextRequest } from "next/server";
import { AdminService } from "@/services/admin.service";
import { asyncHandler } from "@/middleware/error.middleware";
import { requireAuth } from "@/middleware/auth.middleware";
import { successResponse } from "@/lib/response";

export const dynamic = 'force-dynamic';

/**
 * 停權使用者（管理員專用）
 * POST /api/v1/admin/users/:id/ban
 */
export const POST = asyncHandler(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const userId = params.id;

    // 需要登入
    const authUser = requireAuth(request);

    // 停權使用者
    const adminService = new AdminService();
    const result = await adminService.banUser(authUser.roles, userId);

    return successResponse(result);
  }
);

