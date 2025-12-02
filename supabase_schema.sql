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
  status bid_status DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, freelancer_id)
);

-- 5. Messages Table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachment_urls TEXT[],
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
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

-- Messages
CREATE INDEX idx_messages_project_id ON messages(project_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

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

-- ===== 完成 =====
-- 資料庫 Schema 建立完成！

