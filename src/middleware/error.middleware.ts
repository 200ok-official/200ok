import { NextResponse } from "next/server";

export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends ApiError {
  constructor(message: string = "Bad Request") {
    super(message, 400);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = "Unauthorized") {
    super(message, 401);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = "Forbidden") {
    super(message, 403);
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = "Resource not found") {
    super(message, 404);
  }
}

export class ConflictError extends ApiError {
  constructor(message: string = "Conflict") {
    super(message, 409);
  }
}

export class ValidationError extends ApiError {
  errors: Record<string, string[]>;

  constructor(errors: Record<string, string[]>) {
    super("Validation failed", 422);
    this.errors = errors;
  }
}

/**
 * 統一錯誤處理函式
 */
export function handleError(error: unknown) {
  // API Error
  if (error instanceof ApiError) {
    // 對於 401 和 403 等預期的錯誤，只記錄簡單訊息，不印 stack trace
    if (error.statusCode === 401 || error.statusCode === 403) {
      // 靜默處理，不印到 console
    } else {
      console.error("API Error:", error);
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        ...(error instanceof ValidationError && { errors: error.errors }),
      },
      { status: error.statusCode }
    );
  }
  
  // 其他錯誤才印出完整資訊
  console.error("API Error:", error);

  // Database Errors (Supabase)
  if (error && typeof error === "object" && "code" in error) {
    const dbError = error as { code?: string; message?: string };
    // Handle common database errors
    if (dbError.code === "23505") {
      // Unique constraint violation
      return NextResponse.json(
        {
          success: false,
          error: "此資料已存在",
        },
        { status: 409 }
      );
    }
    if (dbError.code === "23503") {
      // Foreign key constraint violation
      return NextResponse.json(
        { success: false, error: "關聯資料不存在" },
        { status: 400 }
      );
    }
  }

  // Zod Validation Error
  if (error && typeof error === "object" && "issues" in error) {
    const zodError = error as { issues: Array<{ path: string[]; message: string }> };
    const validationErrors: Record<string, string[]> = {};
    
    zodError.issues.forEach((issue) => {
      const path = issue.path.join(".");
      if (!validationErrors[path]) {
        validationErrors[path] = [];
      }
      validationErrors[path].push(issue.message);
    });

    return NextResponse.json(
      {
        success: false,
        error: "資料驗證失敗",
        errors: validationErrors,
      },
      { status: 422 }
    );
  }

  // Default Error
  return NextResponse.json(
    {
      success: false,
      error: "伺服器發生錯誤，請稍後再試",
    },
    { status: 500 }
  );
}

/**
 * Async Handler - 包裝非同步路由處理器
 */
export function asyncHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R | NextResponse> => {
    try {
      return await fn(...args);
    } catch (error) {
      return handleError(error);
    }
  };
}

