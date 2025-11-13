import { NextRequest } from "next/server";
import { asyncHandler } from "@/middleware/error.middleware";
import { successResponse } from "@/lib/response";
import { supabase } from "@/lib/supabase";

/**
 * 取得標籤列表
 * GET /api/v1/tags?category=tech&limit=10
 */
export const GET = asyncHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const limit = parseInt(searchParams.get("limit") || "10");

  let query = supabase
    .from("tags")
    .select("id, name, slug, category, description, icon, color, usage_count")
    .eq("is_active", true)
    .order("usage_count", { ascending: false });

  // 如果指定了分類，則過濾分類
  if (category) {
    query = query.eq("category", category);
  }

  // 限制返回數量
  query = query.limit(limit);

  const { data: tags, error } = await query;

  if (error) {
    throw new Error(`取得標籤失敗: ${error.message}`);
  }

  return successResponse({
    tags: tags || [],
    pagination: {
      limit,
      total: tags?.length || 0
    }
  });
});
