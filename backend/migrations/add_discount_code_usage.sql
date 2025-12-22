-- 新增折扣碼使用記錄表
-- 用於記錄用戶使用折扣碼的歷史，確保每個折扣碼每個帳號只能使用一次

CREATE TABLE IF NOT EXISTS discount_code_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    discount_code VARCHAR(50) NOT NULL,
    discount_amount INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 確保同一個用戶不能使用相同的折扣碼兩次
    UNIQUE(user_id, discount_code)
);

-- 建立索引以加速查詢
CREATE INDEX IF NOT EXISTS idx_discount_code_usage_user_id ON discount_code_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_discount_code_usage_code ON discount_code_usage(discount_code);
CREATE INDEX IF NOT EXISTS idx_discount_code_usage_created_at ON discount_code_usage(created_at);

-- 註解
COMMENT ON TABLE discount_code_usage IS '折扣碼使用記錄表';
COMMENT ON COLUMN discount_code_usage.id IS '記錄唯一識別碼';
COMMENT ON COLUMN discount_code_usage.user_id IS '使用者 ID';
COMMENT ON COLUMN discount_code_usage.discount_code IS '使用的折扣碼';
COMMENT ON COLUMN discount_code_usage.discount_amount IS '折扣金額（元）';
COMMENT ON COLUMN discount_code_usage.created_at IS '使用時間';

