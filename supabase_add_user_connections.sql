-- =====================================================
-- 用戶連接關係表（User Connections）
-- 用於追蹤用戶之間的聯絡解鎖狀態
-- =====================================================

-- 1. 創建連接狀態 ENUM
CREATE TYPE connection_status AS ENUM (
  'pending',      -- 單方已付費，等待對方回應
  'connected',    -- 雙方都已付費，完全解鎖
  'expired'       -- 已過期（例如：7天無回應）
);

-- 2. 創建用戶連接表
CREATE TABLE IF NOT EXISTS user_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 發起者（首先付費的人）
  initiator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 接收者（被聯絡的人）
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 連接類型（使用已存在的 conversation_type）
  connection_type conversation_type NOT NULL,
  
  -- 連接狀態
  status connection_status NOT NULL DEFAULT 'pending',
  
  -- 關聯的對話 ID
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  
  -- 發起者解鎖時間
  initiator_unlocked_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- 接收者解鎖時間（NULL 表示尚未解鎖）
  recipient_unlocked_at TIMESTAMP,
  
  -- 過期時間（7天無回應則過期）
  expires_at TIMESTAMP,
  
  -- 時間戳記
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- 確保同一對用戶在同一類型下只能有一個連接
  CONSTRAINT unique_connection UNIQUE (initiator_id, recipient_id, connection_type),
  
  -- 確保不能自己連接自己
  CONSTRAINT no_self_connection CHECK (initiator_id != recipient_id)
);

-- 3. 創建索引以提高查詢效能
CREATE INDEX IF NOT EXISTS idx_user_connections_initiator ON user_connections(initiator_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_recipient ON user_connections(recipient_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_conversation ON user_connections(conversation_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_status ON user_connections(status);
CREATE INDEX IF NOT EXISTS idx_user_connections_expires ON user_connections(expires_at) WHERE expires_at IS NOT NULL;

-- 反向索引（查找時無論誰是發起者）
CREATE INDEX IF NOT EXISTS idx_user_connections_both_users ON user_connections(
  LEAST(initiator_id, recipient_id),
  GREATEST(initiator_id, recipient_id)
);

-- 4. 啟用 RLS
ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;

-- 5. RLS 策略：只能查看與自己相關的連接
CREATE POLICY "Users can view their own connections"
  ON user_connections FOR SELECT
  USING (
    auth.uid() = initiator_id OR 
    auth.uid() = recipient_id
  );

-- 6. RLS 策略：只能創建自己作為發起者的連接
CREATE POLICY "Users can create connections as initiator"
  ON user_connections FOR INSERT
  WITH CHECK (auth.uid() = initiator_id);

-- 7. RLS 策略：只能更新自己相關的連接
CREATE POLICY "Users can update their own connections"
  ON user_connections FOR UPDATE
  USING (
    auth.uid() = initiator_id OR 
    auth.uid() = recipient_id
  );

-- 8. 創建觸發器：自動更新 updated_at
CREATE OR REPLACE FUNCTION update_user_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_connections_updated_at
  BEFORE UPDATE ON user_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_user_connections_updated_at();

-- 9. 創建觸發器：接收者解鎖時自動更新狀態為 connected
CREATE OR REPLACE FUNCTION auto_connect_on_recipient_unlock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.recipient_unlocked_at IS NOT NULL AND OLD.recipient_unlocked_at IS NULL THEN
    NEW.status = 'connected';
    NEW.expires_at = NULL; -- 清除過期時間
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_connect_on_recipient_unlock
  BEFORE UPDATE ON user_connections
  FOR EACH ROW
  EXECUTE FUNCTION auto_connect_on_recipient_unlock();

-- 10. 創建函數：檢查兩個用戶之間是否已連接
CREATE OR REPLACE FUNCTION are_users_connected(
  user1_id UUID,
  user2_id UUID,
  conn_type conversation_type DEFAULT 'direct'
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_connections
    WHERE connection_type = conn_type
      AND status = 'connected'
      AND (
        (initiator_id = user1_id AND recipient_id = user2_id) OR
        (initiator_id = user2_id AND recipient_id = user1_id)
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. 創建函數：獲取連接狀態
CREATE OR REPLACE FUNCTION get_connection_status(
  user1_id UUID,
  user2_id UUID,
  conn_type conversation_type DEFAULT 'direct'
)
RETURNS TABLE (
  connection_id UUID,
  status connection_status,
  conversation_id UUID,
  initiator_id UUID,
  recipient_id UUID,
  initiator_unlocked_at TIMESTAMP,
  recipient_unlocked_at TIMESTAMP,
  created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uc.id,
    uc.status,
    uc.conversation_id,
    uc.initiator_id,
    uc.recipient_id,
    uc.initiator_unlocked_at,
    uc.recipient_unlocked_at,
    uc.created_at
  FROM user_connections uc
  WHERE uc.connection_type = conn_type
    AND (
      (uc.initiator_id = user1_id AND uc.recipient_id = user2_id) OR
      (uc.initiator_id = user2_id AND uc.recipient_id = user1_id)
    )
  ORDER BY uc.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. 創建函數：獲取用戶的所有連接
CREATE OR REPLACE FUNCTION get_user_connections(
  p_user_id UUID,
  p_status connection_status DEFAULT NULL
)
RETURNS TABLE (
  connection_id UUID,
  other_user_id UUID,
  other_user_name TEXT,
  other_user_avatar TEXT,
  connection_type conversation_type,
  status connection_status,
  conversation_id UUID,
  is_initiator BOOLEAN,
  unlocked_at TIMESTAMP,
  created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uc.id,
    CASE 
      WHEN uc.initiator_id = p_user_id THEN uc.recipient_id
      ELSE uc.initiator_id
    END as other_user_id,
    CASE 
      WHEN uc.initiator_id = p_user_id THEN u2.name
      ELSE u1.name
    END as other_user_name,
    CASE 
      WHEN uc.initiator_id = p_user_id THEN u2.avatar_url
      ELSE u1.avatar_url
    END as other_user_avatar,
    uc.connection_type,
    uc.status,
    uc.conversation_id,
    (uc.initiator_id = p_user_id) as is_initiator,
    CASE 
      WHEN uc.initiator_id = p_user_id THEN uc.initiator_unlocked_at
      ELSE uc.recipient_unlocked_at
    END as unlocked_at,
    uc.created_at
  FROM user_connections uc
  LEFT JOIN users u1 ON u1.id = uc.initiator_id
  LEFT JOIN users u2 ON u2.id = uc.recipient_id
  WHERE (uc.initiator_id = p_user_id OR uc.recipient_id = p_user_id)
    AND (p_status IS NULL OR uc.status = p_status)
  ORDER BY uc.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. 創建定時任務：標記過期的連接（需要 pg_cron 擴展）
-- 注意：這需要在 Supabase Dashboard 中手動設置
-- 或者通過應用程式邏輯定期執行

CREATE OR REPLACE FUNCTION mark_expired_connections()
RETURNS INTEGER AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  UPDATE user_connections
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at IS NOT NULL
    AND expires_at < NOW()
    AND recipient_unlocked_at IS NULL;
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 使用範例
-- =====================================================

-- 查詢兩個用戶是否已連接
-- SELECT are_users_connected('user1-uuid', 'user2-uuid', 'direct');

-- 獲取連接詳情
-- SELECT * FROM get_connection_status('user1-uuid', 'user2-uuid', 'direct');

-- 獲取用戶的所有連接
-- SELECT * FROM get_user_connections('user-uuid');

-- 獲取用戶的已連接關係
-- SELECT * FROM get_user_connections('user-uuid', 'connected');

-- 手動標記過期連接
-- SELECT mark_expired_connections();

-- =====================================================
-- 注意事項
-- =====================================================
-- 1. 當用戶付費解鎖時，應該：
--    a. 創建 user_connections 記錄（如果是發起者）
--    b. 更新 recipient_unlocked_at（如果是接收者）
--    c. 創建或更新 conversations 記錄
--
-- 2. 檢查是否已解鎖時，查詢此表而非 conversations 表
--
-- 3. 此表支援：
--    - 直接聯絡（direct）
--    - 專案提案（project_proposal）
--    - 單向 pending 狀態（等待對方回應）
--    - 雙向 connected 狀態（完全解鎖）
--    - 過期狀態（7天無回應）

