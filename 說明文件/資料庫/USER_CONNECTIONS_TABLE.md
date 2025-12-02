# User Connections Table 使用指南

## 📋 概述

`user_connections` 表用於追蹤和管理用戶之間的聯絡解鎖關係。這是一個**專門的關係表**，與 `conversations` 表分開，用於更清晰地管理用戶連接狀態。

---

## 🗂️ 表結構

### 欄位說明

| 欄位 | 類型 | 說明 |
|------|------|------|
| `id` | UUID | 主鍵 |
| `initiator_id` | UUID | 發起者（首先付費的人） |
| `recipient_id` | UUID | 接收者（被聯絡的人） |
| `connection_type` | ENUM | 連接類型（`direct` 或 `project_proposal`） |
| `status` | ENUM | 連接狀態（`pending`, `connected`, `expired`） |
| `conversation_id` | UUID | 關聯的對話 ID（可為 NULL） |
| `initiator_unlocked_at` | TIMESTAMP | 發起者解鎖時間 |
| `recipient_unlocked_at` | TIMESTAMP | 接收者解鎖時間（NULL 表示尚未解鎖） |
| `expires_at` | TIMESTAMP | 過期時間（7天無回應則過期） |
| `created_at` | TIMESTAMP | 創建時間 |
| `updated_at` | TIMESTAMP | 更新時間 |

### 連接狀態

```typescript
type ConnectionStatus = 
  | 'pending'    // 單方已付費，等待對方回應
  | 'connected'  // 雙方都已付費，完全解鎖
  | 'expired';   // 已過期（7天無回應）
```

---

## 🔄 使用流程

### 1. 直接聯絡流程（200 代幣）

```sql
-- 使用者 A 付費聯絡使用者 B

-- Step 1: 創建連接記錄
INSERT INTO user_connections (
  initiator_id,
  recipient_id,
  connection_type,
  status,
  conversation_id,
  expires_at
) VALUES (
  'user-a-uuid',
  'user-b-uuid',
  'direct',
  'connected',  -- 直接聯絡是單向的，立即 connected
  'conversation-uuid',
  NULL  -- 直接聯絡不過期
);

-- Step 2: 同時創建對話記錄
INSERT INTO conversations (...) VALUES (...);
```

### 2. 專案提案流程（100 + 100 代幣）

```sql
-- 工程師 A 向專案擁有者 B 提交提案

-- Step 1: 工程師付費 100 代幣
INSERT INTO user_connections (
  initiator_id,
  recipient_id,
  connection_type,
  status,
  conversation_id,
  expires_at
) VALUES (
  'engineer-uuid',
  'client-uuid',
  'project_proposal',
  'pending',  -- 等待對方付費
  'conversation-uuid',
  NOW() + INTERVAL '7 days'  -- 7天後過期
);

-- Step 2: 專案擁有者付費 100 代幣查看提案
UPDATE user_connections
SET 
  status = 'connected',
  recipient_unlocked_at = NOW(),
  expires_at = NULL
WHERE id = 'connection-uuid';
```

---

## 🔍 查詢函數

### 1. 檢查兩個用戶是否已連接

```sql
SELECT are_users_connected('user1-uuid', 'user2-uuid', 'direct');
-- 返回: TRUE 或 FALSE
```

### 2. 獲取連接狀態詳情

```sql
SELECT * FROM get_connection_status('user1-uuid', 'user2-uuid', 'direct');
-- 返回連接的完整資訊
```

### 3. 獲取用戶的所有連接

```sql
-- 所有連接
SELECT * FROM get_user_connections('user-uuid');

-- 只看已連接的
SELECT * FROM get_user_connections('user-uuid', 'connected');

-- 只看待處理的
SELECT * FROM get_user_connections('user-uuid', 'pending');
```

### 4. 標記過期連接

```sql
-- 手動執行或由定時任務執行
SELECT mark_expired_connections();
-- 返回: 標記為過期的連接數量
```

---

## 💻 應用程式整合

### 前端檢查是否已解鎖

```typescript
// src/services/connection.service.ts
class ConnectionService extends BaseService {
  async checkConnection(
    currentUserId: string,
    targetUserId: string,
    type: 'direct' | 'project_proposal' = 'direct'
  ): Promise<ConnectionStatus | null> {
    const { data, error } = await this.db
      .rpc('get_connection_status', {
        user1_id: currentUserId,
        user2_id: targetUserId,
        conn_type: type,
      });

    if (error || !data || data.length === 0) {
      return null;
    }

    return data[0];
  }

  async areUsersConnected(
    currentUserId: string,
    targetUserId: string,
    type: 'direct' | 'project_proposal' = 'direct'
  ): Promise<boolean> {
    const { data, error } = await this.db
      .rpc('are_users_connected', {
        user1_id: currentUserId,
        user2_id: targetUserId,
        conn_type: type,
      });

    return !error && data === true;
  }
}
```

### 用戶頁面使用範例

```typescript
// src/app/users/[id]/page.tsx
const [connectionStatus, setConnectionStatus] = useState<any>(null);

useEffect(() => {
  const checkConnection = async () => {
    const connectionService = new ConnectionService();
    const status = await connectionService.checkConnection(
      currentUserId,
      targetUserId,
      'direct'
    );
    setConnectionStatus(status);
  };

  if (currentUserId && targetUserId) {
    checkConnection();
  }
}, [currentUserId, targetUserId]);

// 根據狀態顯示按鈕
{connectionStatus?.status === 'connected' ? (
  <Button onClick={() => router.push(`/conversations/${connectionStatus.conversation_id}`)}>
    💬 開始對話
  </Button>
) : (
  <Button onClick={handleUnlockContact}>
    🔓 解鎖聯絡方式 (200 代幣)
  </Button>
)}
```

### 創建連接時的邏輯

```typescript
// src/services/conversation.service.ts
async createDirectConversation(
  currentUserId: string,
  recipientId: string
): Promise<{ conversation: any; connection: any }> {
  // 1. 檢查是否已存在連接
  const existing = await this.db
    .rpc('get_connection_status', {
      user1_id: currentUserId,
      user2_id: recipientId,
      conn_type: 'direct',
    });

  if (existing.data && existing.data.length > 0) {
    // 已存在，直接返回
    return {
      conversation: { id: existing.data[0].conversation_id },
      connection: existing.data[0],
    };
  }

  // 2. 扣除代幣（200 tokens）
  const tokenService = new TokenService();
  await tokenService.deductTokens(
    currentUserId,
    200,
    'unlock_direct_contact',
    undefined,
    `解鎖與用戶 ${recipientId} 的聯絡`
  );

  // 3. 創建對話
  const { data: conversation } = await this.db
    .from('conversations')
    .insert({
      type: 'direct',
      initiator_id: currentUserId,
      recipient_id: recipientId,
      is_unlocked: true,
      initiator_paid: true,
      recipient_paid: false,
      initiator_unlocked_at: new Date().toISOString(),
    })
    .select()
    .single();

  // 4. 創建連接記錄
  const { data: connection } = await this.db
    .from('user_connections')
    .insert({
      initiator_id: currentUserId,
      recipient_id: recipientId,
      connection_type: 'direct',
      status: 'connected',  // 直接聯絡立即連接
      conversation_id: conversation.id,
      initiator_unlocked_at: new Date().toISOString(),
      recipient_unlocked_at: new Date().toISOString(),  // 直接聯絡雙方都可見
    })
    .select()
    .single();

  return { conversation, connection };
}
```

---

## 🔐 安全性（RLS 策略）

### 已啟用的策略

1. **SELECT**: 只能查看與自己相關的連接
   ```sql
   auth.uid() = initiator_id OR auth.uid() = recipient_id
   ```

2. **INSERT**: 只能創建自己作為發起者的連接
   ```sql
   auth.uid() = initiator_id
   ```

3. **UPDATE**: 只能更新自己相關的連接
   ```sql
   auth.uid() = initiator_id OR auth.uid() = recipient_id
   ```

---

## 🔄 自動化機制

### 觸發器

1. **自動更新 `updated_at`**
   - 每次記錄更新時自動設置

2. **自動連接狀態轉換**
   - 當 `recipient_unlocked_at` 被設置時
   - 自動將 `status` 改為 `'connected'`
   - 清除 `expires_at`

### 定時任務（需手動設置）

```sql
-- 在 Supabase Dashboard 設置 pg_cron
SELECT cron.schedule(
  'mark-expired-connections',
  '0 * * * *',  -- 每小時執行一次
  $$ SELECT mark_expired_connections(); $$
);
```

---

## 📊 與現有系統的關係

### user_connections vs conversations

| 用途 | user_connections | conversations |
|------|------------------|---------------|
| **主要目的** | 追蹤用戶關係狀態 | 管理聊天訊息 |
| **查詢場景** | 檢查是否已解鎖 | 顯示聊天內容 |
| **更新頻率** | 低（只在付費時） | 高（每條訊息） |
| **數據量** | 小 | 大 |
| **查詢效能** | 高（專門索引） | 低（需 JOIN） |

### 推薦使用方式

1. ✅ **檢查是否已解鎖**：查詢 `user_connections`
2. ✅ **顯示聯絡人列表**：查詢 `user_connections`
3. ✅ **顯示聊天內容**：查詢 `conversations` + `messages`
4. ✅ **創建新聯絡**：同時寫入 `user_connections` + `conversations`

---

## 🚀 遷移現有數據

如果你已經有現有的 `conversations` 資料，執行以下遷移：

```sql
-- 從現有 conversations 創建 user_connections
INSERT INTO user_connections (
  initiator_id,
  recipient_id,
  connection_type,
  status,
  conversation_id,
  initiator_unlocked_at,
  recipient_unlocked_at,
  created_at
)
SELECT 
  initiator_id,
  recipient_id,
  type,
  CASE 
    WHEN is_unlocked = true THEN 'connected'::connection_status
    ELSE 'pending'::connection_status
  END,
  id,
  initiator_unlocked_at,
  recipient_unlocked_at,
  created_at
FROM conversations
WHERE NOT EXISTS (
  SELECT 1 FROM user_connections uc
  WHERE (uc.initiator_id = conversations.initiator_id 
         AND uc.recipient_id = conversations.recipient_id)
     OR (uc.initiator_id = conversations.recipient_id 
         AND uc.recipient_id = conversations.initiator_id)
);
```

---

## ✅ 檢查清單

使用前確認：

- [ ] 已執行 `supabase_add_user_connections.sql`
- [ ] 已在 `supabase_schema.sql` 中添加表定義
- [ ] 已創建 `ConnectionService`
- [ ] 已更新所有檢查解鎖狀態的地方使用此表
- [ ] 已更新創建對話的邏輯同時寫入此表
- [ ] 已遷移現有數據（如果有）
- [ ] 已設置定時任務標記過期連接（可選）

---

完成日期：2025-01-02
狀態：✅ 已實作並文件化

