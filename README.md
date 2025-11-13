# 200 OK - 軟體接案平台

> 一個現代化的軟體接案媒合平台，連結發案者與接案工程師

## 🚀 功能特色

- **智慧媒合**：AI 驅動的案件推薦系統
- **引導式發案**：簡化的案件建立流程
- **即時通訊**：內建即時訊息系統
- **安全支付**：託管式付款機制
- **評價系統**：透明的雙向評價機制
- **標籤系統**：精準的技能與專案分類

## 🛠️ 技術棧

### 前端
- **框架**: Next.js 14 (App Router)
- **樣式**: Tailwind CSS
- **語言**: TypeScript
- **狀態管理**: React Hooks

### 後端
- **框架**: Next.js API Routes
- **資料庫**: Supabase (PostgreSQL)
- **資料庫客戶端**: Supabase Client SDK
- **認證**: NextAuth.js + JWT
- **即時通訊**: Socket.io

### 雲端服務
- **部署**: Vercel / GCP Cloud Run
- **資料庫**: Cloud SQL (PostgreSQL)
- **儲存**: Google Cloud Storage / AWS S3
- **Email**: SendGrid
- **SMS**: Twilio

## 📦 安裝與執行

### 1. 安裝依賴

```bash
npm install
```

### 2. 設定環境變數

複製 `.env.example` 為 `.env` 並填入相關設定：

```bash
cp .env.example .env
```

### 3. 設定資料庫

1. 在 Supabase SQL Editor 執行 `supabase_schema.sql` 建立資料表
2. 設定 Supabase 環境變數（見 `.env.example`）

### 4. 啟動開發伺服器

```bash
npm run dev
```

開啟瀏覽器訪問 [http://localhost:3000](http://localhost:3000)

## 📂 專案結構

```
200ok/
├── supabase_schema.sql    # Supabase 資料庫 Schema SQL
├── public/                # 靜態資源
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/          # API Routes
│   │   ├── (auth)/       # 認證相關頁面
│   │   ├── (dashboard)/  # 儀表板頁面
│   │   └── layout.tsx    # 根 Layout
│   ├── components/       # React 元件
│   │   ├── ui/          # 基礎 UI 元件
│   │   ├── forms/       # 表單元件
│   │   └── layouts/     # 版面元件
│   ├── lib/             # 核心函式庫
│   │   ├── supabase.ts  # Supabase Client
│   │   ├── auth.ts      # 認證邏輯
│   │   └── utils.ts     # 工具函式
│   ├── services/        # 業務邏輯層
│   │   ├── user.service.ts
│   │   ├── project.service.ts
│   │   ├── bid.service.ts
│   │   └── ...
│   ├── middleware/      # API 中介層
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── ratelimit.middleware.ts
│   ├── types/          # TypeScript 類型定義
│   ├── hooks/          # 自訂 React Hooks
│   └── utils/          # 工具函式
├── .env.example        # 環境變數範例
├── package.json        # 專案依賴
├── tsconfig.json       # TypeScript 設定
├── tailwind.config.ts  # Tailwind 設定
└── README.md          # 專案說明文件
```

## 🔐 環境變數說明

詳見 `.env.example` 檔案，主要包含：

- **NEXT_PUBLIC_SUPABASE_URL**: Supabase 專案 URL
- **SUPABASE_SERVICE_ROLE_KEY**: Supabase Service Role Key
- **NEXT_PUBLIC_SUPABASE_ANON_KEY**: Supabase Anon Key
- **JWT_SECRET**: JWT 簽署金鑰
- **GOOGLE_CLIENT_ID/SECRET**: Google OAuth 認證
- **CLOUD_STORAGE_***: 雲端儲存設定
- **STRIPE_***: Stripe 支付設定
- **OPENAI_API_KEY**: OpenAI API 金鑰

## 🧪 測試

```bash
# 執行單元測試
npm run test

# 執行 E2E 測試
npm run test:e2e

# 檢查程式碼格式
npm run lint

# 自動格式化程式碼
npm run format

# TypeScript 型別檢查
npm run type-check
```

## 📝 API 文件

API 文件位於 `/api/docs`（開發中）

主要 API 端點：

- **認證**: `/api/auth/*`
- **使用者**: `/api/users/*`
- **案件**: `/api/projects/*`
- **投標**: `/api/bids/*`
- **訊息**: `/api/messages/*`
- **通知**: `/api/notifications/*`
- **評價**: `/api/reviews/*`
- **標籤**: `/api/tags/*`

## 🚀 部署

### Vercel 部署

```bash
# 安裝 Vercel CLI
npm i -g vercel

# 部署
vercel
```

### GCP Cloud Run 部署

詳見部署文件（開發中）

## 📄 授權

MIT License

## 👥 貢獻

歡迎提交 Issue 或 Pull Request！

---

**200 OK** - 讓每個專案都順利交付 ✨

