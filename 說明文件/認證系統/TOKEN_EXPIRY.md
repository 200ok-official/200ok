# JWT Token 過期時間設定

## 📝 當前設定

根據 `/src/middleware/auth.middleware.ts` 的程式碼：

### Access Token（存取代幣）
```typescript
const expiresIn = process.env.JWT_ACCESS_TOKEN_EXPIRY || "15m";
```

**預設值**：`15m`（15 分鐘）
- 這是短期的認證 token
- 用於 API 請求的認證
- 過期後需要使用 Refresh Token 更新

### Refresh Token（刷新代幣）
```typescript
const expiresIn = process.env.JWT_REFRESH_TOKEN_EXPIRY || "7d";
```

**預設值**：`7d`（7 天）
- 這是長期的認證 token
- 用於更新 Access Token
- 過期後需要重新登入

---

## ⚙️ 如何修改過期時間

在專案根目錄的 `.env.local` 檔案中加入（如果沒有這個檔案，請創建它）：

```bash
# JWT Token 過期時間設定
JWT_ACCESS_TOKEN_EXPIRY=1h    # Access Token 過期時間（例如：15m, 1h, 2h, 1d）
JWT_REFRESH_TOKEN_EXPIRY=30d  # Refresh Token 過期時間（例如：7d, 30d, 90d）
```

### 時間格式說明

使用 [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken#token-expiration-exp-claim) 支援的格式：

| 格式 | 說明 | 範例 |
|------|------|------|
| `s` | 秒 | `60s` = 60 秒 |
| `m` | 分鐘 | `15m` = 15 分鐘 |
| `h` | 小時 | `2h` = 2 小時 |
| `d` | 天 | `7d` = 7 天 |
| 數字 | 毫秒 | `3600000` = 1 小時 |

### 常見設定建議

#### 🔒 高安全性（推薦用於生產環境）
```bash
JWT_ACCESS_TOKEN_EXPIRY=15m   # 15 分鐘
JWT_REFRESH_TOKEN_EXPIRY=7d   # 7 天
```
- 優點：安全性高，即使 token 洩漏也很快失效
- 缺點：需要頻繁刷新

#### ⚖️ 平衡型（推薦用於一般應用）
```bash
JWT_ACCESS_TOKEN_EXPIRY=1h    # 1 小時
JWT_REFRESH_TOKEN_EXPIRY=30d  # 30 天
```
- 優點：使用體驗好，不需要太頻繁刷新
- 缺點：安全性中等

#### 🚀 開發環境（僅限開發用）
```bash
JWT_ACCESS_TOKEN_EXPIRY=24h   # 24 小時
JWT_REFRESH_TOKEN_EXPIRY=90d  # 90 天
```
- 優點：開發時不會頻繁登出
- 缺點：安全性較低，**不要用於生產環境**

---

## 🔄 Token 刷新機制

### 當前實作狀態

✅ **後端已實作** - `/api/v1/auth/refresh` 端點
- 接收 Refresh Token
- 驗證有效性和過期時間
- 返回新的 Access Token 和 Refresh Token

❌ **前端未自動刷新** - 目前需要手動處理
- Access Token 過期後會顯示 401 錯誤
- 需要使用者重新登入

### 需要改進的地方

#### 1. 實作自動 Token 刷新（推薦）

在 `/src/lib/api.ts` 或類似檔案中實作 HTTP 攔截器：

```typescript
// 範例：Axios 攔截器
axios.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await fetch('/api/v1/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });
        
        const data = await response.json();
        localStorage.setItem('access_token', data.data.access_token);
        localStorage.setItem('refresh_token', data.data.refresh_token);
        
        // 重試原請求
        originalRequest.headers['Authorization'] = `Bearer ${data.data.access_token}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // Refresh Token 也過期了，導向登入頁面
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
```

#### 2. 實作 Token 過期前刷新

在即將過期前（例如：還剩 5 分鐘）主動刷新：

```typescript
// 在 Navbar 或 App 組件中
useEffect(() => {
  const checkTokenExpiry = () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    
    try {
      const decoded = jwtDecode(token);
      const expiryTime = decoded.exp * 1000; // 轉換為毫秒
      const currentTime = Date.now();
      const timeUntilExpiry = expiryTime - currentTime;
      
      // 如果還剩不到 5 分鐘，刷新 token
      if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
        refreshAccessToken();
      }
    } catch (error) {
      console.error('Token decode error:', error);
    }
  };
  
  // 每分鐘檢查一次
  const interval = setInterval(checkTokenExpiry, 60 * 1000);
  return () => clearInterval(interval);
}, []);
```

---

## 🛠️ 立即解決當前問題

### 方案 1：延長 Access Token 時間（快速但不推薦）

在 `.env.local` 加入：

```bash
JWT_ACCESS_TOKEN_EXPIRY=24h
```

重啟開發伺服器：
```bash
npm run dev
```

**優點**：立即解決，不需要修改程式碼
**缺點**：安全性較低，token 洩漏風險增加

### 方案 2：實作自動刷新（推薦）

1. 創建 API 工具函數處理自動刷新
2. 在所有 API 呼叫處使用統一的 fetch wrapper
3. 實作 401 錯誤攔截和自動刷新邏輯

**優點**：使用體驗佳，安全性高
**缺點**：需要修改一些程式碼

### 方案 3：提示使用者刷新（當前方案）

當 token 過期時：
1. 清除 localStorage
2. 提示使用者重新登入

**優點**：實作簡單，邏輯清晰
**缺點**：使用體驗較差（15 分鐘就要重新登入）

---

## 📊 建議設定

### 🎯 推薦用於當前專案

```bash
# .env.local
JWT_ACCESS_TOKEN_EXPIRY=1h
JWT_REFRESH_TOKEN_EXPIRY=7d
JWT_SECRET=your-super-secret-key-change-this-in-production
```

加上自動刷新機制，可以讓使用者：
- ✅ 1 小時內不需要刷新（正常使用）
- ✅ 1 小時後自動刷新（無感刷新）
- ✅ 7 天內不需要重新登入（保持登入）
- ✅ 7 天後需要重新登入（安全考量）

---

## 🔐 安全性注意事項

### ⚠️ 重要提醒

1. **永遠不要**將 JWT_SECRET 提交到 Git
   - 使用 `.env.local`（已在 `.gitignore` 中）
   - 生產環境使用強密碼（至少 32 個字元）

2. **生產環境**必須使用 HTTPS
   - Token 透過網路傳輸需要加密
   - 防止中間人攻擊

3. **定期更新** Refresh Token
   - 即使在有效期內，也可以在使用時更新
   - 增加安全性（rolling refresh token）

4. **實作 Token 黑名單**（進階）
   - 登出時將 token 加入黑名單
   - 防止被盜用的 token 繼續使用

---

## 📝 待辦事項

### 短期 (v1.1)
- [ ] 延長 Access Token 到 1 小時
- [ ] 加入 Token 過期提示
- [ ] 實作基本的自動刷新機制

### 中期 (v1.2)
- [ ] 統一 API 呼叫工具（fetch wrapper）
- [ ] 實作 Token 過期前刷新
- [ ] 改善錯誤訊息顯示

### 長期 (v2.0)
- [ ] 實作 Rolling Refresh Token
- [ ] 實作 Token 黑名單
- [ ] 多裝置登入管理
- [ ] 記住我功能（延長 Refresh Token）

---

完成時間：2025-01-02
更新者：AI Assistant
狀態：✅ 文件完成

