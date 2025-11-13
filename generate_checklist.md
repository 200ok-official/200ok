# FreelanceMatch - AI Agent Generation Checklist
這份 Checklist 用於指引 AI Agent 分階段完成整個軟體接案平台的建置。  
每一階段完成後，Agent 必須回傳對應 Output，並檢查所有 Completion Criteria 是否達成，才能進入下一階段。

---

## 1️⃣ Phase 1 — Project Initialization
### Tasks
- 建立前端 / 後端 Monorepo 或獨立 repo 結構
- 初始化 package.json、tsconfig、環境變數 .env.example
- 安裝主要框架（React + Tailwind / Node + Express or NestJS）
- 設定 ESLint、Prettier、自動格式化
- 建立 Git repo 結構（src/, apps/, packages/）

### Output Requirements
- 專案資料夾結構（樹狀）
- package.json（frontend + backend）
- .env.example
- 初始化 README

### Completion Criteria
- 可以成功執行：  
  - `npm run dev`（frontend）  
  - `npm run dev`（backend）
- 資料夾結構清楚、沒有缺失檔案

---

## 2️⃣ Phase 2 — Database Schema
### Tasks
- 使用 upabase Schema 建立資料表
- 五大資料表：User, Project, Bid, Message, Review
- Enum、Foreign keys、Index 設定
- 建立 migration

### Output Requirements
- SQL Schema
- Migration SQL

---

## 3️⃣ Phase 3 — Backend Architecture Setup
### Tasks
- 建立後端架構：controllers / services / modules
- 全域 error handler、logger、中介層
- API 版本化（/api/v1）

### Output Requirements
- 完整的後端目錄架構（樹狀）
- 基礎伺服器啟動程式 server.ts / main.ts

### Completion Criteria
- `npm run dev` 能正確啟動 server
- `/api/v1/health` 回傳 `{ status: "ok" }`

---

## 4️⃣ Phase 4 — Auth System
### Tasks
- Email + 密碼註冊 / 登入
- Google OAuth
- JWT access + refresh tokens
- Firebase/SMS phone verification API

### Output Requirements
- Auth controller / service 程式碼
- /auth/register、/auth/login、/auth/google、/auth/verify-sms API

### Completion Criteria
- 能成功註冊、登入，收到 JWT
- Google OAuth 可模擬登入流程
- 驗證 API 正確回傳 success / error

---

## 5️⃣ Phase 5 — User Profile System
### Tasks
- 使用者 CRUD
- 上傳大頭貼（Cloud Storage）
- 更新密碼
- 技能 Tags CRUD

### Output Requirements
- /users/me、/users/update、/users/avatar、/users/skills API

### Completion Criteria
- 使用者能成功更新資料
- 大頭照可成功上傳並取得公開 URL

---

## 6️⃣ Phase 6 — Project System
### Tasks
- 發案者新增案件
- 案件查詢、篩選、依技能搜尋
- 更新/刪除案件
- 狀態流（open → in_progress → completed → closed）

### Output Requirements
- /projects CRUD API
- required_skills[] 優化後的查詢邏輯

### Completion Criteria
- 新增案件成功
- 篩選／搜尋正常回傳
- Project 狀態變更正常

---

## 7️⃣ Phase 7 — Bidding System
### Tasks
- 投標（freelancer）
- 發案者接受／拒絕
- 檢查避免自己投自己案

### Output Requirements
- /projects/:id/bids CRUD
- /bids/:id/accept、/bids/:id/reject

### Completion Criteria
- freelancer 可以成功送 bid
- client 可以 accept / reject

---

## 8️⃣ Phase 8 — Messaging System
### Tasks
- 選擇 Socket.io / Pusher / Supabase Realtime
- 建立訊息儲存資料表整合
- WebSocket event：sendMessage、subscribeMessage
- 通知系統基礎 API

### Output Requirements
- messaging controller / service
- WebSocket handler（send & subscribe）

### Completion Criteria
- 用兩個 client 模擬聊天可成功雙向收訊息
- DB 內有訊息紀錄

---

## 9️⃣ Phase 9 — Review System
### Tasks
- 評價 API
- 限制一個 project 雙方各評一次
- 自動更新 user rating 平均值

### Output Requirements
- /projects/:id/review API

### Completion Criteria
- 雙方可成功評價
- 使用者 rating 會自動更新並寫回 DB

---

## 🔟 Phase 10 — Admin System
### Tasks
- 查看所有 users / projects
- 停權使用者
- 下架違規案件
- Admin 權限 middleware（role：admin）

### Output Requirements
- /admin/users、/admin/projects、/admin/ban API

### Completion Criteria
- 普通使用者不可呼叫 admin API
- 管理員可成功停權／下架

---

## 1️⃣1️⃣ Phase 11 — Frontend UI Pages
### Tasks
建立以下 React + Tailwind UI：

### Client（發案者）
- 註冊 / 登入頁
- 新增案件頁
- 案件管理頁
- 案件詳情（含 bid 列表）

### Freelancer（接案者）
- Dashboard
- 案件列表
- 案件詳情（可投標）
- Chat 頁
- 評價頁

### Output Requirements
- 每個頁面的 React Component
- API hooks（useQuery / useMutation）

### Completion Criteria
- 所有頁面可正常載入
- API 串接成功、能讀寫資料

---

## 1️⃣2️⃣ Phase 12 — Deployment & CI/CD
### Tasks
- 前端部署：Vercel
- 後端部署：GCP or Supabase Functions
- DB：Supabase / CloudSQL
- GitHub Actions：自動部署 pipeline
- Dockerfile（若使用 GCP Run）

### Output Requirements
- vercel.json
- dockerfile
- github/workflows/deploy.yml

### Completion Criteria
- 前端網址可正常運作
- 後端 API 可被前端呼叫
- CI/CD pipeline 執行成功（push → deploy）

---

# ✔ 最終階段核對（Project Completion Checklist）
AI Agent 必須確認：

- [ ] 所有 12 階段皆完成  
- [ ] 前後端可正常串接  
- [ ] 全部 API 可通過 Postman 測試  
- [ ] 所有頁面可互動、可登入、可投標、可評價  
- [ ] Chat 功能可雙向收訊息  
- [ ] Database migrations 已上線  
- [ ] 部署網址可正常訪問  

---

# 🎉 任務完成
完成後請回傳：
- 前端網址
- 後端 API Base URL
- 資料庫連線資訊（測試環境）
- Commit hash + GitHub repo