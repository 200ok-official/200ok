# 📝 環境變數設定範例

## `.env` 或 `.env.local` 設定

將以下內容複製到您的 `.env` 或 `.env.local` 檔案中：

```env
# ========================================
# 資料庫連線 (Supabase)
# ========================================
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# ========================================
# JWT 認證
# ========================================
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
JWT_ACCESS_TOKEN_EXPIRY=24h
JWT_REFRESH_TOKEN_EXPIRY=7d

# ========================================
# NextAuth (如果使用)
# ========================================
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_key

# ========================================
# 郵件服務 (Resend) ⭐ 重點設定
# ========================================

# 1. Resend API Key
# 從 https://resend.com/api-keys 取得
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx

# 2. 寄件者信箱
# 開發環境：使用 Resend 提供的測試信箱
EMAIL_FROM=200 OK <onboarding@resend.dev>

# 生產環境：使用您的域名（需先在 Resend 驗證域名）
# EMAIL_FROM=200 OK <noreply@200ok.com>
# EMAIL_FROM=200 OK <hello@200ok.com>
# EMAIL_FROM=200 OK <no-reply@200ok.com>

# 3. 應用程式網址
# 開發環境
NEXT_PUBLIC_APP_URL=http://localhost:3000

# 生產環境（部署時修改）
# NEXT_PUBLIC_APP_URL=https://200ok.com

# ========================================
# 其他服務（可選）
# ========================================
# Stripe (如需付費功能)
# STRIPE_SECRET_KEY=sk_test_...
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Google Analytics (可選)
# NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Sentry 錯誤追蹤 (可選)
# SENTRY_DSN=https://...
```

---

## 🎯 快速設定步驟

### 1️⃣ 取得 Resend API Key（必要）

```bash
# 1. 前往 Resend 註冊
open https://resend.com/signup

# 2. 登入後前往 API Keys
open https://resend.com/api-keys

# 3. 建立新的 API Key
名稱：200ok-dev 或 200ok-production
權限：Sending access

# 4. 複製 API Key（格式：re_xxxxxxxxxx）
# 貼到 .env 的 RESEND_API_KEY
```

### 2️⃣ 設定寄件者信箱

#### 開發環境（快速開始）
```env
EMAIL_FROM=200 OK <onboarding@resend.dev>
```
- ⚠️ 只能發送到註冊 Resend 的信箱
- ✅ 無需額外設定，立即可用

#### 生產環境（推薦）
```env
EMAIL_FROM=200 OK <noreply@200ok.com>
```
- ✅ 可發送到任何信箱
- ⚠️ 需要驗證域名（參考下方步驟）

### 3️⃣ 設定應用程式網址

```env
# 本機開發
NEXT_PUBLIC_APP_URL=http://localhost:3000

# 正式環境（部署時修改）
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

## 🌐 驗證自訂域名（生產環境）

### 為什麼要驗證域名？
- ✅ 可以發送到任何信箱（不限於測試信箱）
- ✅ 更專業的品牌形象
- ✅ 降低郵件進入垃圾郵件的機率
- ✅ 提升信箱送達率

### 驗證步驟

#### 步驟 1：在 Resend 新增域名
```bash
# 前往 Resend Domains 頁面
open https://resend.com/domains

# 點擊「Add Domain」
# 輸入您的域名：200ok.com
# 點擊「Add」
```

#### 步驟 2：取得 DNS 記錄
Resend 會提供三筆 DNS 記錄：

**1. 驗證記錄（TXT）**
```
類型：TXT
名稱：@ 或 留空
值：resend-verification=abc123xyz...
```

**2. 郵件記錄（MX）**
```
類型：MX
名稱：@ 或 留空
值：feedback-smtp.resend.com
優先級：10
```

**3. DKIM 記錄（TXT）**
```
類型：TXT
名稱：resend._domainkey
值：p=MIGfMA0GCSqGSIb3DQEBAQUAA4...
```

#### 步驟 3：在 DNS 服務商新增記錄

**Cloudflare 設定範例**：
```bash
# 1. 登入 Cloudflare
open https://dash.cloudflare.com

# 2. 選擇您的域名
# 3. 前往 DNS > Records
# 4. 點擊「Add record」
# 5. 依序新增上述三筆記錄
```

| Type | Name | Content | Proxy | TTL |
|------|------|---------|-------|-----|
| TXT | @ | resend-verification=... | ❌ DNS only | Auto |
| MX | @ | feedback-smtp.resend.com | ❌ DNS only | Auto |
| TXT | resend._domainkey | p=MIGfMA0GCS... | ❌ DNS only | Auto |

⚠️ **重要**：Proxy 必須設為「DNS only」（灰色雲朵）

**其他 DNS 服務商**：
- Google Domains
- Namecheap  
- GoDaddy
- AWS Route 53

操作方式類似，前往 DNS 管理頁面新增記錄。

#### 步驟 4：驗證域名
```bash
# 1. 等待 DNS 傳播（5-30 分鐘）
# 2. 回到 Resend Dashboard
open https://resend.com/domains

# 3. 點擊您的域名旁的「Verify」
# 4. 等待驗證完成（顯示綠色勾勾 ✅）
```

#### 步驟 5：更新環境變數
驗證成功後，更新 `.env`：
```env
EMAIL_FROM=200 OK <noreply@200ok.com>
```

#### 步驟 6：重新啟動伺服器
```bash
npm run dev
```

---

## 🧪 測試郵件發送

### 測試腳本（快速驗證）

建立測試檔案 `scripts/test-email.ts`：

```typescript
import { sendVerificationEmail } from '@/lib/email';

async function testEmail() {
  const result = await sendVerificationEmail(
    'your-email@example.com',  // 改成您的信箱
    'Test User',
    'http://localhost:3000/verify-email?token=test123'
  );
  
  console.log('Email sent:', result);
}

testEmail();
```

執行測試：
```bash
npx tsx scripts/test-email.ts
```

### 完整流程測試

1. **啟動開發伺服器**
   ```bash
   npm run dev
   ```

2. **前往註冊頁面**
   ```
   http://localhost:3000/register
   ```

3. **註冊新帳號**
   - 使用您的信箱（開發模式需使用註冊 Resend 的信箱）
   - 填寫其他資料

4. **檢查收件匣**
   - 查看收件匣（可能在垃圾郵件）
   - 點擊「驗證我的信箱」按鈕

5. **確認驗證成功**
   - 應該跳轉到驗證成功頁面
   - 可以正常登入

---

## 🔍 除錯指南

### 郵件沒有發送？

#### 檢查 1：API Key 是否正確
```bash
# 確認 .env 中的 RESEND_API_KEY
# 格式應為：re_xxxxxxxxxxxxxxxxxxxxxxxxxx

# 測試 API Key 是否有效
curl -X POST 'https://api.resend.com/emails' \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "from": "onboarding@resend.dev",
    "to": "your-email@example.com",
    "subject": "Test",
    "html": "<p>Test</p>"
  }'
```

#### 檢查 2：EMAIL_FROM 格式
```env
# ✅ 正確格式
EMAIL_FROM=200 OK <onboarding@resend.dev>
EMAIL_FROM=200 OK <noreply@200ok.com>

# ❌ 錯誤格式
EMAIL_FROM=onboarding@resend.dev  # 缺少名稱
EMAIL_FROM=<onboarding@resend.dev>  # 缺少名稱
EMAIL_FROM=200 OK onboarding@resend.dev  # 缺少尖括號
```

#### 檢查 3：查看終端機日誌
```bash
# 應該看到
[SEND_EMAIL_SUCCESS] { id: '...', ... }

# 如果看到錯誤
[SEND_EMAIL_ERROR] { message: '...' }
```

#### 檢查 4：Resend Dashboard
```bash
# 前往查看郵件發送狀態
open https://resend.com/emails
```

### 郵件進入垃圾郵件？

**解決方案**：
1. ✅ 驗證自訂域名（最重要）
2. ✅ 將寄件者加入通訊錄
3. ✅ 手動標記為「非垃圾郵件」
4. ✅ 避免頻繁發送（我們已實作 2 分鐘冷卻）

### 測試模式只能發送到註冊信箱？

這是正常的！Resend 的測試模式（`onboarding@resend.dev`）只能發送到註冊 Resend 的信箱。

**解決方案**：
- **短期**：使用註冊 Resend 的信箱測試
- **長期**：驗證您的域名（參考上方步驟）

---

## 📊 Resend 免費額度

### 免費方案包含
- ✅ 每月 3,000 封郵件
- ✅ 每天 100 封郵件
- ✅ 1 個自訂域名
- ✅ 基本分析功能
- ✅ API 存取

### 升級方案（可選）
- **Pro**: $20/月
  - 50,000 封/月
  - 3 個自訂域名
  - 進階分析

詳細定價：https://resend.com/pricing

---

## ✅ 設定完成檢查清單

### 開發環境
- [ ] 已註冊 Resend 帳號
- [ ] 已取得 API Key
- [ ] 已設定 `RESEND_API_KEY`
- [ ] 已設定 `EMAIL_FROM=200 OK <onboarding@resend.dev>`
- [ ] 已設定 `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- [ ] 已重新啟動開發伺服器
- [ ] 已測試郵件發送
- [ ] 可以收到驗證郵件

### 生產環境
- [ ] 已驗證自訂域名
- [ ] DNS 記錄已新增且通過驗證
- [ ] 已更新 `EMAIL_FROM` 為自訂域名
- [ ] 已更新 `NEXT_PUBLIC_APP_URL` 為正式域名
- [ ] 已測試可發送到任何信箱
- [ ] 郵件不進入垃圾郵件
- [ ] 已設定正式環境的 `RESEND_API_KEY`

---

## 🎉 完成！

您的郵件系統現在應該已經可以正常運作了！

**下一步**：
1. 測試註冊流程
2. 確認郵件正常收到
3. 驗證連結功能正常
4. 準備驗證自訂域名（上線前）

**需要協助？**
- 查看 `說明文件/郵件與Resend/QUICK_EMAIL_SETUP.md`
- 查看 Resend 官方文件：https://resend.com/docs
- 檢查終端機日誌
- 查看 Resend Dashboard：https://resend.com/emails

