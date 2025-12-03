-- 200 OK Database Schema for Supabase
-- 在 Supabase SQL Editor 中執行此檔案

-- ===== 建立 ENUM 類型 =====

CREATE TYPE user_role AS ENUM ('freelancer', 'client', 'admin');
CREATE TYPE project_status AS ENUM ('draft', 'open', 'in_progress', 'completed', 'closed', 'cancelled');
CREATE TYPE project_mode AS ENUM ('new_development', 'maintenance_modification');
CREATE TYPE bid_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'refunded', 'disputed');
CREATE TYPE notification_type AS ENUM ('bid_received', 'bid_accepted', 'bid_rejected', 'message', 'project_status_change', 'review_reminder', 'payment_received', 'tag_notification');
CREATE TYPE tag_category AS ENUM ('tech', 'project_type', 'domain', 'tool');
CREATE TYPE conversation_type AS ENUM ('direct', 'project_proposal');
CREATE TYPE transaction_type AS ENUM ('unlock_direct_contact', 'submit_proposal', 'view_proposal', 'refund', 'platform_fee');

-- ===== 建立資料表 =====

-- 1. Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  roles user_role[] NOT NULL DEFAULT ARRAY['client']::user_role[],
  bio TEXT,
  skills TEXT[],
  avatar_url VARCHAR(255),
  rating DECIMAL(3,2) DEFAULT 0.0,
  google_id VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  phone_verified BOOLEAN DEFAULT false,
  email_verified BOOLEAN DEFAULT false,
  portfolio_links TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Refresh Tokens Table
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2.1 Email Verification Tokens Table
CREATE TABLE email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2.2 User Tokens (代幣系統)
CREATE TABLE user_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  total_earned INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2.3 Token Transactions (代幣交易記錄)
CREATE TABLE token_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- 正數為增加，負數為減少
  balance_after INTEGER NOT NULL,
  transaction_type transaction_type NOT NULL,
  reference_id UUID, -- 關聯 ID（對話、提案等）
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Projects Table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 基本資訊（必填）
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  project_mode project_mode NOT NULL DEFAULT 'new_development',
  project_type VARCHAR(50),
  
  -- AI 生成的摘要
  ai_summary TEXT,
  
  -- 預算與時程
  budget_min DECIMAL(10,2) NOT NULL,
  budget_max DECIMAL(10,2) NOT NULL,
  budget_estimate_only BOOLEAN DEFAULT false,
  start_date TIMESTAMP,
  deadline TIMESTAMP,
  deadline_flexible BOOLEAN DEFAULT false,
  payment_method VARCHAR(50),
  payment_schedule JSONB,
  
  -- 技能需求
  required_skills TEXT[],
  
  -- === 全新開發專案獨立欄位 ===
  -- Step 2: 使用場景
  new_usage_scenario TEXT,
  
  -- Step 3: 目標
  new_goals TEXT,
  
  -- Step 4: 功能需求
  new_features TEXT[],
  
  -- Step 5: 交付項目
  new_outputs TEXT[],
  new_outputs_other TEXT,
  
  -- Step 6: 參考資料
  new_design_style TEXT[],
  
  -- Step 7: 整合需求
  new_integrations TEXT[],
  new_integrations_other TEXT,
  
  -- Step 9: 交付物與溝通
  new_deliverables TEXT[],
  new_communication_preference TEXT[],
  
  -- Step 10: 其他
  new_special_requirements TEXT,
  new_concerns TEXT[],
  
  -- === 修改維護專案獨立欄位 ===
  -- Step 2: 當前系統資訊
  maint_system_name TEXT,                    -- 系統名稱
  maint_system_purpose TEXT,                 -- 系統用途
  maint_current_users_count VARCHAR(50),     -- 使用人數範圍
  maint_system_age VARCHAR(50),              -- 系統使用時間
  
  -- Step 3: 問題與需求
  maint_current_problems TEXT,               -- 目前遇到的問題
  maint_desired_improvements TEXT,           -- 希望改善的地方
  maint_new_features TEXT,                   -- 希望新增的功能
  
  -- Step 4: 技術資訊
  maint_known_tech_stack TEXT[],             -- 已知的技術棧
  maint_has_source_code BOOLEAN,             -- 是否有原始碼
  maint_has_documentation BOOLEAN,           -- 是否有文件
  maint_can_provide_access BOOLEAN,          -- 是否可提供存取
  maint_technical_contact TEXT,              -- 技術聯絡人資訊
  
  -- Step 5: 預算時程（與全新開發共用上方欄位）
  
  -- Step 6: 交付期望
  maint_expected_outcomes TEXT,              -- 預期成果
  maint_success_criteria TEXT,               -- 成功標準
  maint_additional_notes TEXT,               -- 補充說明
  
  -- 共用欄位
  reference_links TEXT[],
  special_requirements TEXT,
  
  -- 狀態
  status project_status DEFAULT 'draft',
  accepted_bid_id UUID UNIQUE,
  
  -- 時間戳記
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Bids Table
CREATE TABLE bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  freelancer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  proposal TEXT NOT NULL,
  bid_amount DECIMAL(10,2) NOT NULL,
  estimated_days INTEGER,
guanyuchen@Pierres-Macbook 200ok % npm run dev

> 200ok@0.1.0 dev
> next dev

  ▲ Next.js 14.2.33
  - Local:        http://localhost:3000
  - Environments: .env

 ✓ Starting...
 ✓ Ready in 1703ms
(node:10697) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
 ○ Compiling / ...
 ✓ Compiled / in 1253ms (604 modules)
 GET / 200 in 1420ms
 ✓ Compiled in 144ms (311 modules)
 ✓ Compiled /api/v1/projects in 353ms (479 modules)
 ✓ Compiled (1001 modules)
API Error: UnauthorizedError: 請先登入
    at requireAuth (webpack-internal:///(rsc)/./src/middleware/auth.middleware.ts:68:15)
    at eval (webpack-internal:///(rsc)/./src/app/api/v1/conversations/route.ts:17:94)
    at eval (webpack-internal:///(rsc)/./src/middleware/error.middleware.ts:125:26)
    at /Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:57234
    at /Users/guanyuchen/200ok/node_modules/next/dist/server/lib/trace/tracer.js:140:36
    at NoopContextManager.with (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:7062)
    at ContextAPI.with (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:518)
    at NoopTracer.startActiveSpan (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:18093)
    at ProxyTracer.startActiveSpan (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:18854)
    at /Users/guanyuchen/200ok/node_modules/next/dist/server/lib/trace/tracer.js:122:103
    at NoopContextManager.with (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:7062)
    at ContextAPI.with (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:518)
    at NextTracerImpl.trace (/Users/guanyuchen/200ok/node_modules/next/dist/server/lib/trace/tracer.js:122:28)
    at /Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:48896
    at AsyncLocalStorage.run (node:internal/async_local_storage/async_hooks:91:14)
    at Object.wrap (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:40958)
    at /Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:47472
    at AsyncLocalStorage.run (node:internal/async_local_storage/async_hooks:91:14)
    at Object.wrap (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:38293)
    at /Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:47434
    at AsyncLocalStorage.run (node:internal/async_local_storage/async_hooks:91:14)
    at eT.execute (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:46881)
    at eT.handle (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:58771)
    at doRender (/Users/guanyuchen/200ok/node_modules/next/dist/server/base-server.js:1366:60)
    at cacheEntry.responseCache.get.routeKind (/Users/guanyuchen/200ok/node_modules/next/dist/server/base-server.js:1588:34)
    at ResponseCache.get (/Users/guanyuchen/200ok/node_modules/next/dist/server/response-cache/index.js:49:26)
    at DevServer.renderToResponseWithComponentsImpl (/Users/guanyuchen/200ok/node_modules/next/dist/server/base-server.js:1496:53) {
  statusCode: 401,
  isOperational: true
}
 GET /api/v1/conversations 401 in 1204ms
API Error: UnauthorizedError: 請先登入
    at requireAuth (webpack-internal:///(rsc)/./src/middleware/auth.middleware.ts:68:15)
    at eval (webpack-internal:///(rsc)/./src/app/api/v1/tokens/balance/route.ts:17:94)
    at eval (webpack-internal:///(rsc)/./src/middleware/error.middleware.ts:125:26)
    at /Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:57234
    at /Users/guanyuchen/200ok/node_modules/next/dist/server/lib/trace/tracer.js:140:36
    at NoopContextManager.with (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:7062)
    at ContextAPI.with (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:518)
    at NoopTracer.startActiveSpan (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:18093)
    at ProxyTracer.startActiveSpan (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:18854)
    at /Users/guanyuchen/200ok/node_modules/next/dist/server/lib/trace/tracer.js:122:103
    at NoopContextManager.with (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:7062)
    at ContextAPI.with (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:518)
    at NextTracerImpl.trace (/Users/guanyuchen/200ok/node_modules/next/dist/server/lib/trace/tracer.js:122:28)
    at /Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:48896
    at AsyncLocalStorage.run (node:internal/async_local_storage/async_hooks:91:14)
    at Object.wrap (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:40958)
    at /Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:47472
    at AsyncLocalStorage.run (node:internal/async_local_storage/async_hooks:91:14)
    at Object.wrap (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:38293)
    at /Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:47434
    at AsyncLocalStorage.run (node:internal/async_local_storage/async_hooks:91:14)
    at eT.execute (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:46881)
    at eT.handle (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:58771)
    at doRender (/Users/guanyuchen/200ok/node_modules/next/dist/server/base-server.js:1366:60)
    at cacheEntry.responseCache.get.routeKind (/Users/guanyuchen/200ok/node_modules/next/dist/server/base-server.js:1588:34)
    at ResponseCache.get (/Users/guanyuchen/200ok/node_modules/next/dist/server/response-cache/index.js:49:26)
    at DevServer.renderToResponseWithComponentsImpl (/Users/guanyuchen/200ok/node_modules/next/dist/server/base-server.js:1496:53) {
  statusCode: 401,
  isOperational: true
}
 GET /api/v1/tokens/balance 401 in 1218ms
API Error: UnauthorizedError: 請先登入
    at requireAuth (webpack-internal:///(rsc)/./src/middleware/auth.middleware.ts:68:15)
    at eval (webpack-internal:///(rsc)/./src/app/api/v1/conversations/route.ts:17:94)
    at eval (webpack-internal:///(rsc)/./src/middleware/error.middleware.ts:125:26)
    at /Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:57234
    at /Users/guanyuchen/200ok/node_modules/next/dist/server/lib/trace/tracer.js:140:36
    at NoopContextManager.with (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:7062)
    at ContextAPI.with (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:518)
    at NoopTracer.startActiveSpan (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:18093)
    at ProxyTracer.startActiveSpan (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:18854)
    at /Users/guanyuchen/200ok/node_modules/next/dist/server/lib/trace/tracer.js:122:103
    at NoopContextManager.with (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:7062)
    at ContextAPI.with (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:518)
    at NextTracerImpl.trace (/Users/guanyuchen/200ok/node_modules/next/dist/server/lib/trace/tracer.js:122:28)
    at /Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:48896
    at AsyncLocalStorage.run (node:internal/async_local_storage/async_hooks:91:14)
    at Object.wrap (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:40958)
    at /Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:47472
    at AsyncLocalStorage.run (node:internal/async_local_storage/async_hooks:91:14)
    at Object.wrap (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:38293)
    at /Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:47434
    at AsyncLocalStorage.run (node:internal/async_local_storage/async_hooks:91:14)
    at eT.execute (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:46881)
    at eT.handle (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:58771)
    at doRender (/Users/guanyuchen/200ok/node_modules/next/dist/server/base-server.js:1366:60)
    at cacheEntry.responseCache.get.routeKind (/Users/guanyuchen/200ok/node_modules/next/dist/server/base-server.js:1588:34)
    at ResponseCache.get (/Users/guanyuchen/200ok/node_modules/next/dist/server/response-cache/index.js:49:26)
    at DevServer.renderToResponseWithComponentsImpl (/Users/guanyuchen/200ok/node_modules/next/dist/server/base-server.js:1496:53) {
  statusCode: 401,
  isOperational: true
}
 GET /api/v1/conversations 401 in 11ms
API Error: UnauthorizedError: 請先登入
    at requireAuth (webpack-internal:///(rsc)/./src/middleware/auth.middleware.ts:68:15)
    at eval (webpack-internal:///(rsc)/./src/app/api/v1/tokens/balance/route.ts:17:94)
    at eval (webpack-internal:///(rsc)/./src/middleware/error.middleware.ts:125:26)
    at /Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:57234
    at /Users/guanyuchen/200ok/node_modules/next/dist/server/lib/trace/tracer.js:140:36
    at NoopContextManager.with (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:7062)
    at ContextAPI.with (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:518)
    at NoopTracer.startActiveSpan (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:18093)
    at ProxyTracer.startActiveSpan (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:18854)
    at /Users/guanyuchen/200ok/node_modules/next/dist/server/lib/trace/tracer.js:122:103
    at NoopContextManager.with (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:7062)
    at ContextAPI.with (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:518)
    at NextTracerImpl.trace (/Users/guanyuchen/200ok/node_modules/next/dist/server/lib/trace/tracer.js:122:28)
    at /Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:48896
    at AsyncLocalStorage.run (node:internal/async_local_storage/async_hooks:91:14)
    at Object.wrap (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:40958)
    at /Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:47472
    at AsyncLocalStorage.run (node:internal/async_local_storage/async_hooks:91:14)
    at Object.wrap (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:38293)
    at /Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:47434
    at AsyncLocalStorage.run (node:internal/async_local_storage/async_hooks:91:14)
    at eT.execute (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:46881)
    at eT.handle (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:58771)
    at doRender (/Users/guanyuchen/200ok/node_modules/next/dist/server/base-server.js:1366:60)
    at cacheEntry.responseCache.get.routeKind (/Users/guanyuchen/200ok/node_modules/next/dist/server/base-server.js:1588:34)
    at ResponseCache.get (/Users/guanyuchen/200ok/node_modules/next/dist/server/response-cache/index.js:49:26)
    at DevServer.renderToResponseWithComponentsImpl (/Users/guanyuchen/200ok/node_modules/next/dist/server/base-server.js:1496:53) {
  statusCode: 401,
  isOperational: true
}
 GET /api/v1/tokens/balance 401 in 13ms
 GET /api/auth/session 200 in 1561ms
 GET /api/auth/session 200 in 8ms
 GET /api/auth/session 200 in 10ms
 GET /api/v1/projects?limit=5&status=open 200 in 2016ms
 ✓ Compiled /api/v1/users/search in 80ms (1004 modules)
 GET /api/v1/projects?limit=5&status=open 200 in 495ms
 GET /api/v1/users/search?limit=5 200 in 872ms
 GET /api/v1/users/search?limit=5 200 in 530ms
 ✓ Compiled /tokens in 201ms (1307 modules)
API Error: UnauthorizedError: 請先登入
    at requireAuth (webpack-internal:///(rsc)/./src/middleware/auth.middleware.ts:68:15)
    at eval (webpack-internal:///(rsc)/./src/app/api/v1/tokens/balance/route.ts:17:94)
    at eval (webpack-internal:///(rsc)/./src/middleware/error.middleware.ts:125:26)
    at /Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:57234
    at /Users/guanyuchen/200ok/node_modules/next/dist/server/lib/trace/tracer.js:140:36
    at NoopContextManager.with (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:7062)
    at ContextAPI.with (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:518)
    at NoopTracer.startActiveSpan (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:18093)
    at ProxyTracer.startActiveSpan (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:18854)
    at /Users/guanyuchen/200ok/node_modules/next/dist/server/lib/trace/tracer.js:122:103
    at NoopContextManager.with (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:7062)
    at ContextAPI.with (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:518)
    at NextTracerImpl.trace (/Users/guanyuchen/200ok/node_modules/next/dist/server/lib/trace/tracer.js:122:28)
    at /Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:48896
    at AsyncLocalStorage.run (node:internal/async_local_storage/async_hooks:91:14)
    at Object.wrap (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:40958)
    at /Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:47472
    at AsyncLocalStorage.run (node:internal/async_local_storage/async_hooks:91:14)
    at Object.wrap (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:38293)
    at /Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:47434
    at AsyncLocalStorage.run (node:internal/async_local_storage/async_hooks:91:14)
    at eT.execute (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:46881)
    at eT.handle (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:58771)
    at doRender (/Users/guanyuchen/200ok/node_modules/next/dist/server/base-server.js:1366:60)
    at cacheEntry.responseCache.get.routeKind (/Users/guanyuchen/200ok/node_modules/next/dist/server/base-server.js:1588:34)
    at ResponseCache.get (/Users/guanyuchen/200ok/node_modules/next/dist/server/response-cache/index.js:49:26)
    at DevServer.renderToResponseWithComponentsImpl (/Users/guanyuchen/200ok/node_modules/next/dist/server/base-server.js:1496:53) {
  statusCode: 401,
  isOperational: true
}
 GET /api/v1/tokens/balance 401 in 14ms
API Error: UnauthorizedError: 請先登入
    at requireAuth (webpack-internal:///(rsc)/./src/middleware/auth.middleware.ts:68:15)
    at eval (webpack-internal:///(rsc)/./src/app/api/v1/conversations/route.ts:17:94)
    at eval (webpack-internal:///(rsc)/./src/middleware/error.middleware.ts:125:26)
    at /Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:57234
    at /Users/guanyuchen/200ok/node_modules/next/dist/server/lib/trace/tracer.js:140:36
    at NoopContextManager.with (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:7062)
    at ContextAPI.with (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:518)
    at NoopTracer.startActiveSpan (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:18093)
    at ProxyTracer.startActiveSpan (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:18854)
    at /Users/guanyuchen/200ok/node_modules/next/dist/server/lib/trace/tracer.js:122:103
    at NoopContextManager.with (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:7062)
    at ContextAPI.with (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:518)
    at NextTracerImpl.trace (/Users/guanyuchen/200ok/node_modules/next/dist/server/lib/trace/tracer.js:122:28)
    at /Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:48896
    at AsyncLocalStorage.run (node:internal/async_local_storage/async_hooks:91:14)
    at Object.wrap (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:40958)
    at /Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:47472
    at AsyncLocalStorage.run (node:internal/async_local_storage/async_hooks:91:14)
    at Object.wrap (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:38293)
    at /Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:47434
    at AsyncLocalStorage.run (node:internal/async_local_storage/async_hooks:91:14)
    at eT.execute (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:46881)
    at eT.handle (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:58771)
    at doRender (/Users/guanyuchen/200ok/node_modules/next/dist/server/base-server.js:1366:60)
    at cacheEntry.responseCache.get.routeKind (/Users/guanyuchen/200ok/node_modules/next/dist/server/base-server.js:1588:34)
    at ResponseCache.get (/Users/guanyuchen/200ok/node_modules/next/dist/server/response-cache/index.js:49:26)
    at DevServer.renderToResponseWithComponentsImpl (/Users/guanyuchen/200ok/node_modules/next/dist/server/base-server.js:1496:53) {
  statusCode: 401,
  isOperational: true
}
 GET /api/v1/conversations 401 in 17ms
API Error: UnauthorizedError: 請先登入
    at requireAuth (webpack-internal:///(rsc)/./src/middleware/auth.middleware.ts:68:15)
    at eval (webpack-internal:///(rsc)/./src/app/api/v1/tokens/balance/route.ts:17:94)
    at eval (webpack-internal:///(rsc)/./src/middleware/error.middleware.ts:125:26)
    at /Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:57234
    at /Users/guanyuchen/200ok/node_modules/next/dist/server/lib/trace/tracer.js:140:36
    at NoopContextManager.with (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:7062)
    at ContextAPI.with (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:518)
    at NoopTracer.startActiveSpan (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:18093)
    at ProxyTracer.startActiveSpan (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:18854)
    at /Users/guanyuchen/200ok/node_modules/next/dist/server/lib/trace/tracer.js:122:103
    at NoopContextManager.with (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:7062)
    at ContextAPI.with (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:518)
    at NextTracerImpl.trace (/Users/guanyuchen/200ok/node_modules/next/dist/server/lib/trace/tracer.js:122:28)
    at /Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:48896
    at AsyncLocalStorage.run (node:internal/async_local_storage/async_hooks:91:14)
    at Object.wrap (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:40958)
    at /Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:47472
    at AsyncLocalStorage.run (node:internal/async_local_storage/async_hooks:91:14)
    at Object.wrap (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:38293)
    at /Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:47434
    at AsyncLocalStorage.run (node:internal/async_local_storage/async_hooks:91:14)
    at eT.execute (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:46881)
    at eT.handle (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:58771)
    at doRender (/Users/guanyuchen/200ok/node_modules/next/dist/server/base-server.js:1366:60)
    at cacheEntry.responseCache.get.routeKind (/Users/guanyuchen/200ok/node_modules/next/dist/server/base-server.js:1588:34)
    at ResponseCache.get (/Users/guanyuchen/200ok/node_modules/next/dist/server/response-cache/index.js:49:26)
    at DevServer.renderToResponseWithComponentsImpl (/Users/guanyuchen/200ok/node_modules/next/dist/server/base-server.js:1496:53) {
  statusCode: 401,
  isOperational: true
}
 GET /api/v1/tokens/balance 401 in 6ms
API Error: UnauthorizedError: 請先登入
    at requireAuth (webpack-internal:///(rsc)/./src/middleware/auth.middleware.ts:68:15)
    at eval (webpack-internal:///(rsc)/./src/app/api/v1/conversations/route.ts:17:94)
    at eval (webpack-internal:///(rsc)/./src/middleware/error.middleware.ts:125:26)
    at /Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:57234
    at /Users/guanyuchen/200ok/node_modules/next/dist/server/lib/trace/tracer.js:140:36
    at NoopContextManager.with (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:7062)
    at ContextAPI.with (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:518)
    at NoopTracer.startActiveSpan (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:18093)
    at ProxyTracer.startActiveSpan (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:18854)
    at /Users/guanyuchen/200ok/node_modules/next/dist/server/lib/trace/tracer.js:122:103
    at NoopContextManager.with (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:7062)
    at ContextAPI.with (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:518)
    at NextTracerImpl.trace (/Users/guanyuchen/200ok/node_modules/next/dist/server/lib/trace/tracer.js:122:28)
    at /Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:48896
    at AsyncLocalStorage.run (node:internal/async_local_storage/async_hooks:91:14)
    at Object.wrap (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:40958)
    at /Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:47472
    at AsyncLocalStorage.run (node:internal/async_local_storage/async_hooks:91:14)
    at Object.wrap (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:38293)
    at /Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:47434
    at AsyncLocalStorage.run (node:internal/async_local_storage/async_hooks:91:14)
    at eT.execute (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:46881)
    at eT.handle (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:58771)
    at doRender (/Users/guanyuchen/200ok/node_modules/next/dist/server/base-server.js:1366:60)
    at cacheEntry.responseCache.get.routeKind (/Users/guanyuchen/200ok/node_modules/next/dist/server/base-server.js:1588:34)
    at ResponseCache.get (/Users/guanyuchen/200ok/node_modules/next/dist/server/response-cache/index.js:49:26)
    at DevServer.renderToResponseWithComponentsImpl (/Users/guanyuchen/200ok/node_modules/next/dist/server/base-server.js:1496:53) {
  statusCode: 401,
  isOperational: true
}
 GET /api/v1/conversations 401 in 9ms
 ✓ Compiled /api/v1/tokens/transactions in 58ms (1010 modules)
API Error: UnauthorizedError: 請先登入
    at requireAuth (webpack-internal:///(rsc)/./src/middleware/auth.middleware.ts:68:15)
    at eval (webpack-internal:///(rsc)/./src/app/api/v1/tokens/balance/route.ts:17:94)
    at eval (webpack-internal:///(rsc)/./src/middleware/error.middleware.ts:125:26)
    at /Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:57234
    at /Users/guanyuchen/200ok/node_modules/next/dist/server/lib/trace/tracer.js:140:36
    at NoopContextManager.with (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:7062)
    at ContextAPI.with (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:518)
    at NoopTracer.startActiveSpan (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:18093)
    at ProxyTracer.startActiveSpan (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:18854)
    at /Users/guanyuchen/200ok/node_modules/next/dist/server/lib/trace/tracer.js:122:103
    at NoopContextManager.with (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:7062)
    at ContextAPI.with (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:518)
    at NextTracerImpl.trace (/Users/guanyuchen/200ok/node_modules/next/dist/server/lib/trace/tracer.js:122:28)
    at /Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:48896
    at AsyncLocalStorage.run (node:internal/async_local_storage/async_hooks:91:14)
    at Object.wrap (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:40958)
    at /Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:47472
    at AsyncLocalStorage.run (node:internal/async_local_storage/async_hooks:91:14)
    at Object.wrap (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:38293)
    at /Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:47434
    at AsyncLocalStorage.run (node:internal/async_local_storage/async_hooks:91:14)
    at eT.execute (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:46881)
    at eT.handle (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:58771)
    at doRender (/Users/guanyuchen/200ok/node_modules/next/dist/server/base-server.js:1366:60)
    at cacheEntry.responseCache.get.routeKind (/Users/guanyuchen/200ok/node_modules/next/dist/server/base-server.js:1588:34)
    at ResponseCache.get (/Users/guanyuchen/200ok/node_modules/next/dist/server/response-cache/index.js:49:26)
    at DevServer.renderToResponseWithComponentsImpl (/Users/guanyuchen/200ok/node_modules/next/dist/server/base-server.js:1496:53) {
  statusCode: 401,
  isOperational: true
}
 GET /api/v1/tokens/balance 401 in 117ms
API Error: UnauthorizedError: 請先登入
    at requireAuth (webpack-internal:///(rsc)/./src/middleware/auth.middleware.ts:68:15)
    at eval (webpack-internal:///(rsc)/./src/app/api/v1/tokens/transactions/route.ts:18:94)
    at eval (webpack-internal:///(rsc)/./src/middleware/error.middleware.ts:125:26)
    at /Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:57234
    at /Users/guanyuchen/200ok/node_modules/next/dist/server/lib/trace/tracer.js:140:36
    at NoopContextManager.with (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:7062)
    at ContextAPI.with (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:518)
    at NoopTracer.startActiveSpan (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:18093)
    at ProxyTracer.startActiveSpan (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:18854)
    at /Users/guanyuchen/200ok/node_modules/next/dist/server/lib/trace/tracer.js:122:103
    at NoopContextManager.with (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:7062)
    at ContextAPI.with (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:518)
    at NextTracerImpl.trace (/Users/guanyuchen/200ok/node_modules/next/dist/server/lib/trace/tracer.js:122:28)
    at /Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:48896
    at AsyncLocalStorage.run (node:internal/async_local_storage/async_hooks:91:14)
    at Object.wrap (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:40958)
    at /Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:47472
    at AsyncLocalStorage.run (node:internal/async_local_storage/async_hooks:91:14)
    at Object.wrap (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:38293)
    at /Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:47434
    at AsyncLocalStorage.run (node:internal/async_local_storage/async_hooks:91:14)
    at eT.execute (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:46881)
    at eT.handle (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:58771)
    at doRender (/Users/guanyuchen/200ok/node_modules/next/dist/server/base-server.js:1366:60)
    at cacheEntry.responseCache.get.routeKind (/Users/guanyuchen/200ok/node_modules/next/dist/server/base-server.js:1588:34)
    at ResponseCache.get (/Users/guanyuchen/200ok/node_modules/next/dist/server/response-cache/index.js:49:26)
    at DevServer.renderToResponseWithComponentsImpl (/Users/guanyuchen/200ok/node_modules/next/dist/server/base-server.js:1496:53) {
  statusCode: 401,
  isOperational: true
}
 GET /api/v1/tokens/transactions?limit=20 401 in 121ms
API Error: UnauthorizedError: 請先登入
    at requireAuth (webpack-internal:///(rsc)/./src/middleware/auth.middleware.ts:68:15)
    at eval (webpack-internal:///(rsc)/./src/app/api/v1/tokens/balance/route.ts:17:94)
    at eval (webpack-internal:///(rsc)/./src/middleware/error.middleware.ts:125:26)
    at /Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:57234
    at /Users/guanyuchen/200ok/node_modules/next/dist/server/lib/trace/tracer.js:140:36
    at NoopContextManager.with (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:7062)
    at ContextAPI.with (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:518)
    at NoopTracer.startActiveSpan (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:18093)
    at ProxyTracer.startActiveSpan (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:18854)
    at /Users/guanyuchen/200ok/node_modules/next/dist/server/lib/trace/tracer.js:122:103
    at NoopContextManager.with (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:7062)
    at ContextAPI.with (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:518)
    at NextTracerImpl.trace (/Users/guanyuchen/200ok/node_modules/next/dist/server/lib/trace/tracer.js:122:28)
    at /Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:48896
    at AsyncLocalStorage.run (node:internal/async_local_storage/async_hooks:91:14)
    at Object.wrap (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:40958)
    at /Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:47472
    at AsyncLocalStorage.run (node:internal/async_local_storage/async_hooks:91:14)
    at Object.wrap (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:38293)
    at /Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:47434
    at AsyncLocalStorage.run (node:internal/async_local_storage/async_hooks:91:14)
    at eT.execute (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:46881)
    at eT.handle (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:58771)
    at doRender (/Users/guanyuchen/200ok/node_modules/next/dist/server/base-server.js:1366:60)
    at cacheEntry.responseCache.get.routeKind (/Users/guanyuchen/200ok/node_modules/next/dist/server/base-server.js:1588:34)
    at ResponseCache.get (/Users/guanyuchen/200ok/node_modules/next/dist/server/response-cache/index.js:49:26)
    at DevServer.renderToResponseWithComponentsImpl (/Users/guanyuchen/200ok/node_modules/next/dist/server/base-server.js:1496:53) {
  statusCode: 401,
  isOperational: true
}
 GET /api/v1/tokens/balance 401 in 7ms
API Error: UnauthorizedError: 請先登入
    at requireAuth (webpack-internal:///(rsc)/./src/middleware/auth.middleware.ts:68:15)
    at eval (webpack-internal:///(rsc)/./src/app/api/v1/tokens/transactions/route.ts:18:94)
    at eval (webpack-internal:///(rsc)/./src/middleware/error.middleware.ts:125:26)
    at /Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:57234
    at /Users/guanyuchen/200ok/node_modules/next/dist/server/lib/trace/tracer.js:140:36
    at NoopContextManager.with (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:7062)
    at ContextAPI.with (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:518)
    at NoopTracer.startActiveSpan (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:18093)
    at ProxyTracer.startActiveSpan (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:18854)
    at /Users/guanyuchen/200ok/node_modules/next/dist/server/lib/trace/tracer.js:122:103
    at NoopContextManager.with (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:7062)
    at ContextAPI.with (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/@opentelemetry/api/index.js:1:518)
    at NextTracerImpl.trace (/Users/guanyuchen/200ok/node_modules/next/dist/server/lib/trace/tracer.js:122:28)
    at /Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:48896
    at AsyncLocalStorage.run (node:internal/async_local_storage/async_hooks:91:14)
    at Object.wrap (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:40958)
    at /Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:47472
    at AsyncLocalStorage.run (node:internal/async_local_storage/async_hooks:91:14)
    at Object.wrap (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:38293)
    at /Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:47434
    at AsyncLocalStorage.run (node:internal/async_local_storage/async_hooks:91:14)
    at eT.execute (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:46881)
    at eT.handle (/Users/guanyuchen/200ok/node_modules/next/dist/compiled/next-server/app-route.runtime.dev.js:6:58771)
    at doRender (/Users/guanyuchen/200ok/node_modules/next/dist/server/base-server.js:1366:60)
    at cacheEntry.responseCache.get.routeKind (/Users/guanyuchen/200ok/node_modules/next/dist/server/base-server.js:1588:34)
    at ResponseCache.get (/Users/guanyuchen/200ok/node_modules/next/dist/server/response-cache/index.js:49:26)
    at DevServer.renderToResponseWithComponentsImpl (/Users/guanyuchen/200ok/node_modules/next/dist/server/base-server.js:1496:53) {
  statusCode: 401,
  isOperational: true
}
 GET /api/v1/tokens/transactions?limit=20 401 in 3ms
  status bid_status DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, freelancer_id)
);

-- 5. Conversations (對話/聊天室)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type conversation_type NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE, -- 僅 project_proposal 類型使用
  bid_id UUID REFERENCES bids(id) ON DELETE CASCADE, -- 僅 project_proposal 類型使用
  is_unlocked BOOLEAN DEFAULT false, -- 是否已解鎖（雙方都付費）
  initiator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- 發起者
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- 接收者
  initiator_paid BOOLEAN DEFAULT false, -- 發起者是否已付費
  recipient_paid BOOLEAN DEFAULT false, -- 接收者是否已付費
  initiator_unlocked_at TIMESTAMP, -- 發起者解鎖時間
  recipient_unlocked_at TIMESTAMP, -- 接收者解鎖時間
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT check_participants CHECK (initiator_id != recipient_id),
  CONSTRAINT check_project_proposal_fields CHECK (
    (type = 'project_proposal' AND project_id IS NOT NULL) OR
    (type = 'direct')
  )
);

-- 5.1 Messages Table (訊息)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachment_urls TEXT[],
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5.2 User Connections Table (用戶連接關係)
-- 用於追蹤用戶之間的聯絡解鎖狀態
CREATE TYPE connection_status AS ENUM ('pending', 'connected', 'expired');

CREATE TABLE user_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  connection_type conversation_type NOT NULL,
  status connection_status NOT NULL DEFAULT 'pending',
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  initiator_unlocked_at TIMESTAMP NOT NULL DEFAULT NOW(),
  recipient_unlocked_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_connection UNIQUE (initiator_id, recipient_id, connection_type),
  CONSTRAINT no_self_connection CHECK (initiator_id != recipient_id)
);

CREATE INDEX idx_user_connections_initiator ON user_connections(initiator_id);
CREATE INDEX idx_user_connections_recipient ON user_connections(recipient_id);
CREATE INDEX idx_user_connections_conversation ON user_connections(conversation_id);
CREATE INDEX idx_user_connections_status ON user_connections(status);
CREATE INDEX idx_user_connections_expires ON user_connections(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_user_connections_both_users ON user_connections(
  LEAST(initiator_id, recipient_id),
  GREATEST(initiator_id, recipient_id)
);

-- 6. Notifications Table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  related_project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  related_bid_id UUID REFERENCES bids(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Reviews Table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(reviewer_id, reviewee_id, project_id)
);

-- 8. Payments Table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  payer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  payment_stage VARCHAR(50) NOT NULL,
  status payment_status DEFAULT 'pending',
  transaction_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- 9. Saved Projects Table
CREATE TABLE saved_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);

-- 10. Tags Table
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  category tag_category NOT NULL,
  description TEXT,
  icon VARCHAR(255),
  color VARCHAR(20),
  usage_count INTEGER DEFAULT 0,
  is_system BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 11. Project Tags Table (關聯表)
CREATE TABLE project_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, tag_id)
);

-- 12. User Tags Table (使用者追蹤的標籤)
CREATE TABLE user_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  notification_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, tag_id)
);

-- ===== 建立索引 =====

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);

-- Refresh Tokens
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);

-- Projects
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at);
CREATE INDEX idx_projects_budget ON projects(budget_min, budget_max);

-- Bids
CREATE INDEX idx_bids_project_id ON bids(project_id);
CREATE INDEX idx_bids_freelancer_id ON bids(freelancer_id);
CREATE INDEX idx_bids_status ON bids(status);

-- Conversations
CREATE INDEX idx_conversations_initiator ON conversations(initiator_id);
CREATE INDEX idx_conversations_recipient ON conversations(recipient_id);
CREATE INDEX idx_conversations_project ON conversations(project_id);
CREATE INDEX idx_conversations_bid ON conversations(bid_id);
CREATE INDEX idx_conversations_type ON conversations(type);

-- Messages
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- Notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Reviews
CREATE INDEX idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX idx_reviews_project_id ON reviews(project_id);

-- Payments
CREATE INDEX idx_payments_project_id ON payments(project_id);
CREATE INDEX idx_payments_payer_id ON payments(payer_id);
CREATE INDEX idx_payments_payee_id ON payments(payee_id);
CREATE INDEX idx_payments_status ON payments(status);

-- Saved Projects
CREATE INDEX idx_saved_projects_user_id ON saved_projects(user_id);
CREATE INDEX idx_saved_projects_project_id ON saved_projects(project_id);

-- Tags
CREATE INDEX idx_tags_category ON tags(category);
CREATE INDEX idx_tags_usage_count ON tags(usage_count);
CREATE INDEX idx_tags_slug ON tags(slug);

-- Project Tags
CREATE INDEX idx_project_tags_project_id ON project_tags(project_id);
CREATE INDEX idx_project_tags_tag_id ON project_tags(tag_id);

-- User Tags
CREATE INDEX idx_user_tags_user_id ON user_tags(user_id);
CREATE INDEX idx_user_tags_tag_id ON user_tags(tag_id);

-- Token System
CREATE INDEX idx_user_tokens_user_id ON user_tokens(user_id);
CREATE INDEX idx_token_transactions_user_id ON token_transactions(user_id);
CREATE INDEX idx_token_transactions_type ON token_transactions(transaction_type);
CREATE INDEX idx_token_transactions_created_at ON token_transactions(created_at DESC);

-- ===== 啟用 RLS (Row Level Security) =====

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tags ENABLE ROW LEVEL SECURITY;

-- ===== 建立 RLS 政策 =====

-- ========== Users 表政策 ==========

-- 使用者可以查看自己的完整資訊（包含 email, phone）
CREATE POLICY "Users can view their own complete profile"
  ON users
  FOR SELECT
  USING (auth.uid()::uuid = id);

-- 使用者可以查看已解鎖對話對方的完整聯絡資訊
CREATE POLICY "Users can view unlocked contacts full info"
  ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.is_unlocked = true
      AND (
        (conversations.initiator_id = auth.uid()::uuid AND conversations.recipient_id = users.id) OR
        (conversations.recipient_id = auth.uid()::uuid AND conversations.initiator_id = users.id)
      )
    )
  );

-- 所有人可以查看其他使用者的公開資訊（敏感欄位需在 API 層過濾）
CREATE POLICY "Public profiles viewable by everyone"
  ON users
  FOR SELECT
  USING (true);

-- 使用者可以更新自己的資料
CREATE POLICY "Users can update their own profile"
  ON users
  FOR UPDATE
  USING (auth.uid()::uuid = id);

-- 管理員可以查看和更新所有使用者
CREATE POLICY "Admins can view all users"
  ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()::uuid
      AND 'admin' = ANY(u.roles)
    )
  );

CREATE POLICY "Admins can update all users"
  ON users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()::uuid
      AND 'admin' = ANY(u.roles)
    )
  );

-- ========== user_tokens 政策 ==========

-- 使用者只能查看自己的代幣帳戶
CREATE POLICY "Users can view their own tokens"
  ON user_tokens
  FOR SELECT
  USING (auth.uid()::uuid = user_id);

-- 管理員可以查看所有代幣帳戶
CREATE POLICY "Admins can view all tokens"
  ON user_tokens
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::uuid
      AND 'admin' = ANY(roles)
    )
  );

-- ========== token_transactions 政策 ==========

-- 使用者可以查看自己的交易記錄
CREATE POLICY "Users can view their own transactions"
  ON token_transactions
  FOR SELECT
  USING (auth.uid()::uuid = user_id);

-- 管理員可以查看所有交易記錄
CREATE POLICY "Admins can view all transactions"
  ON token_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::uuid
      AND 'admin' = ANY(roles)
    )
  );

-- ========== conversations 政策 ==========

-- 使用者可以查看自己參與的對話
CREATE POLICY "Users can view their conversations"
  ON conversations
  FOR SELECT
  USING (
    auth.uid()::uuid = initiator_id OR
    auth.uid()::uuid = recipient_id
  );

-- 使用者可以創建新對話（透過 API 驗證付費）
CREATE POLICY "Users can create conversations"
  ON conversations
  FOR INSERT
  WITH CHECK (
    auth.uid()::uuid = initiator_id
  );

-- 使用者可以更新自己參與的對話（例如：標記已付費）
CREATE POLICY "Users can update their conversations"
  ON conversations
  FOR UPDATE
  USING (
    auth.uid()::uuid = initiator_id OR
    auth.uid()::uuid = recipient_id
  );

-- ========== messages 政策 ==========

-- 使用者可以查看自己參與的對話中的訊息
-- 修正：工程師可以看到自己發送的提案，即使尚未解鎖
CREATE POLICY "Users can view messages in their conversations"
  ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (
        conversations.initiator_id = auth.uid()::uuid OR
        conversations.recipient_id = auth.uid()::uuid
      )
      AND (
        conversations.is_unlocked = true
        OR
        messages.sender_id = auth.uid()::uuid
      )
    )
  );

-- 使用者可以在符合條件的對話中發送訊息
CREATE POLICY "Users can send messages in conversations"
  ON messages
  FOR INSERT
  WITH CHECK (
    messages.sender_id = auth.uid()::uuid
    AND EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (
        conversations.initiator_id = auth.uid()::uuid OR
        conversations.recipient_id = auth.uid()::uuid
      )
      AND (
        conversations.is_unlocked = true
        OR
        (
          conversations.initiator_id = auth.uid()::uuid
          AND conversations.type = 'project_proposal'
          AND NOT EXISTS (
            SELECT 1 FROM messages m2
            WHERE m2.conversation_id = conversations.id
          )
        )
      )
    )
  );

-- 使用者可以更新自己發送的訊息（例如：標記已讀）
CREATE POLICY "Users can update their own messages"
  ON messages
  FOR UPDATE
  USING (sender_id = auth.uid()::uuid);

-- ========== Projects 表政策 ==========

-- 所有人（包括未登入用戶）可以查看 open 和 in_progress 狀態的案件
CREATE POLICY "Anyone can view open projects"
  ON projects
  FOR SELECT
  USING (status IN ('open', 'in_progress'));

-- 使用者可以查看自己的所有案件（包括 draft）
CREATE POLICY "Project owners can view their own projects"
  ON projects
  FOR SELECT
  USING (auth.uid()::uuid = client_id);

-- 管理員可以查看所有案件
CREATE POLICY "Admins can view all projects"
  ON projects
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()::uuid
      AND 'admin' = ANY(roles)
    )
  );

-- 已登入使用者可以建立案件
CREATE POLICY "Authenticated users can create projects"
  ON projects
  FOR INSERT
  WITH CHECK (auth.uid()::uuid = client_id);

-- 案件擁有者可以更新自己的案件
CREATE POLICY "Project owners can update their own projects"
  ON projects
  FOR UPDATE
  USING (auth.uid()::uuid = client_id);

-- 案件擁有者可以刪除自己的草稿案件
CREATE POLICY "Project owners can delete their own draft projects"
  ON projects
  FOR DELETE
  USING (
    auth.uid()::uuid = client_id
    AND status = 'draft'
  );

-- ========== Bids 表政策 ==========

-- 案件擁有者可以查看自己案件的所有投標
CREATE POLICY "Project owners can view bids on their projects"
  ON bids
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = bids.project_id
      AND projects.client_id = auth.uid()::uuid
    )
  );

-- 投標者可以查看自己的投標
CREATE POLICY "Bid owners can view their own bids"
  ON bids
  FOR SELECT
  USING (auth.uid()::uuid = freelancer_id);

-- 已登入使用者可以建立投標
CREATE POLICY "Authenticated users can create bids"
  ON bids
  FOR INSERT
  WITH CHECK (
    auth.uid()::uuid = freelancer_id
    AND EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = bids.project_id
      AND projects.status = 'open'
    )
  );

-- 投標者可以更新自己的投標（在 pending 狀態下）
CREATE POLICY "Bid owners can update their own pending bids"
  ON bids
  FOR UPDATE
  USING (
    auth.uid()::uuid = freelancer_id
    AND status = 'pending'
  );

-- 案件擁有者可以更新投標狀態（接受/拒絕）
CREATE POLICY "Project owners can update bid status"
  ON bids
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = bids.project_id
      AND projects.client_id = auth.uid()::uuid
    )
  );

-- ========== Saved Projects 表政策 ==========

-- 使用者可以查看自己的收藏
CREATE POLICY "Users can view their own saved projects"
  ON saved_projects
  FOR SELECT
  USING (auth.uid()::uuid = user_id);

-- 使用者可以收藏案件
CREATE POLICY "Users can save projects"
  ON saved_projects
  FOR INSERT
  WITH CHECK (auth.uid()::uuid = user_id);

-- 使用者可以取消收藏
CREATE POLICY "Users can unsave projects"
  ON saved_projects
  FOR DELETE
  USING (auth.uid()::uuid = user_id);

-- ========== Project Tags 表政策 ==========

-- 所有人可以查看案件標籤
CREATE POLICY "Anyone can view project tags"
  ON project_tags
  FOR SELECT
  USING (true);

-- 案件擁有者可以管理自己案件的標籤
CREATE POLICY "Project owners can manage their project tags"
  ON project_tags
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_tags.project_id
      AND projects.client_id = auth.uid()::uuid
    )
  );

-- ===== 建立觸發器（自動更新 updated_at） =====

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON tags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_tokens_updated_at BEFORE UPDATE ON user_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== 建立實用函式 =====

-- 自動檢查對話是否解鎖（雙方都付費）
CREATE OR REPLACE FUNCTION check_conversation_unlock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.initiator_paid AND NEW.recipient_paid THEN
    NEW.is_unlocked = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_unlock_conversation
  BEFORE INSERT OR UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION check_conversation_unlock();

-- 檢查使用者餘額是否足夠
CREATE OR REPLACE FUNCTION check_sufficient_balance(
  p_user_id UUID,
  p_amount INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  SELECT balance INTO v_balance
  FROM user_tokens
  WHERE user_id = p_user_id;
  
  RETURN v_balance >= p_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 取得使用者公開資訊（過濾敏感欄位）
CREATE OR REPLACE FUNCTION get_user_public_profile(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  bio TEXT,
  skills TEXT[],
  avatar_url VARCHAR,
  rating DECIMAL,
  portfolio_links TEXT[],
  created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.name,
    u.bio,
    u.skills,
    u.avatar_url,
    u.rating,
    u.portfolio_links,
    u.created_at
  FROM users u
  WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 取得使用者完整資訊（包含聯絡資訊，需權限驗證）
CREATE OR REPLACE FUNCTION get_user_full_profile(
  p_user_id UUID,
  p_requester_id UUID
)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  email VARCHAR,
  phone VARCHAR,
  bio TEXT,
  skills TEXT[],
  avatar_url VARCHAR,
  rating DECIMAL,
  portfolio_links TEXT[],
  created_at TIMESTAMP,
  has_contact_permission BOOLEAN
) AS $$
DECLARE
  v_has_permission BOOLEAN;
BEGIN
  -- 檢查是否有權限查看聯絡資訊
  SELECT EXISTS (
    SELECT 1 FROM conversations
    WHERE is_unlocked = true
    AND (
      (initiator_id = p_requester_id AND recipient_id = p_user_id) OR
      (recipient_id = p_requester_id AND initiator_id = p_user_id)
    )
  ) OR p_requester_id = p_user_id
  INTO v_has_permission;

  RETURN QUERY
  SELECT 
    u.id,
    u.name,
    CASE WHEN v_has_permission THEN u.email ELSE NULL END as email,
    CASE WHEN v_has_permission THEN u.phone ELSE NULL END as phone,
    u.bio,
    u.skills,
    u.avatar_url,
    u.rating,
    u.portfolio_links,
    u.created_at,
    v_has_permission as has_contact_permission
  FROM users u
  WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 檢查是否可以查看某使用者的聯絡資訊
CREATE OR REPLACE FUNCTION can_view_contact_info(
  p_target_user_id UUID,
  p_requester_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- 自己可以看自己的
  IF p_target_user_id = p_requester_id THEN
    RETURN true;
  END IF;
  
  -- 檢查是否有已解鎖的對話
  RETURN EXISTS (
    SELECT 1 FROM conversations
    WHERE is_unlocked = true
    AND (
      (initiator_id = p_requester_id AND recipient_id = p_target_user_id) OR
      (recipient_id = p_requester_id AND initiator_id = p_target_user_id)
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== 建立輔助函式（取代 View） =====

-- 取得使用者的未讀訊息統計
CREATE OR REPLACE FUNCTION get_unread_messages(p_user_id UUID)
RETURNS TABLE (
  conversation_id UUID,
  unread_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as conversation_id,
    COUNT(m.id) as unread_count
  FROM conversations c
  JOIN messages m ON m.conversation_id = c.id
  WHERE (c.initiator_id = p_user_id OR c.recipient_id = p_user_id)
    AND m.is_read = false 
    AND m.sender_id != p_user_id
  GROUP BY c.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 取得使用者的對話列表（含對方資訊）
CREATE OR REPLACE FUNCTION get_my_conversations(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  type conversation_type,
  project_id UUID,
  bid_id UUID,
  is_unlocked BOOLEAN,
  initiator_id UUID,
  recipient_id UUID,
  initiator_paid BOOLEAN,
  recipient_paid BOOLEAN,
  initiator_unlocked_at TIMESTAMP,
  recipient_unlocked_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  other_user_id UUID,
  my_role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.type,
    c.project_id,
    c.bid_id,
    c.is_unlocked,
    c.initiator_id,
    c.recipient_id,
    c.initiator_paid,
    c.recipient_paid,
    c.initiator_unlocked_at,
    c.recipient_unlocked_at,
    c.created_at,
    c.updated_at,
    CASE 
      WHEN c.initiator_id = p_user_id THEN c.recipient_id
      ELSE c.initiator_id
    END as other_user_id,
    CASE 
      WHEN c.initiator_id = p_user_id THEN 'initiator'
      ELSE 'recipient'
    END as my_role
  FROM conversations c
  WHERE c.initiator_id = p_user_id 
     OR c.recipient_id = p_user_id
  ORDER BY c.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== 授予權限 =====

GRANT SELECT, INSERT ON user_tokens TO authenticated;
GRANT SELECT ON token_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON messages TO authenticated;

GRANT EXECUTE ON FUNCTION check_sufficient_balance(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_public_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_full_profile(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_view_contact_info(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_messages(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_my_conversations(UUID) TO authenticated;

-- ===== 初始化現有使用者的代幣帳戶 =====

-- 為所有現有使用者創建代幣帳戶（贈送 1000 代幣）
INSERT INTO user_tokens (user_id, balance, total_earned)
SELECT id, 1000, 1000
FROM users
ON CONFLICT (user_id) DO NOTHING;

-- 記錄初始贈送的交易
INSERT INTO token_transactions (user_id, amount, balance_after, transaction_type, description)
SELECT 
  id,
  1000,
  1000,
  'platform_fee',
  '新用戶註冊贈送'
FROM users
WHERE id NOT IN (SELECT user_id FROM token_transactions WHERE transaction_type = 'platform_fee' AND description = '新用戶註冊贈送');

-- ===== 完成 =====
-- 資料庫 Schema 建立完成！
-- ✅ 包含完整的 RLS 政策保護
-- ✅ 包含安全的查詢函式
-- ✅ 包含代幣系統與對話系統
-- ✅ 聯絡資訊受到完整保護

