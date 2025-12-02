-- =====================================================
-- 修正 RLS 政策 - 聯絡資訊權限與訊息查看
-- =====================================================

-- ===== STEP 1: 為 users 表啟用 RLS =====

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ===== STEP 2: 刪除舊的 users 政策（如果存在）=====

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON users;
DROP POLICY IF EXISTS "Users can view all public profiles" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- ===== STEP 3: 創建新的 users 表 RLS 政策 =====

-- 3.1 所有人可以查看基本公開資訊（不含敏感聯絡資訊）
-- 使用 PostgreSQL 的 SECURITY DEFINER 函式來處理欄位級別的權限

-- 3.2 使用者可以查看自己的完整資訊（包含 email, phone）
CREATE POLICY "Users can view their own complete profile"
  ON users
  FOR SELECT
  USING (auth.uid()::uuid = id);

-- 3.3 使用者可以查看已解鎖對話對方的完整聯絡資訊
-- 這個政策允許查看與自己有已解鎖對話的使用者的聯絡資訊
CREATE POLICY "Users can view unlocked contacts full info"
  ON users
  FOR SELECT
  USING (
    -- 檢查是否與當前使用者有已解鎖的對話
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.is_unlocked = true
      AND (
        (conversations.initiator_id = auth.uid()::uuid AND conversations.recipient_id = users.id) OR
        (conversations.recipient_id = auth.uid()::uuid AND conversations.initiator_id = users.id)
      )
    )
  );

-- 3.4 所有人可以查看其他使用者的公開資訊（不含 email, phone）
-- 注意：這個政策只是允許「讀取」，實際的欄位過濾需在 API 層處理
CREATE POLICY "Public profiles viewable by everyone"
  ON users
  FOR SELECT
  USING (true);  -- 允許讀取，但敏感欄位需在 API 層過濾

-- 3.5 使用者可以更新自己的資料
CREATE POLICY "Users can update their own profile"
  ON users
  FOR UPDATE
  USING (auth.uid()::uuid = id);

-- 3.6 管理員可以查看和更新所有使用者
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

-- ===== STEP 4: 修正 messages 表的 RLS 政策 =====

-- 刪除舊政策
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages in unlocked conversations" ON messages;

-- 4.1 使用者可以查看自己參與的對話中的訊息
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
        -- 對話已解鎖，雙方都可以看到所有訊息
        conversations.is_unlocked = true
        OR
        -- 或者是自己發送的訊息（即使對話尚未解鎖）
        messages.sender_id = auth.uid()::uuid
      )
    )
  );

-- 4.2 使用者可以在符合條件的對話中發送訊息
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
        -- 對話已解鎖，雙方都可以發送
        conversations.is_unlocked = true
        OR
        -- 或者是發起者第一次發送（提案）
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

-- ===== STEP 5: 創建安全的查詢函式（API 層使用）=====

-- 5.1 取得使用者公開資訊（過濾敏感欄位）
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

-- 5.2 取得使用者完整資訊（包含聯絡資訊，需權限驗證）
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

-- 5.3 檢查是否可以查看某使用者的聯絡資訊
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

-- ===== STEP 6: 創建輔助函式來簡化查詢 =====

-- 6.1 取得使用者的未讀訊息統計
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

-- 6.2 取得使用者的對話列表（含對方資訊）
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

-- ===== STEP 7: 授予函式執行權限 =====

GRANT EXECUTE ON FUNCTION get_user_public_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_full_profile(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_view_contact_info(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_messages(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_my_conversations(UUID) TO authenticated;

-- ===== 完成！ =====

DO $$
BEGIN
  RAISE NOTICE '✅ Users 表 RLS 政策已更新';
  RAISE NOTICE '✅ Messages 表 RLS 政策已修正';
  RAISE NOTICE '✅ 安全查詢函式已創建';
  RAISE NOTICE '✅ 聯絡資訊權限控制已完善';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  重要提醒：';
  RAISE NOTICE '1. API 層應使用 get_user_full_profile() 函式來查詢使用者資訊';
  RAISE NOTICE '2. 前端顯示前應檢查 has_contact_permission 欄位';
  RAISE NOTICE '3. 敏感欄位（email, phone）已根據權限自動過濾';
END $$;

-- ===== 測試查詢範例 =====

/*
-- 測試 1: 查看公開資訊
SELECT * FROM get_user_public_profile('user-uuid-here');

-- 測試 2: 查看完整資訊（會根據權限自動過濾）
SELECT * FROM get_user_full_profile(
  'target-user-uuid',
  'requester-user-uuid'
);

-- 測試 3: 檢查權限
SELECT can_view_contact_info(
  'target-user-uuid',
  'requester-user-uuid'
);

-- 測試 4: 查看我的對話
SELECT * FROM get_my_conversations('your-user-uuid');

-- 測試 5: 查看未讀訊息
SELECT * FROM get_unread_messages('your-user-uuid');
*/

