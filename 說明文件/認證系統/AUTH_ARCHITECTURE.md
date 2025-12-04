# 🔐 認證系統架構說明

## 📋 當前認證系統

### 主要認證：**自建 JWT 認證系統** ⭐⭐⭐⭐⭐

| 項目 | 技術 |
|------|------|
| **認證方式** | JWT (JSON Web Token) |
| **套件** | `jsonwebtoken` |
| **Token 類型** | Access Token + Refresh Token |
| **儲存位置** | `localStorage` |
| **Token 格式** | `Bearer <token>` |

---

## 🔑 JWT 認證流程

### 1. 註冊/登入

```typescript
// 用戶註冊或登入
POST /api/v1/auth/register
POST /api/v1/auth/login

// 返回
{
  access_token: "eyJhbGc...",    // 15 分鐘有效
  refresh_token: "eyJhbGc...",   // 7 天有效
  user: { id, name, email, roles }
}
```

### 2. Token 儲存

```typescript
// 前端儲存到 localStorage
localStorage.setItem("access_token", token);
localStorage.setItem("refresh_token", refreshToken);
localStorage.setItem("user", JSON.stringify(user));
```

### 3. API 請求認證

```typescript
// 前端發送請求時
fetch('/api/v1/users/me', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
  }
});
```

### 4. 後端驗證

```typescript
// API 路由中使用
import { requireAuth } from "@/middleware/auth.middleware";

export const GET = asyncHandler(async (request: NextRequest) => {
  const authUser = requireAuth(request); // 驗證 JWT
  // authUser = { userId, email, roles }
});
```

---

## 📦 JWT Token 結構

### Access Token Payload

```typescript
interface JWTPayload {
  userId: string;      // 用戶 ID
  email: string;       // 用戶 Email
  roles: UserRole[];   // 角色 ['freelancer', 'client', 'admin']
  iat: number;         // 發行時間
  exp: number;         // 過期時間
}
```

### Token 配置

| Token 類型 | 有效期 | 用途 |
|-----------|--------|------|
| **Access Token** | 15 分鐘 | API 請求認證 |
| **Refresh Token** | 7 天 | 刷新 Access Token |

**環境變數**：
```env
JWT_SECRET=your-secret-key
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d
```

---

## 🛠️ 認證中間層

### 1. requireAuth - 必須登入

```typescript
// src/middleware/auth.middleware.ts
export function requireAuth(request: NextRequest): JWTPayload {
  const token = extractToken(request);
  if (!token) {
    throw new UnauthorizedError("請先登入");
  }
  return verifyToken(token);
}
```

**使用**：
```typescript
const authUser = requireAuth(request);
// 如果未登入會拋出 UnauthorizedError
```

### 2. optionalAuth - 可選登入

```typescript
export function optionalAuth(request: NextRequest): JWTPayload | null {
  const token = extractToken(request);
  if (!token) return null;
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}
```

**使用**：
```typescript
const authUser = optionalAuth(request);
// 未登入返回 null，不會拋出錯誤
```

### 3. requireRole - 角色檢查

```typescript
export function requireRole(
  request: NextRequest,
  allowedRoles: UserRole[]
): JWTPayload {
  const payload = requireAuth(request);
  const hasRole = payload.roles.some(role => allowedRoles.includes(role));
  if (!hasRole) {
    throw new ForbiddenError("您沒有權限執行此操作");
  }
  return payload;
}
```

**使用**：
```typescript
const admin = requireRole(request, ['admin']);
// 只有管理員可以通過
```

---

## 🔄 Token 刷新流程

### Refresh Token API

```typescript
// POST /api/v1/auth/refresh
{
  refresh_token: "eyJhbGc..."
}

// 返回新的 tokens
{
  access_token: "新的 access token",
  refresh_token: "新的 refresh token",
  user: { ... }
}
```

### 前端自動刷新（建議實作）

```typescript
// 當 Access Token 過期時
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refresh_token');
  const response = await fetch('/api/v1/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken })
  });
  const data = await response.json();
  localStorage.setItem('access_token', data.data.access_token);
  localStorage.setItem('refresh_token', data.data.refresh_token);
}
```

---

## 🔐 輔助認證：NextAuth（僅 Google OAuth）

### 配置位置

```typescript
// src/lib/authOptions.ts
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  // ...
};
```

### 使用情況

| 位置 | 用途 | 狀態 |
|------|------|------|
| `/api/auth/[...nextauth]` | NextAuth API 路由 | ✅ 存在 |
| `src/components/Providers.tsx` | SessionProvider | ✅ 存在 |
| 部分前端頁面 | `useSession()` | ⚠️ 混合使用 |
| **主要 API 路由** | ❌ **不使用** | 全部使用 JWT |

### Google OAuth 流程

1. 用戶點擊 Google 登入
2. NextAuth 處理 OAuth 流程
3. 在 `signIn` callback 中調用 `authService.googleAuth()`
4. 轉換為 JWT token 並返回
5. 前端儲存 JWT token 到 localStorage

**結論**：NextAuth 只是 OAuth 的入口，最終還是轉換為 JWT。

---

## 📊 認證系統對比

| 項目 | JWT 認證 | NextAuth |
|------|---------|----------|
| **主要使用** | ✅ 是 | ❌ 否（僅 OAuth） |
| **API 路由** | ✅ 全部使用 | ❌ 不使用 |
| **前端頁面** | ✅ 主要使用 | ⚠️ 部分使用 |
| **Token 儲存** | localStorage | Session（但轉為 JWT） |
| **Token 類型** | Access + Refresh | Session Cookie |

---

## 🔍 實際使用情況

### API 路由（全部使用 JWT）

```typescript
// ✅ 所有 API 都使用 JWT
import { requireAuth } from "@/middleware/auth.middleware";

export const GET = asyncHandler(async (request: NextRequest) => {
  const authUser = requireAuth(request); // JWT 驗證
  // ...
});
```

**統計**：
- ✅ 54 個 API 路由全部使用 JWT
- ❌ 沒有任何 API 使用 NextAuth

### 前端頁面（混合使用）

**使用 JWT（主要）**：
- `src/app/login/page.tsx` - 登入後儲存 JWT
- `src/components/layout/Navbar.tsx` - 檢查 JWT
- `src/app/projects/[id]/page.tsx` - 使用 JWT
- `src/app/profile/page.tsx` - 使用 JWT
- 大部分頁面都使用 `localStorage.getItem('access_token')`

**使用 NextAuth（少數）**：
- `src/app/conversations/[id]/page.tsx` - 使用 `useSession()`
- `src/app/conversations/page.tsx` - 使用 `useSession()`
- `src/app/users/[id]/page.tsx` - 使用 `useSession()`

**問題**：前端頁面混用兩種認證方式，可能造成不一致。

---

## 🎯 認證系統總結

### 主要認證：JWT ⭐⭐⭐⭐⭐

**優點**：
- ✅ 無狀態，適合 Serverless
- ✅ 簡單直接
- ✅ 完全控制
- ✅ 適合 API 優先架構

**實作**：
- ✅ Access Token (15分鐘)
- ✅ Refresh Token (7天)
- ✅ 完整的角色檢查
- ✅ 權限中間層

### 輔助認證：NextAuth（僅 OAuth）

**用途**：
- ✅ Google OAuth 登入
- ⚠️ 最終轉換為 JWT

**問題**：
- ⚠️ 前端頁面混用兩種方式
- ⚠️ 可能造成認證不一致

---

## 💡 建議

### 統一認證方式

**選項 1：完全使用 JWT（推薦）**
- ✅ 移除 NextAuth 的 `useSession()`
- ✅ 所有頁面統一使用 `localStorage.getItem('access_token')`
- ✅ 保持一致性

**選項 2：完全使用 NextAuth**
- ❌ 需要大量改動
- ❌ 不適合當前架構

**當前狀態**：主要使用 JWT，NextAuth 僅用於 Google OAuth 入口。

---

## 📝 認證流程圖

```
用戶註冊/登入
    ↓
POST /api/v1/auth/register 或 /login
    ↓
AuthService 驗證
    ↓
生成 JWT Tokens
    ├─ Access Token (15分鐘)
    └─ Refresh Token (7天)
    ↓
返回給前端
    ↓
前端儲存到 localStorage
    ↓
後續 API 請求帶上 Authorization: Bearer <token>
    ↓
requireAuth() 驗證 Token
    ↓
允許/拒絕請求
```

---

**結論**：您的認證系統主要是**自建的 JWT 認證**，NextAuth 只用於 Google OAuth 的入口，最終還是轉換為 JWT。

