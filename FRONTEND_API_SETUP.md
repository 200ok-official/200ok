# 前端 API 設定指南

## 📝 環境變數設定

### 1. 建立 `.env.local` 檔案

在專案根目錄建立 `.env.local` 檔案：

```bash
# ==================== API 設定 ====================
# FastAPI 後端 URL（開發環境）
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# NextAuth 設定
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_change_this

# Google OAuth（如果使用）
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 2. 生產環境設定

在部署時（Vercel/其他平台），設定環境變數：

```bash
NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.com
NEXTAUTH_URL=https://your-frontend-domain.com
NEXTAUTH_SECRET=your_production_secret
```

## 🔧 使用統一的 API Client

已建立 `src/lib/api.ts` 提供統一的 API 呼叫方式。

### 基本使用

```typescript
import { apiGet, apiPost, getApiUrl } from '@/lib/api';

// GET 請求
const projects = await apiGet('/api/v1/projects', { limit: '10' });

// POST 請求
const result = await apiPost('/api/v1/auth/login', {
  email: 'user@example.com',
  password: 'password'
});

// 取得完整 URL（用於 fetch）
const url = getApiUrl('/api/v1/projects');
```

### 可用的 API 方法

- `apiGet(path, params?)` - GET 請求
- `apiPost(path, body?)` - POST 請求
- `apiPut(path, body?)` - PUT 請求
- `apiPatch(path, body?)` - PATCH 請求
- `apiDelete(path)` - DELETE 請求
- `apiFetch(path, options)` - 原始 fetch（返回 Response）
- `apiFetchJson(path, options)` - fetch 並自動解析 JSON
- `getApiUrl(path)` - 取得完整 API URL
- `getAuthHeaders()` - 取得認證 headers
- `isAuthenticated()` - 檢查是否已登入
- `refreshAccessToken()` - 刷新 access token
- `clearAuth()` - 清除認證資訊

### 自動處理認證

API client 會自動：
- 從 localStorage 讀取 `access_token`
- 在 headers 中加入 `Authorization: Bearer {token}`
- 提供 token 刷新功能

## 🔄 遷移現有程式碼

### 舊寫法（直接 fetch）

```typescript
const response = await fetch('/api/v1/projects', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();
```

### 新寫法（使用 API client）

```typescript
import { apiGet } from '@/lib/api';

const data = await apiGet('/api/v1/projects');
```

## 📋 遷移檢查清單

需要更新的檔案（已搜尋到 17 個使用 fetch 的檔案）：

- [ ] `src/app/projects/[id]/page.tsx`
- [ ] `src/app/page.tsx`
- [ ] `src/app/verify-email/page.tsx`
- [ ] `src/app/conversations/[id]/page.tsx`
- [ ] `src/app/projects/[id]/submit-proposal/page.tsx`
- [ ] `src/app/conversations/page.tsx`
- [ ] `src/app/tokens/page.tsx`
- [ ] `src/app/users/[id]/page.tsx`
- [ ] `src/components/layout/Navbar.tsx`
- [ ] `src/app/debug-auth/page.tsx`
- [ ] `src/app/login/page.tsx`
- [ ] `src/components/projects/ProposalForm.tsx`
- [ ] `src/app/profile/page.tsx`
- [ ] `src/app/register/page.tsx`
- [ ] `src/components/projects/create/CreateProjectWizard.tsx`
- [ ] `src/app/freelancers/page.tsx`
- [ ] `src/app/projects/page.tsx`

## 🚀 快速開始

### 1. 設定環境變數

```bash
# 複製範例並編輯
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_change_this
EOF
```

### 2. 啟動後端

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. 啟動前端

```bash
npm run dev
```

### 4. 驗證設定

在瀏覽器 console 執行：

```javascript
console.log('API Base URL:', process.env.NEXT_PUBLIC_API_BASE_URL);
```

應該顯示：`API Base URL: http://localhost:8000`

## 🔍 除錯

### 檢查環境變數

```bash
# 檢查 Next.js 是否讀取到環境變數
echo "NEXT_PUBLIC_API_BASE_URL: $NEXT_PUBLIC_API_BASE_URL"
```

### 檢查 API 連線

```bash
# 測試後端是否正常運作
curl http://localhost:8000/health
```

### 常見問題

1. **環境變數沒有生效**
   - 重啟 Next.js dev server
   - 確認 `.env.local` 在專案根目錄
   - 確認變數名稱以 `NEXT_PUBLIC_` 開頭（client-side 變數）

2. **CORS 錯誤**
   - 確認後端 `CORS_ORIGINS` 包含前端 URL
   - 檢查 `backend/.env` 的 CORS 設定

3. **401 Unauthorized**
   - 檢查 token 是否正確儲存在 localStorage
   - 使用 `refreshAccessToken()` 刷新 token

## 📚 相關文件

- [Backend API 文件](./backend/README.md)
- [API Mapping](./backend/API_MAPPING.md)
- [Migration Summary](./BACKEND_MIGRATION_SUMMARY.md)

