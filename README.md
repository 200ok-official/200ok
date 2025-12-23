# 200 OK - 軟體接案平台

> 一個現代化的軟體接案媒合平台，連結發案者與接案工程師

## 📋 目錄

- [功能特色](#-功能特色)
- [服務內容](#-服務內容)
- [技術棧](#️-技術棧)
- [安裝與執行](#-安裝與執行)
- [環境變數設定](#-環境變數設定)
- [專案結構](#-專案結構)
- [API 文件](#-api-文件)
- [部署連結](#-部署連結)
- [Demo 連結](#-demo-連結)
- [專案心得](#-專案心得)

## 🚀 功能特色

- **智慧媒合**：AI 驅動的案件推薦系統
- **引導式發案**：簡化的案件建立流程
- **即時通訊**：內建即時訊息系統
- **安全支付**：託管式付款機制
- **評價系統**：透明的雙向評價機制
- **標籤系統**：精準的技能與專案分類

## 📱 服務內容

### 發案者功能

- **建立案件**：透過引導式問答流程建立專案需求，AI 輔助生成專案摘要
- **管理案件**：查看投標者列表、接受/拒絕投標、修改案件資訊、關閉或取消案件
- **搜尋接案者**：瀏覽接案者資料、查看作品集與評價、直接聯絡
- **評價系統**：案件完成後可對接案者進行評價
- **代幣系統**：使用代幣解鎖提案、直接聯絡接案者

### 接案者功能

- **瀏覽案件**：依技能、預算、日期、狀態篩選案件，關鍵字搜尋
- **投標功能**：提交提案、附上報價與時程規劃、修改或撤回投標
- **個人資料**：上傳技能、履歷、作品集，管理個人資訊
- **評價系統**：案件完成後可對發案者進行評價
- **代幣管理**：購買代幣、查看代幣餘額與交易記錄

### 核心服務

- **案件管理**：完整的案件生命週期管理（草稿 → 開放中 → 進行中 → 已完成 → 已關閉）
- **投標系統**：投標、接受、拒絕、撤回等完整流程
- **即時通訊**：專案相關的訊息自動歸類，已讀狀態顯示
- **評價系統**：雙向評價機制，雙方評價後才顯示（避免報復性評價）
- **代幣系統**：付費聯絡機制，確保系統安全性與公平性
- **通知系統**：站內通知、Email 通知，多種通知類型

## 🛠️ 技術棧

### 前端
- **框架**: Next.js 14 (App Router)
- **樣式**: Tailwind CSS
- **語言**: TypeScript
- **狀態管理**: React Hooks

### 後端
- **框架**: FastAPI (Python)
- **資料庫**: PostgreSQL (Cloud SQL)
- **ORM**: SQLAlchemy Core (Raw SQL)
- **認證**: JWT (PyJWT)
- **郵件**: Resend
- **AI**: Google Gemini API

### 雲端服務
- **前端部署**: Vercel
- **後端部署**: GCP Cloud Run
- **資料庫**: Cloud SQL (PostgreSQL)
- **儲存**: Google Cloud Storage
- **Email**: Resend
- **認證**: Google OAuth (NextAuth.js)

## 📦 安裝與執行

### 前置需求

- **Node.js**: 18.x 或更高版本
- **Python**: 3.10 或更高版本
- **PostgreSQL**: 14 或更高版本（或使用 Cloud SQL）
- **Git**: 用於版本控制

### 前端安裝步驟

#### 1. 克隆專案

```bash
git clone https://github.com/200ok-official/200ok.git
cd 200ok
```

#### 2. 安裝依賴

```bash
npm install
```

#### 3. 設定環境變數

**重要**：請勿直接 commit `.env` 檔案，它包含敏感資訊！

建立 `.env` 檔案（參考 `.env.example`）：

```bash
# 如果專案根目錄有 .env.example，複製它
cp .env.example .env

# 如果沒有，請手動建立 .env 檔案並填入以下變數
```

#### 4. 啟動前端開發伺服器

```bash
npm run dev
```

前端將在 [http://localhost:3000](http://localhost:3000) 啟動

### 後端安裝步驟

#### 1. 進入後端目錄

```bash
cd backend
```

#### 2. 建立虛擬環境（建議）

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

#### 3. 安裝 Python 依賴

```bash
pip install -r requirements.txt
```

#### 4. 設定後端環境變數

建立 `backend/.env` 檔案（參考 `backend/env.example`）：

```bash
# 複製範例檔案
cp env.example .env

# 編輯 .env 檔案，填入實際的資料庫連線資訊和其他設定
```

#### 5. 設定資料庫

1. 建立 PostgreSQL 資料庫（或使用 Cloud SQL）
2. 執行 `supabase_schema.sql` 建立資料表結構
3. 在 `.env` 中設定 `DATABASE_URL`

#### 6. 啟動後端開發伺服器

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

後端 API 將在 [http://localhost:8000](http://localhost:8000) 啟動

API 文檔可在 [http://localhost:8000/docs](http://localhost:8000/docs) 查看

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

## 🔐 環境變數設定

### ⚠️ 重要提醒

**請勿直接 commit `.env` 檔案到 Git！** `.env` 檔案包含敏感資訊（如資料庫密碼、API 金鑰等），如果洩漏會造成安全風險。

專案中提供了 `.env.example` 和 `backend/env.example` 作為範例檔案，這些檔案**不包含真實的敏感資訊**，可以安全地 commit 到 Git。

### 前端環境變數（`.env`）

在專案根目錄建立 `.env` 檔案，參考 `.env.example`（如果存在）或使用以下範例：

```env
# 後端 API 基礎 URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# NextAuth 設定
NEXTAUTH_SECRET=your_nextauth_secret_key_here
NEXTAUTH_URL=http://localhost:3000

# Google OAuth 設定
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Supabase 設定（如果使用）
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# 折扣碼設定（可選）
NEXT_PUBLIC_DISCOUNT_CODES=WELCOME100:100,VIP500:500
```

**取得方式：**
- `NEXTAUTH_SECRET`: 使用 `openssl rand -base64 32` 生成
- `GOOGLE_CLIENT_ID/SECRET`: 在 [Google Cloud Console](https://console.cloud.google.com/apis/credentials) 建立 OAuth 憑證
- `NEXT_PUBLIC_API_BASE_URL`: 後端 API 的 URL（開發環境為 `http://localhost:8000`）

### 後端環境變數（`backend/.env`）

在 `backend` 目錄建立 `.env` 檔案，參考 `backend/env.example`：

```env
# 資料庫連線（格式：postgresql+psycopg://user:password@host:port/database）
DATABASE_URL=postgresql+psycopg://postgres:your_password@db.xxxxx.supabase.co:5432/postgres

# JWT 設定
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# 應用程式設定
DEBUG=true
APP_NAME=200ok Backend API
APP_VERSION=1.0.0

# CORS 設定（前端 URL，逗號分隔）
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Email 設定 (Resend)
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=noreply@200ok.tw
FRONTEND_URL=http://localhost:3000

# 代幣系統設定
TOKEN_UNLOCK_DIRECT_COST=200
TOKEN_SUBMIT_PROPOSAL_COST=100
TOKEN_VIEW_PROPOSAL_COST=50
TOKEN_NEW_USER_GIFT=1000
DISCOUNT_CODES=WELCOME100:100,VIP500:500

# AI 服務設定 (Google Gemini)
GEMINI_API_KEY=your_gemini_api_key_here
```

**取得方式：**
- `DATABASE_URL`: 從 Cloud SQL 或 Supabase 取得連線字串
- `JWT_SECRET`: 使用 `openssl rand -base64 32` 生成
- `RESEND_API_KEY`: 在 [Resend](https://resend.com) 註冊並取得 API Key
- `GEMINI_API_KEY`: 在 [Google AI Studio](https://makersuite.google.com/app/apikey) 取得

### 環境變數檢查清單

在啟動應用程式前，請確認以下環境變數已正確設定：

**前端必需：**
- ✅ `NEXT_PUBLIC_API_BASE_URL`
- ✅ `NEXTAUTH_SECRET`
- ✅ `NEXTAUTH_URL`
- ✅ `GOOGLE_CLIENT_ID`（如果使用 Google OAuth）
- ✅ `GOOGLE_CLIENT_SECRET`（如果使用 Google OAuth）

**後端必需：**
- ✅ `DATABASE_URL`
- ✅ `JWT_SECRET`
- ✅ `CORS_ORIGINS`
- ✅ `RESEND_API_KEY`（如果使用 Email 功能）
- ✅ `FRONTEND_URL`

**後端可選：**
- `GEMINI_API_KEY`（如果使用 AI 功能）
- `TOKEN_*`（代幣系統設定）

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

詳細的 API 文檔請參考：
- [API 完整列表](說明文件/API/API_LIST.md) - 所有 API 端點快速參考
- [API 詳細文檔](說明文件/API/API_DOCS.md) - 完整的 API 使用說明

主要 API 端點：

- **認證**: `/api/v1/auth/*`
- **使用者**: `/api/v1/users/*`
- **案件**: `/api/v1/projects/*`
- **投標**: `/api/v1/bids/*`
- **訊息**: `/api/v1/messages/*`
- **對話**: `/api/v1/conversations/*`
- **代幣**: `/api/v1/tokens/*`
- **標籤**: `/api/v1/tags/*`

## 📚 說明文件

完整的說明文件請參考：[說明文件索引](說明文件/README.md)

主要分類：
- 🔌 [API 文檔](說明文件/API/)
- 🔐 [認證系統](說明文件/認證系統/)
- 📧 [郵件與 Resend](說明文件/郵件與Resend/)
- 🗄️ [資料庫](說明文件/資料庫/)
- 🚀 [部署指南](說明文件/部署/)
- 💻 [開發指南](說明文件/開發/)
- 🐛 [問題修復](說明文件/問題修復/)

## 🚀 部署連結

### 前端部署

- **線上網站**: [https://200ok.superb-tutor.com/](https://200ok.superb-tutor.com/)
- **部署指南**: [說明文件/部署/DEPLOYMENT.md](說明文件/部署/DEPLOYMENT.md)

### 後端部署

- **GCP Cloud Run**: [https://superb-backend-1041765261654.asia-east1.run.app](https://superb-backend-1041765261654.asia-east1.run.app)
- **API 文檔**: [https://superb-backend-1041765261654.asia-east1.run.app/docs](https://superb-backend-1041765261654.asia-east1.run.app/docs)
- **部署指南**: [說明文件/部署/DEPLOYMENT.md](說明文件/部署/DEPLOYMENT.md)

## 🎬 Demo 連結

- **Demo 影片**: [https://youtu.be/3eJiVbF_AcI](https://youtu.be/3eJiVbF_AcI)
- **線上網站**: [https://200ok.superb-tutor.com/](https://200ok.superb-tutor.com/)
- **GitHub Repository**: [https://github.com/200ok-official/200ok](https://github.com/200ok-official/200ok)
- **API 文檔**: [https://superb-backend-1041765261654.asia-east1.run.app/docs](https://superb-backend-1041765261654.asia-east1.run.app/docs)

## 💭 專案心得

### 開發歷程

本專案歷經數個月的開發，從需求分析、系統設計、實作到測試與部署，逐步完成各項功能模組。過程中遇到許多挑戰，包括資料庫遷移、認證系統實作、CORS 問題、狀態管理複雜性等，但透過系統性的問題分析與解決，最終成功建立了一個功能完整的接案媒合平台。

### 技術學習

透過實作這個專案，我們深入理解了：
- **前端開發**：Next.js App Router、TypeScript、Tailwind CSS、React Hooks
- **後端開發**：FastAPI、異步程式設計、PostgreSQL、Raw SQL 優化
- **系統架構**：前後端分離、API 設計、微服務思維
- **雲端部署**：Vercel、GCP Cloud Run、容器化部署
- **問題解決**：系統性除錯、日誌記錄、程式碼重構

### 專案特色

1. **完整的 RESTful API**：50+ 個 API 端點，遵循 RESTful 設計原則
2. **型別安全**：使用 TypeScript 與 Pydantic 確保型別安全
3. **效能優化**：使用 Raw SQL 與連線池管理，提升查詢效能
4. **安全性**：完整的認證與權限檢查機制
5. **使用者體驗**：響應式設計、流暢的動畫效果、清晰的錯誤訊息

### 未來展望

- 持續優化效能與使用者體驗
- 擴展 AI 推薦系統功能
- 加強測試覆蓋率
- 實作更多進階功能（如即時通訊、檔案上傳等）

詳細的專案心得請參考：[技術架構說明](技術架構.md)

## 📄 授權

MIT License

## 👥 貢獻

歡迎提交 Issue 或 Pull Request！

---

**200 OK** - 讓每個專案都順利交付 ✨

