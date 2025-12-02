# User Connections 完整實施指南

## 📋 實施步驟

### Step 1: 在 Supabase 建立表和函數

執行以下 SQL 腳本（依序）：

```bash
# 1. 創建 user_connections 表、ENUM 和函數
supabase_add_user_connections.sql

# 2. 遷移現有對話資料（如果有）
supabase_migrate_existing_conversations.sql
```

在 Supabase Dashboard：
1. 前往 **SQL Editor**
2. 點擊 **New Query**
3. 複製 `supabase_add_user_connections.sql` 內容並執行
4. 如果有現有資料，再執行 `supabase_migrate_existing_conversations.sql`

---

### Step 2: 後端服務更新

✅ **已完成的更新**：

1. **`ConnectionService`** (`/src/services/connection.service.ts`)
   - ✅ `areUsersConnected()` - 檢查是否已連接
   - ✅ `getConnectionStatus()` - 獲取連接詳情
   - ✅ `createConnection()` - 創建新連接
   - ✅ `unlockConnection()` - 解鎖連接
   - ✅ `getUserConnections()` - 獲取用戶所有連接
   - ✅ `checkNeedsPayment()` - 檢查是否需要付費

2. **`ConversationService`** (`/src/services/conversation.service.ts`)
   - ✅ `createDirectConversation()` - 創建對話時同步創建連接
   - ✅ `createProposalConversation()` - 提案時創建 pending 連接
   - ✅ `unlockProposal()` - 解鎖時更新連接狀態

3. **API 端點**
   - ✅ `GET /api/v1/connections/check` - 檢查連接狀態
   - ✅ `GET /api/v1/connections` - 獲取連接列表

---

### Step 3: 前端頁面更新

✅ **已完成的更新**：

1. **用戶頁面** (`/src/app/users/[id]/page.tsx`)
   - ✅ 使用 `checkExistingConversation()` 檢查連接狀態
   - ✅ 根據狀態顯示不同按鈕：
     - `connected` → 「💬 開始對話」
     - `pending` → 「⏳ 等待對方回應中...」
     - `null` → 「🔓 解鎖聯絡方式 (200 代幣)」

2. **對話列表頁** (`/src/app/conversations/page.tsx`)
   - ⏳ 待更新：可以顯示連接狀態

3. **對話詳情頁** (`/src/app/conversations/[id]/page.tsx`)
   - ✅ 已加入 Authorization header

---

## 🔄 資料流程

### 直接聯絡流程（200 代幣）

```
用戶 A 點擊「解鎖聯絡」
  ↓
檢查 user_connections 表
  ↓
如果不存在或已過期 → 允許付費
  ↓
POST /api/v1/conversations/direct
  ↓
ConversationService.createDirectConversation()
  ├─ 1. 檢查餘額（200 代幣）
  ├─ 2. 創建 conversation (is_unlocked=true)
  ├─ 3. 扣除代幣
  └─ 4. 創建 user_connection (status=connected)
  ↓
返回 conversation_id
  ↓
導向聊天室
```

### 提案流程（100 + 100 代幣）

#### 工程師提交提案

```
工程師 A 提交提案到專案 P
  ↓
POST /api/v1/conversations
  ↓
ConversationService.createProposalConversation()
  ├─ 1. 檢查餘額（100 代幣）
  ├─ 2. 創建 conversation (is_unlocked=false)
  ├─ 3. 扣除代幣
  └─ 4. 創建 user_connection (status=pending, expires_at=7天後)
  ↓
工程師可以看到「等待對方查看提案」
```

#### 發案者查看提案

```
發案者 B 點擊「查看提案」
  ↓
檢查 user_connections 表
  ↓
status = pending → 需要付費 100 代幣
  ↓
POST /api/v1/conversations/unlock-proposal
  ↓
ConversationService.unlockProposal()
  ├─ 1. 檢查餘額（100 代幣）
  ├─ 2. 更新 conversation (is_unlocked=true)
  ├─ 3. 扣除代幣
  └─ 4. 更新 user_connection (status=connected, expires_at=null)
  ↓
雙方都可以自由對話
```

---

## 🔍 檢查邏輯對照表

### Before（舊邏輯 - 使用 conversations 表）

```typescript
// ❌ 舊方法：需要複雜的查詢
const checkExisting = async () => {
  const response = await fetch('/api/v1/conversations');
  const conversations = await response.json();
  const found = conversations.data.find(conv => 
    conv.type === 'direct' &&
    (conv.user1_id === targetUserId || conv.user2_id === targetUserId)
  );
  return !!found;
};
```

**問題**：
- ❌ 需要取得所有對話再過濾
- ❌ 無法區分 pending/connected 狀態
- ❌ 無法追蹤過期時間
- ❌ 效能較差（需要 JOIN 多個表）

### After（新邏輯 - 使用 user_connections 表）

```typescript
// ✅ 新方法：專門的查詢
const checkConnection = async () => {
  const response = await fetch(
    `/api/v1/connections/check?target_user_id=${targetUserId}&type=direct`
  );
  const { data } = await response.json();
  return data; // { status, conversation_id, ... }
};
```

**優點**：
- ✅ 直接查詢特定關係
- ✅ 清楚的狀態（pending/connected/expired）
- ✅ 包含過期時間
- ✅ 效能優異（專門索引）
- ✅ 語義清晰

---

## 📊 前端使用範例

### 1. 檢查是否需要付費

```typescript
// 用戶頁面
const [connectionStatus, setConnectionStatus] = useState<any>(null);

useEffect(() => {
  const checkConnection = async () => {
    const token = localStorage.getItem('access_token');
    const response = await fetch(
      `/api/v1/connections/check?target_user_id=${targetUserId}&type=direct`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    const { data } = await response.json();
    setConnectionStatus(data);
  };
  
  if (currentUserId && targetUserId) {
    checkConnection();
  }
}, [currentUserId, targetUserId]);
```

### 2. 根據狀態顯示按鈕

```typescript
{connectionStatus?.status === 'connected' ? (
  <Button onClick={() => router.push(`/conversations/${connectionStatus.conversation_id}`)}>
    💬 開始對話
  </Button>
) : connectionStatus?.status === 'pending' ? (
  <div className="text-yellow-600">
    ⏳ 等待對方回應中...
  </div>
) : (
  <Button onClick={handleUnlockContact}>
    🔓 解鎖聯絡方式 (200 代幣)
  </Button>
)}
```

### 3. 付費解鎖後更新狀態

```typescript
const handleUnlockContact = async () => {
  const response = await fetch('/api/v1/conversations/direct', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ recipient_id: targetUserId }),
  });

  if (response.ok) {
    const { data } = await response.json();
    // 重新檢查連接狀態
    await checkConnection();
    router.push(`/conversations/${data.id}`);
  }
};
```

---

## 🗺️ 更新的檔案列表

### 後端服務
1. ✅ `/src/services/connection.service.ts` - 新建
2. ✅ `/src/services/conversation.service.ts` - 更新
3. ✅ `/src/services/token.service.ts` - 更新（JOIN 顯示用戶名）

### API 端點
1. ✅ `/src/app/api/v1/connections/check/route.ts` - 新建
2. ✅ `/src/app/api/v1/connections/route.ts` - 新建

### 前端頁面
1. ✅ `/src/app/users/[id]/page.tsx` - 更新檢查邏輯
2. ✅ `/src/app/conversations/[id]/page.tsx` - 加入 Authorization header
3. ✅ `/src/app/tokens/page.tsx` - 顯示用戶名稱

### 資料庫
1. ✅ `supabase_add_user_connections.sql` - 建表腳本
2. ✅ `supabase_migrate_existing_conversations.sql` - 遷移腳本
3. ✅ `supabase_schema.sql` - 更新主 schema

---

## ✅ 測試清單

### 直接聯絡
- [ ] 第一次訪問用戶頁面 → 顯示「解鎖聯絡」
- [ ] 點擊解鎖 → 扣除 200 代幣
- [ ] 再次訪問用戶頁面 → 顯示「開始對話」
- [ ] 點擊「開始對話」→ 進入聊天室
- [ ] 不會重複扣除代幣

### 提案聯絡
- [ ] 工程師提交提案 → 扣除 100 代幣
- [ ] 創建 pending 連接
- [ ] 發案者查看提案 → 需要付 100 代幣
- [ ] 發案者付費後 → 連接變為 connected
- [ ] 雙方可以自由對話

### 代幣記錄
- [ ] 顯示「解鎖與 XXX 的聯絡」而非 ID
- [ ] 顯示「向 XXX 提交提案」
- [ ] 顯示「查看 XXX 的提案」

### 過期機制
- [ ] 提案 7 天無回應 → 自動標記為 expired
- [ ] 退款 100 代幣給工程師

---

## 🚀 部署清單

### Supabase 設置
1. [ ] 執行 `supabase_add_user_connections.sql`
2. [ ] 執行 `supabase_migrate_existing_conversations.sql`（如有現有資料）
3. [ ] 驗證 RLS 策略已啟用
4. [ ] 測試函數 `are_users_connected`
5. [ ] 測試函數 `get_connection_status`
6. [ ] 測試函數 `get_user_connections`
7. [ ] （可選）設置 pg_cron 定時標記過期連接

### 應用程式部署
1. [ ] 確認所有服務已更新
2. [ ] 確認所有 API 端點已部署
3. [ ] 確認前端頁面已更新
4. [ ] 測試完整流程
5. [ ] 監控錯誤日誌

---

## 🎯 關鍵改進

### Before vs After

| 功能 | Before | After |
|------|--------|-------|
| 檢查已解鎖 | 查詢所有對話再過濾 | 直接查詢 user_connections |
| 狀態管理 | 只有 is_unlocked (boolean) | pending/connected/expired |
| 過期機制 | 無 | 7天自動過期 |
| 查詢效能 | 慢（需 JOIN） | 快（專門索引） |
| 資料一致性 | 依賴 conversations | 獨立追蹤 |
| 顯示用戶名 | 需額外查詢 | JOIN 自動帶出 |

---

完成時間：2025-01-02  
狀態：✅ 已實施並文件化  
測試狀態：⏳ 待測試

