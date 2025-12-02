# 更新 Token 過期時間為 24 小時

## 📝 問題描述

使用者在提交提案時可能需要較長時間撰寫內容，目前 Access Token 預設 15 分鐘就會過期，導致提交時出現 401 錯誤。

## ✅ 解決方案

將 Access Token 過期時間延長為 24 小時。

---

## 🛠️ 設置步驟

### 1. 創建或編輯 `.env.local` 檔案

在專案根目錄（`/Users/guanyuchen/200ok/`）創建或編輯 `.env.local` 檔案：

```bash
# JWT Token 過期時間設定
JWT_ACCESS_TOKEN_EXPIRY=24h    # Access Token 24 小時過期
JWT_REFRESH_TOKEN_EXPIRY=30d   # Refresh Token 30 天過期

# JWT 密鑰（請自行更換為強密碼）
JWT_SECRET=your-super-secret-key-please-change-this-to-a-random-string-at-least-32-characters

# Supabase 設定（如果還沒有）
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Resend Email 設定（如果還沒有）
RESEND_API_KEY=your-resend-api-key
NEXT_PUBLIC_APP_URL=http://localhost:3000

# NextAuth 設定（如果使用）
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key
```

### 2. 重啟開發伺服器

```bash
# 停止當前的開發伺服器（Ctrl+C）
# 然後重新啟動
npm run dev
```

### 3. 清除舊的 Token

使用者需要重新登入以獲得新的 24 小時 token：

**方法 1：清除瀏覽器 localStorage**
```javascript
// 在瀏覽器 Console 執行
localStorage.clear();
location.reload();
```

**方法 2：登出後重新登入**
- 點擊網站上的「登出」按鈕
- 重新登入

---

## 📊 設定說明

### Access Token: 24 小時

**優點**：
- ✅ 使用者可以長時間撰寫提案，不會被登出
- ✅ 減少因 token 過期導致的提交失敗
- ✅ 提升使用體驗

**缺點**：
- ⚠️ Token 洩漏的風險時間較長
- ⚠️ 建議僅在開發或內部測試環境使用
- ⚠️ 生產環境建議使用自動刷新機制

### Refresh Token: 30 天

- 30 天內不需要重新登入
- 即使 Access Token 過期，也可以用 Refresh Token 更新
- 提供更好的使用體驗

---

## 🔐 安全性建議

### ⚠️ 重要提醒

1. **JWT_SECRET 必須保密**
   - 不要提交到 Git（`.env.local` 已在 `.gitignore` 中）
   - 使用強密碼（至少 32 個隨機字元）
   - 生產環境使用環境變數設定

2. **生產環境建議**
   ```bash
   # 生產環境建議使用較短的時間 + 自動刷新
   JWT_ACCESS_TOKEN_EXPIRY=1h
   JWT_REFRESH_TOKEN_EXPIRY=7d
   ```

3. **使用 HTTPS**
   - Token 透過網路傳輸需要加密
   - 開發環境可以用 HTTP
   - 生產環境務必使用 HTTPS

---

## 🎯 快速設定（複製貼上）

創建 `/Users/guanyuchen/200ok/.env.local` 檔案，並貼上以下內容：

```bash
# JWT Token 過期時間 - 開發環境設定
JWT_ACCESS_TOKEN_EXPIRY=24h
JWT_REFRESH_TOKEN_EXPIRY=30d
JWT_SECRET=change-this-to-a-random-string-at-least-32-characters-long

# Supabase（請替換為你的實際值）
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Resend Email（請替換為你的實際值）
RESEND_API_KEY=your-resend-api-key

# 應用程式 URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# NextAuth（如果使用）
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
```

**然後重啟開發伺服器：**
```bash
npm run dev
```

---

## ✅ 驗證設定是否生效

### 1. 登入後檢查 Token

在瀏覽器 Console 執行：

```javascript
const token = localStorage.getItem('access_token');
if (token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const payload = JSON.parse(window.atob(base64));
  
  const now = Math.floor(Date.now() / 1000);
  const exp = payload.exp;
  const expiresIn = exp - now;
  const hoursLeft = Math.floor(expiresIn / 3600);
  
  console.log('Token 過期時間:', new Date(exp * 1000).toLocaleString());
  console.log('剩餘時間:', `${hoursLeft} 小時`);
} else {
  console.log('未找到 Token，請先登入');
}
```

### 2. 測試長時間操作

1. 登入系統
2. 開始撰寫提案（可以慢慢寫）
3. 1-2 小時後提交
4. 確認提交成功，沒有 401 錯誤

---

## 📝 未來改進建議

### 實作自動刷新機制（推薦）

即使 Access Token 設為 24 小時，仍建議實作自動刷新：

1. **監控 Token 過期時間**
   - 在 Token 即將過期前（例如剩餘 5 分鐘）
   - 自動使用 Refresh Token 更新 Access Token

2. **攔截 401 錯誤**
   - 當 API 返回 401 時
   - 自動嘗試刷新 Token
   - 重試原本的請求

3. **統一 API 呼叫工具**
   - 創建一個 `fetchWithAuth()` 工具函數
   - 自動處理 Token 刷新邏輯
   - 所有 API 呼叫都使用這個工具

---

## 🆘 常見問題

### Q: 更改後還是出現 401 錯誤？

**A: 請確認以下事項：**
1. 已創建 `.env.local` 檔案
2. 已重啟開發伺服器
3. 已清除舊的 Token（重新登入）
4. 檢查 `.env.local` 檔案語法正確

### Q: 如何檢查環境變數是否生效？

**A: 在 API 路由中加入 console.log：**
```typescript
console.log('JWT_ACCESS_TOKEN_EXPIRY:', process.env.JWT_ACCESS_TOKEN_EXPIRY);
```

### Q: 生產環境應該用多長時間？

**A: 建議配置：**
- **高安全性**：15m Access + 7d Refresh
- **平衡型**：1h Access + 30d Refresh
- **低安全性**：24h Access + 90d Refresh（不推薦）

---

完成時間：2025-01-02
更新者：AI Assistant
狀態：✅ 文件完成，等待使用者設定

