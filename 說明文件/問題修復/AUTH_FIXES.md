# 認證系統問題修復記錄

## 修復 1: 角色選擇無法儲存

### 🐛 問題描述
- 使用者在個人頁面選擇身份（工程師/發案者）後儲存
- 顯示「儲存成功」訊息
- 重新整理頁面後，新選擇的角色消失了

### 🔍 根本原因
在 `UserService.updateUser` 方法中，雖然前端有正確發送 `roles` 欄位，但後端的更新邏輯**沒有處理 `roles` 欄位**，導致角色更新被忽略。

```typescript
// ❌ 修復前：沒有處理 roles
.update({
  ...(data.name && { name: data.name }),
  ...(data.bio !== undefined && { bio: data.bio }),
  ...(data.skills && { skills: data.skills }),
  // 缺少 roles 處理
})
```

### ✅ 解決方案

#### 1. 更新 `UpdateUserData` 介面
**檔案**: `/src/services/user.service.ts`

```typescript
export interface UpdateUserData {
  name?: string;
  bio?: string;
  skills?: string[];
  avatar_url?: string;
  portfolio_links?: string[];
  roles?: UserRole[];  // ✅ 新增
  phone?: string;      // ✅ 新增
}
```

#### 2. 更新 `updateUser` 方法
**檔案**: `/src/services/user.service.ts`

```typescript
.update({
  ...(data.name && { name: data.name }),
  ...(data.phone !== undefined && { phone: data.phone }),  // ✅ 新增
  ...(data.bio !== undefined && { bio: data.bio }),
  ...(data.skills && { skills: data.skills }),
  ...(data.avatar_url && { avatar_url: data.avatar_url }),
  ...(data.portfolio_links && { portfolio_links: data.portfolio_links }),
  ...(data.roles && { roles: data.roles }),  // ✅ 新增
  updated_at: new Date().toISOString(),
})
```

---

## 修復 2: 已登入仍顯示「請先登入以提交提案」

### 🐛 問題描述
- 使用者已經登入（localStorage 有 token）
- 在專案詳情頁面仍然顯示「請先登入以提交提案」按鈕
- 無法提交提案

### 🔍 根本原因
專案詳情頁面（`/projects/[id]/page.tsx`）是 Server Component，它使用 NextAuth 的 `getServerSession` 來取得 `userId`。但我們的主要認證系統是基於 localStorage 的 JWT token，而不是 NextAuth session。

**流程問題**：
```
Server Component (專案詳情頁)
  ↓
使用 getServerSession (NextAuth)
  ↓
取得 userId = undefined (因為沒有 NextAuth session)
  ↓
傳遞給 ProjectDetailClient
  ↓
userId 為空 → 顯示「請先登入」
```

### ✅ 解決方案

修改 `ProjectDetailClient` 組件，在 Client Component 中也從 localStorage 讀取使用者資訊。

**檔案**: `/src/components/projects/ProjectDetailClient.tsx`

```typescript
export default function ProjectDetailClient({ 
  projectId, 
  projectTitle, 
  isOwner, 
  userId: serverUserId  // 從 Server Component 傳來（可能為空）
}: ProjectDetailClientProps) {
  const [clientUserId, setClientUserId] = useState<string | undefined>(serverUserId);

  useEffect(() => {
    // 如果 Server Component 沒有提供 userId，嘗試從 localStorage 取得
    if (!serverUserId) {
      const token = localStorage.getItem('access_token');
      const userData = localStorage.getItem('user');
      if (token && userData) {
        try {
          const user = JSON.parse(userData);
          setClientUserId(user.id);
        } catch (e) {
          console.error('Failed to parse user data', e);
        }
      }
    }
  }, [serverUserId]);

  const userId = clientUserId;  // 優先使用 Client 端取得的 userId
  
  // ... 其餘邏輯
}
```

### 📝 為什麼這樣做？

我們的系統使用**雙重認證方案**：

1. **localStorage JWT Token** (主要)
   - 登入後儲存在 `localStorage`
   - 用於 API 請求的 `Authorization` header
   - 在 Client Component 中可用

2. **NextAuth Session** (次要)
   - 用於某些 Server Component
   - 在 Server Side 可用
   - 目前主要用於 OAuth 登入

**最佳實踐**：
- Client Component 優先使用 localStorage
- Server Component 優先使用 NextAuth session
- 兩者互相補充，確保在各種情況下都能正確取得使用者資訊

---

## 修復 3: Navbar 401 錯誤（未登入時）

### 🐛 問題描述
- 未登入時訪問首頁
- Console 顯示大量 `UnauthorizedError: 請先登入` 錯誤
- 錯誤來自 `/api/v1/tokens/balance` 和 `/api/v1/conversations`

### 🔍 根本原因
Navbar 在 `useEffect` 中無條件呼叫 API，且沒有傳遞 `Authorization` header。

### ✅ 解決方案

#### 1. 只在登入時呼叫 API
**檔案**: `/src/components/layout/Navbar.tsx`

```typescript
useEffect(() => {
  const token = localStorage.getItem("access_token");
  const userData = localStorage.getItem("user");
  
  if (token && userData) {
    setIsLoggedIn(true);
    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      // ✅ 只有在有 token 時才呼叫
      fetchTokenBalance(token);
      fetchUnreadCount(token);
    } catch (e) {
      console.error("Failed to parse user data", e);
    }
  }
}, []);
```

#### 2. 加入 Authorization Header
```typescript
const fetchTokenBalance = async (token: string) => {
  try {
    const response = await fetch('/api/v1/tokens/balance', {
      headers: {
        'Authorization': `Bearer ${token}`,  // ✅ 加入 header
      },
    });
    // ...
  } catch (error) {
    setTokenBalance(null);  // ✅ 靜默失敗
  }
};
```

#### 3. 靜默處理預期的 401 錯誤
**檔案**: `/src/middleware/error.middleware.ts`

```typescript
export function handleError(error: unknown) {
  if (error instanceof ApiError) {
    // 對於 401 和 403 等預期的錯誤，不印 stack trace
    if (error.statusCode === 401 || error.statusCode === 403) {
      // 靜默處理
    } else {
      console.error("API Error:", error);
    }
    // ...
  }
}
```

---

## 測試檢查清單

### 角色選擇
- [x] 可以在個人頁面勾選多個角色
- [x] 點擊儲存後成功更新
- [x] 重新整理頁面後角色保持不變
- [x] 至少需要保留一個角色（驗證）

### 提案功能
- [x] 已登入時顯示「提交提案」按鈕
- [x] 未登入時顯示「請先登入以提交提案」
- [x] 點擊提案按鈕可以正常提交
- [x] 專案擁有者不顯示提案按鈕

### Navbar
- [x] 未登入時不會產生 401 錯誤
- [x] 已登入時正確顯示代幣餘額
- [x] 已登入時正確顯示訊息圖示
- [x] Console 不再顯示大量錯誤訊息

---

## 相關檔案

### 修改的檔案
1. `/src/services/user.service.ts` - 角色更新邏輯
2. `/src/components/projects/ProjectDetailClient.tsx` - 提案按鈕認證
3. `/src/components/layout/Navbar.tsx` - API 呼叫優化
4. `/src/middleware/error.middleware.ts` - 錯誤處理優化
5. `/src/app/tokens/page.tsx` - 代幣頁面認證

### 相關 API 端點
- `PUT /api/v1/users/me` - 更新使用者資料
- `GET /api/v1/tokens/balance` - 取得代幣餘額
- `GET /api/v1/conversations` - 取得對話列表

---

## 未來改進建議

### 短期 (v1.1)
- [ ] 統一認證系統，選擇 JWT 或 NextAuth
- [ ] 在所有 Client Component 中統一使用 localStorage
- [ ] 在所有 Server Component 中統一使用 getServerSession
- [ ] 實作 token 自動刷新機制

### 中期 (v1.2)
- [ ] 實作 SSR 友善的認證方案
- [ ] 使用 React Context 管理全域認證狀態
- [ ] 實作 token 過期提示
- [ ] 改善錯誤訊息顯示

### 長期 (v2.0)
- [ ] 完全遷移到單一認證系統
- [ ] 實作 OAuth 2.0 完整流程
- [ ] 支援多裝置登入管理
- [ ] 實作雙因素認證 (2FA)

---

完成時間：2025-01-02
修復者：AI Assistant
狀態：✅ 已完成並測試

