import { NextRequest } from "next/server";
import { ApiError } from "./error.middleware";

interface RateLimitStore {
  count: number;
  resetTime: number;
}

// 簡易的記憶體 Rate Limiter（生產環境應使用 Redis）
const store = new Map<string, RateLimitStore>();

export interface RateLimitOptions {
  windowMs?: number; // 時間窗口（毫秒）
  maxRequests?: number; // 最大請求數
}

/**
 * Rate Limiting 中介層
 */
export function rateLimit(options: RateLimitOptions = {}) {
  const windowMs =
    options.windowMs ||
    parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"); // 預設 15 分鐘
  const maxRequests =
    options.maxRequests ||
    parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"); // 預設 100 次

  return (request: NextRequest) => {
    // 取得客戶端 IP
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const key = `ratelimit:${ip}`;
    const now = Date.now();

    let record = store.get(key);

    // 如果沒有記錄或已過期，建立新記錄
    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      store.set(key, record);
      return;
    }

    // 增加計數
    record.count++;

    // 檢查是否超過限制
    if (record.count > maxRequests) {
      const resetIn = Math.ceil((record.resetTime - now) / 1000);
      throw new ApiError(
        `請求過於頻繁，請在 ${resetIn} 秒後再試`,
        429
      );
    }
  };
}

/**
 * 清理過期的記錄（定期執行）
 */
export function cleanupExpiredRecords() {
  const now = Date.now();
  for (const [key, record] of store.entries()) {
    if (now > record.resetTime) {
      store.delete(key);
    }
  }
}

// 每 10 分鐘清理一次
if (process.env.NODE_ENV === "production") {
  setInterval(cleanupExpiredRecords, 10 * 60 * 1000);
}

/**
 * 嚴格的 Rate Limiter（用於敏感操作，如登入、註冊）
 */
export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分鐘
  maxRequests: 5, // 5 次
});

/**
 * 一般的 Rate Limiter（用於一般 API）
 */
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分鐘
  maxRequests: 100, // 100 次
});

