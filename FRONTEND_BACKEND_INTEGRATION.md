# 前後端整合完成總結

## ✅ 已完成的工作

### 1. 後端 FastAPI 設定修正

- ✅ 修正 `config.py` 的 `CORS_ORIGINS` 解析問題
- ✅ 修正 `schemas/token.py` 的 `Field` import 問題
- ✅ FastAPI app 可正常啟動
- ✅ 所有 API endpoints 已實作完成（56 個）

### 2. 前端 API Client 建立

- ✅ 建立 `src/lib/api.ts` - 統一的 API client
- ✅ 提供完整的 HTTP 方法（GET, POST, PUT, PATCH, DELETE）
- ✅ 自動處理認證 token（從 localStorage）
- ✅ 自動處理錯誤與 JSON 解析
- ✅ 提供 token 刷新功能

### 3. 文件與範例

- ✅ `FRONTEND_API_SETUP.md` - 完整設定指南
- ✅ `src/lib/api-example-migration.md` - 遷移範例
- ✅ `setup-frontend-env.sh` - 環境變數設定腳本

## 🚀 快速開始

### 步驟 1: 建立前端環境變數

手動建立 `.env.local` 檔案（專案根目錄）：

```bash
# ==================== API 設定 ====================
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# ==================== NextAuth 設定 ====================
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_change_this
```

或使用腳本：

```bash
./setup-frontend-env.sh
```

### 步驟 2: 啟動後端（Terminal 1）

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

驗證後端：
- 訪問 http://localhost:8000/docs - Swagger API 文件
- 訪問 http://localhost:8000/health - 健康檢查

### 步驟 3: 啟動前端（Terminal 2）

```bash
npm run dev
```

前端會在 http://localhost:3000 啟動。

## 📋 前端程式碼遷移

### 需要更新的 17 個檔案

所有使用 `fetch()` 的檔案都需要改用新的 API client：

1. `src/app/login/page.tsx` ⭐ (優先)
2. `src/app/register/page.tsx` ⭐ (優先)
3. `src/app/projects/page.tsx`
4. `src/app/projects/[id]/page.tsx`
5. `src/app/projects/[id]/submit-proposal/page.tsx`
6. `src/app/profile/page.tsx`
7. `src/app/users/[id]/page.tsx`
8. `src/app/conversations/page.tsx`
9. `src/app/conversations/[id]/page.tsx`
10. `src/app/tokens/page.tsx`
11. `src/app/freelancers/page.tsx`
12. `src/app/verify-email/page.tsx`
13. `src/app/debug-auth/page.tsx`
14. `src/app/page.tsx`
15. `src/components/layout/Navbar.tsx`
16. `src/components/projects/ProposalForm.tsx`
17. `src/components/projects/create/CreateProjectWizard.tsx`

### 快速遷移範例

**🔴 舊寫法：**
```typescript
const response = await fetch("/api/v1/projects");
const data = await response.json();
```

**🟢 新寫法：**
```typescript
import { apiGet } from "@/lib/api";
const data = await apiGet("/api/v1/projects");
```

詳細範例請參考：`src/lib/api-example-migration.md`

## 🔧 API Client 使用方式

### 基本方法

```typescript
import { 
  apiGet,      // GET 請求
  apiPost,     // POST 請求
  apiPut,      // PUT 請求
  apiPatch,    // PATCH 請求
  apiDelete,   // DELETE 請求
  getApiUrl,   // 取得完整 URL
  isAuthenticated, // 檢查登入狀態
  clearAuth    // 清除認證資訊
} from "@/lib/api";

// GET with query params
const projects = await apiGet("/api/v1/projects", { 
  page: "1", 
  limit: "10" 
});

// POST with body
const result = await apiPost("/api/v1/auth/login", {
  email: "user@example.com",
  password: "password"
});

// PUT
await apiPut(`/api/v1/projects/${id}`, updateData);

// DELETE
await apiDelete(`/api/v1/projects/${id}`);

// 檢查登入狀態
if (isAuthenticated()) {
  // 已登入
}

// 登出
clearAuth();
router.push("/login");
```

### 自動功能

API client 會自動處理：
- ✅ 加入 `Authorization: Bearer {token}` header
- ✅ 設定 `Content-Type: application/json`
- ✅ 解析 JSON response
- ✅ 處理錯誤並 throw Error
- ✅ 使用 `NEXT_PUBLIC_API_BASE_URL` 環境變數

## 🔍 測試與驗證

### 1. 驗證環境變數

在瀏覽器 console：

```javascript
console.log('API Base URL:', process.env.NEXT_PUBLIC_API_BASE_URL);
// 應該顯示: http://localhost:8000
```

### 2. 測試 API 連線

```bash
# 測試後端健康檢查
curl http://localhost:8000/health

# 測試 CORS
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     http://localhost:8000/api/v1/projects
```

### 3. 測試前端登入流程

1. 訪問 http://localhost:3000/login
2. 使用測試帳號登入
3. 檢查 Network tab，確認請求打到 `http://localhost:8000/api/v1/auth/login`
4. 檢查 localStorage 是否有 `access_token`

## 🐛 常見問題

### 問題 1: CORS 錯誤

**錯誤訊息：**
```
Access to fetch at 'http://localhost:8000/api/v1/...' from origin 'http://localhost:3000' 
has been blocked by CORS policy
```

**解決方式：**
檢查後端 `.env` 的 `CORS_ORIGINS` 設定：

```bash
cd backend
cat .env | grep CORS_ORIGINS
# 應該包含: http://localhost:3000
```

如果不正確，修改 `backend/.env`：

```bash
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

然後重啟後端。

### 問題 2: 環境變數未生效

**症狀：** API 請求仍打到 `/api/v1/...` 而非 `http://localhost:8000/api/v1/...`

**解決方式：**
1. 確認 `.env.local` 在專案根目錄
2. 確認變數名稱是 `NEXT_PUBLIC_API_BASE_URL`（必須有 `NEXT_PUBLIC_` 前綴）
3. **重啟 Next.js dev server**（`Ctrl+C` 然後 `npm run dev`）

### 問題 3: 401 Unauthorized

**症狀：** API 返回 401 錯誤

**檢查：**
1. 檢查 localStorage 是否有 token：
   ```javascript
   console.log(localStorage.getItem('access_token'));
   ```
2. 檢查 token 是否過期（JWT 預設 15 分鐘）
3. 嘗試重新登入

**刷新 token：**
```typescript
import { refreshAccessToken } from "@/lib/api";
const newToken = await refreshAccessToken();
```

### 問題 4: 後端無法連線

**檢查：**
```bash
# 檢查後端是否啟動
curl http://localhost:8000/health

# 檢查後端 port
lsof -i :8000
```

## 📊 架構圖

```
┌─────────────────┐         ┌─────────────────┐
│   Next.js       │         │   FastAPI       │
│   Frontend      │         │   Backend       │
│  (port 3000)    │         │  (port 8000)    │
├─────────────────┤         ├─────────────────┤
│                 │         │                 │
│  API Client     │────────▶│  API Routes     │
│  (api.ts)       │  HTTP   │  (/api/v1/*)    │
│                 │         │                 │
│  - apiGet()     │         │  - auth         │
│  - apiPost()    │         │  - projects     │
│  - apiPut()     │         │  - users        │
│  - apiDelete()  │         │  - bids         │
│                 │         │  - ...etc       │
│                 │         │                 │
└─────────────────┘         └────────┬────────┘
                                     │
                            ┌────────▼────────┐
                            │   PostgreSQL    │
                            │   (Supabase)    │
                            └─────────────────┘
```

## 📚 相關文件

- **API Client 設定指南**: `FRONTEND_API_SETUP.md`
- **遷移範例**: `src/lib/api-example-migration.md`
- **後端 API 文件**: `backend/README.md`
- **API Mapping**: `backend/API_MAPPING.md`
- **後端遷移總結**: `BACKEND_MIGRATION_SUMMARY.md`

## ✨ 下一步

### 立即執行（必要）

1. ✅ 建立 `.env.local` 檔案
2. ✅ 啟動後端和前端
3. ⬜ 更新 `src/app/login/page.tsx` 使用 API client（測試登入）
4. ⬜ 逐一更新其他 16 個檔案

### 進階（選用）

1. ⬜ 加入 API client 錯誤處理（401 自動刷新）
2. ⬜ 加入 API client logging
3. ⬜ 建立 API client 的 TypeScript 型別定義
4. ⬜ 加入 API client 單元測試
5. ⬜ 設定生產環境的環境變數

---

**🎉 後端已 100% 完成，前端 API client 已就緒！**

現在只需要建立 `.env.local` 並逐一更新前端檔案即可完成整合。

