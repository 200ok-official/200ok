import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { successResponse } from "@/lib/response";
import { logger } from "@/lib/logger";

/**
 * Health Check API
 * GET /api/v1/health
 */
export async function GET() {
  try {
    // 檢查資料庫連線
    const { error } = await supabase.from("users").select("id").limit(1);

    if (error) {
      throw error;
    }

    logger.info("Health check passed");

    return successResponse({
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "200 OK API",
      version: "1.0.0",
      database: "connected",
    });
  } catch (error) {
    logger.error("Health check failed", { error });

    return NextResponse.json(
      {
        success: false,
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        error: "資料庫連線失敗",
      },
      { status: 503 }
    );
  }
}

