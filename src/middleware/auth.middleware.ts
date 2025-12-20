import { NextRequest, NextResponse } from "next/server";
import jwt, { SignOptions } from "jsonwebtoken";
import { UnauthorizedError, ForbiddenError } from "./error.middleware";
import { UserRole } from "@/types";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";

export interface JWTPayload {
  userId: string;
  email: string;
  roles: UserRole[];
  iat?: number;
  exp?: number;
}

/**
 * 從請求中提取 JWT Token
 */
export function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");

  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * 驗證 JWT Token
 */
export function verifyToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError("Token 已過期");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError("無效的 Token");
    }
    throw new UnauthorizedError("認證失敗");
  }
}

/**
 * 生成 JWT Token
 */
export function generateAccessToken(payload: {
  userId: string;
  email: string;
  roles: UserRole[];
}): string {
  // 設定為 365 天，幾乎等於永久登入
  const expiresIn = process.env.JWT_ACCESS_TOKEN_EXPIRY || "1d";

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn,
    issuer: "200ok",
  } as SignOptions);
}

/**
 * 生成 Refresh Token
 */
export function generateRefreshToken(payload: {
  userId: string;
  email: string;
}): string {
  // 設定為 365 天，幾乎等於永久登入
  const expiresIn = process.env.JWT_REFRESH_TOKEN_EXPIRY || "1d";

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn,
    issuer: "200ok",
  } as SignOptions);
}

/**
 * 認證中介層 - 驗證使用者是否已登入
 */
export function requireAuth(request: NextRequest): JWTPayload {
  const token = extractToken(request);

  if (!token) {
    throw new UnauthorizedError("請先登入");
  }

  const payload = verifyToken(token);
  return payload;
}

/**
 * 可選認證中介層 - 驗證使用者是否已登入（可選）
 * 如果有 token 就驗證，沒有就返回 null
 */
export function optionalAuth(request: NextRequest): JWTPayload | null {
  const token = extractToken(request);

  if (!token) {
    return null;
  }

  try {
    const payload = verifyToken(token);
    return payload;
  } catch {
    return null;
  }
}

/**
 * 角色檢查中介層 - 驗證使用者是否有指定角色
 */
export function requireRole(
  request: NextRequest,
  allowedRoles: UserRole[]
): JWTPayload {
  const payload = requireAuth(request);

  const hasRole = payload.roles.some((role) => allowedRoles.includes(role));

  if (!hasRole) {
    throw new ForbiddenError("您沒有權限執行此操作");
  }

  return payload;
}

/**
 * 檢查使用者是否為案件擁有者或管理員
 */
export function canAccessProject(
  payload: JWTPayload,
  projectClientId: string
): boolean {
  // 管理員可以存取所有案件
  if (payload.roles.includes("admin")) {
    return true;
  }

  // 案件擁有者可以存取
  if (payload.userId === projectClientId) {
    return true;
  }

  return false;
}

/**
 * 檢查使用者是否為資源擁有者
 */
export function isOwner(payload: JWTPayload, resourceOwnerId: string): boolean {
  return payload.userId === resourceOwnerId;
}

/**
 * 檢查使用者是否為管理員
 */
export function isAdmin(payload: JWTPayload): boolean {
  return payload.roles.includes("admin");
}

