# 200 OK - 安裝與設定指南

## 🚀 快速開始

### 前置需求

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **PostgreSQL** >= 14.0
- **Git**

### 1. 複製專案

```bash
git clone <repository-url>
cd 200ok
```

### 2. 安裝依賴

```bash
npm install
```

### 3. 設定環境變數

複製環境變數範例檔案：

```bash
cp .env.example .env
```

編輯 `.env` 檔案，填入必要的設定：

```env
# 資料庫連線
DATABASE_URL="postgresql://username:password@localhost:5432/200ok?schema=public"

# JWT 密鑰（請使用強密碼）
JWT_SECRET="your-super-secret-jwt-key-change-this"

# Google OAuth（需要到 Google Cloud Console 建立）
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"

# 應用程式設定
NODE_ENV="development"
APP_URL="http://localhost:3000"
```

### 4. 設定資料庫

#### 4.1 建立資料庫

```bash
# 使用 psql 建立資料庫
createdb 200ok

# 或使用 SQL
psql -U postgres
CREATE DATABASE "200ok";
\q
```

#### 4.2 執行 Migration

```bash
# 1. 在 Supabase SQL Editor 執行 supabase_schema.sql
# 2. 設定 Supabase 環境變數（見 .env.example）
```

### 5. 啟動開發伺服器

```bash
npm run dev
```

開啟瀏覽器訪問：[http://localhost:3000](http://localhost:3000)

## 📊 測試帳號

執行種子資料後，可使用以下測試帳號：

| 角色 | Email | 密碼 |
|------|-------|------|
| 接案者 | freelancer@200ok.com | Password123 |
| 發案者 | client@200ok.com | Password123 |
| 管理員 | admin@200ok.com | Password123 |

## 🔧 開發工具

### Supabase Dashboard

使用 Supabase Dashboard 管理資料庫：
- 訪問：[https://supabase.com/dashboard](https://supabase.com/dashboard)
- SQL Editor：執行 SQL 查詢和管理資料表
- Table Editor：視覺化編輯資料

### 程式碼格式化

```bash
# 檢查程式碼風格
npm run lint

# 自動格式化程式碼
npm run format

# TypeScript 型別檢查
npm run type-check
```

## 🌐 Google OAuth 設定

### 1. 建立 Google Cloud 專案

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立新專案或選擇現有專案
3. 啟用「Google+ API」

### 2. 建立 OAuth 憑證

1. 前往「APIs & Services」>「Credentials」
2. 點擊「Create Credentials」>「OAuth client ID」
3. 選擇「Web application」
4. 設定授權重新導向 URI：
   - `http://localhost:3000/api/auth/callback/google`（開發環境）
   - `https://yourdomain.com/api/auth/callback/google`（生產環境）
5. 複製 Client ID 和 Client Secret 到 `.env`

## 💳 Stripe 付款設定（選用）

### 1. 註冊 Stripe 帳號

前往 [Stripe](https://stripe.com/) 註冊帳號

### 2. 取得 API 金鑰

1. 前往 Dashboard > Developers > API keys
2. 複製 Secret key 到 `.env`：

```env
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

### 3. 設定 Webhook

1. 前往 Dashboard > Developers > Webhooks
2. 新增端點：`https://yourdomain.com/api/webhooks/stripe`
3. 選擇事件：
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. 複製 Webhook Secret 到 `.env`

## 📧 Email 設定（SendGrid）

### 1. 註冊 SendGrid

前往 [SendGrid](https://sendgrid.com/) 註冊帳號

### 2. 建立 API Key

1. 前往 Settings > API Keys
2. 建立新的 API Key
3. 複製到 `.env`：

```env
SENDGRID_API_KEY="SG...."
EMAIL_FROM="noreply@200ok.com"
```

## 📱 SMS 驗證設定（Twilio）

### 1. 註冊 Twilio

前往 [Twilio](https://www.twilio.com/) 註冊帳號

### 2. 取得憑證

1. 前往 Console Dashboard
2. 複製 Account SID 和 Auth Token 到 `.env`：

```env
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_PHONE_NUMBER="+1234567890"
```

## ☁️ 雲端儲存設定

### Google Cloud Storage

1. 建立 GCS Bucket
2. 下載 Service Account Key (JSON)
3. 設定環境變數：

```env
CLOUD_STORAGE_BUCKET="your-bucket-name"
CLOUD_STORAGE_PROJECT_ID="your-project-id"
CLOUD_STORAGE_KEY_FILE="./service-account-key.json"
```

### AWS S3（替代方案）

```env
AWS_REGION="ap-northeast-1"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_S3_BUCKET="your-bucket-name"
```

## 🐛 常見問題

### 資料庫連線失敗

**問題**：`Error: connect ECONNREFUSED 127.0.0.1:5432`

**解決方法**：
1. 確認 PostgreSQL 服務已啟動
2. 檢查 `DATABASE_URL` 是否正確
3. 確認資料庫已建立

### Supabase 連線失敗

**問題**：無法連線到 Supabase

**解決方法**：

```bash
# 刪除 node_modules
rm -rf node_modules

# 重新安裝
npm install
```

### Port 已被占用

**問題**：`Error: listen EADDRINUSE: address already in use :::3000`

**解決方法**：

```bash
# 找出占用 port 的程序
lsof -ti:3000

# 終止該程序
kill -9 <PID>

# 或使用不同的 port
PORT=3001 npm run dev
```

## 📖 更多資源

- [Next.js 文件](https://nextjs.org/docs)
- [Supabase 文件](https://supabase.com/docs)
- [Tailwind CSS 文件](https://tailwindcss.com/docs)
- [NextAuth.js 文件](https://next-auth.js.org/)

## 🆘 需要幫助？

如有問題，請建立 Issue 或聯絡開發團隊。

---

**200 OK** - 讓每個專案都順利交付 ✨

