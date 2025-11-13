import { NextResponse } from "next/server";

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  errors?: Record<string, string[]>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface PaginatedResponse<T = any> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
}

/**
 * 成功回應
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status }
  );
}

/**
 * 建立成功回應
 */
export function createdResponse<T>(
  data: T,
  message: string = "建立成功"
): NextResponse<ApiSuccessResponse<T>> {
  return successResponse(data, message, 201);
}

/**
 * 更新成功回應
 */
export function updatedResponse<T>(
  data: T,
  message: string = "更新成功"
): NextResponse<ApiSuccessResponse<T>> {
  return successResponse(data, message, 200);
}

/**
 * 刪除成功回應
 */
export function deletedResponse(
  message: string = "刪除成功"
): NextResponse<ApiSuccessResponse<null>> {
  return successResponse(null, message, 200);
}

/**
 * 分頁回應
 */
export function paginatedResponse<T>(
  data: T[],
  pagination: PaginationMeta
): NextResponse<PaginatedResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      pagination,
    },
    { status: 200 }
  );
}

/**
 * 計算分頁資訊
 */
export function calculatePagination(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  return {
    page,
    limit,
    total,
    total_pages: Math.ceil(total / limit),
  };
}

/**
 * 取得分頁參數
 */
export function getPaginationParams(searchParams: URLSearchParams): {
  page: number;
  limit: number;
  skip: number;
} {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") || "10"))
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

