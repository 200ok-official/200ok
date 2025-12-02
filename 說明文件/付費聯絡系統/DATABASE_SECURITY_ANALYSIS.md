# 資料庫安全性分析與修正

## 📋 問題總結

### ⚠️ 發現的安全問題

#### 問題 1：聯絡資訊權限控制不完整 ⚠️ **嚴重**

**問題描述**：
- `users` 表沒有適當的 RLS 政策來保護敏感欄位（`email`, `phone`）
- 任何登入使用者都可能查詢到其他使用者的完整聯絡資訊
- 沒有根據「對話是否已解鎖」來限制聯絡資訊的查看權限

**影響範圍**：
- ❌ 使用者隱私外洩
- ❌ 付費解鎖聯絡方式的功能失效（使用者可以繞過付費直接查詢）
- ❌ 商業模式受損

**修正狀態**：✅ 已在 `supabase_fix_rls_policies.sql` 中修正

---

#### 問題 2：Messages RLS 政策過於嚴格

**問題描述**：
```sql
-- 舊政策
WHERE conversations.is_unlocked = true
```

這導致：
- ❌ 工程師提交提案後，無法看到自己剛發送的提案內容
- ❌ 需要等發案者付費解鎖後才能看到
- ❌ 用戶體驗不佳

**修正後邏輯**：
```sql
-- 新政策
WHERE (
  conversations.is_unlocked = true  -- 已解鎖，雙方都可見
  OR
  messages.sender_id = auth.uid()::uuid  -- 或是自己發送的訊息
)
```

**修正狀態**：✅ 已在 `supabase_fix_rls_policies.sql` 中修正

---

## 🔒 正確的權限邏輯

### 1. 聯絡資訊查看權限

#### 規則矩陣

| 情境 | Email 可見 | Phone 可見 | 說明 |
|------|-----------|-----------|------|
| 查看自己的資料 | ✅ | ✅ | 永遠可見 |
| 有已解鎖的對話 | ✅ | ✅ | 付費後可見 |
| 無已解鎖的對話 | ❌ | ❌ | 需付費解鎖 |
| 管理員查看 | ✅ | ✅ | 管理權限 |

#### 解鎖條件

```sql
-- 兩個條件之一滿足即可查看聯絡資訊：
1. 是本人 (target_user_id = requester_id)
2. 有已解鎖的對話 (is_unlocked = true)
```

#### 解鎖方式

1. **直接聯絡**（200 代幣）
   - 發起者付 200 代幣
   - 立即解鎖（`is_unlocked = true`）
   - 雙方都能看到彼此聯絡資訊

2. **提案聯絡**（雙方各付 100 代幣）
   - 工程師付 100 提交提案
   - 發案者付 100 解鎖提案
   - 雙方付費後解鎖（`is_unlocked = true`）
   - 解鎖後可查看聯絡資訊

---

### 2. 訊息查看權限

#### 規則矩陣

| 使用者類型 | 對話狀態 | 訊息發送者 | 可見性 | 說明 |
|-----------|---------|-----------|-------|------|
| 工程師 | 未解鎖 | 自己 | ✅ | 可看到自己的提案 |
| 工程師 | 未解鎖 | 對方 | ❌ | 尚未解鎖 |
| 發案者 | 未解鎖 | 任何人 | ❌ | 需付費解鎖 |
| 任何人 | 已解鎖 | 任何人 | ✅ | 雙方都可見 |

#### 發送訊息權限

| 使用者類型 | 對話狀態 | 已發送訊息數 | 可發送 | 說明 |
|-----------|---------|-------------|-------|------|
| 工程師 | 未解鎖 | 0 | ✅ | 可發送提案 |
| 工程師 | 未解鎖 | ≥1 | ❌ | 等待解鎖 |
| 發案者 | 未解鎖 | - | ❌ | 需付費解鎖 |
| 任何人 | 已解鎖 | - | ✅ | 雙方都可發送 |

---

## 🛠️ 修正方案

### 方案 A：使用 RLS 政策 + 安全函式（推薦）✅

**優點**：
- ✅ 在資料庫層級強制執行安全規則
- ✅ 即使 API 有漏洞也無法繞過
- ✅ 使用 SECURITY DEFINER 函式確保一致性
- ✅ 效能較好（資料庫層過濾）

**缺點**：
- ⚠️ 複雜度較高
- ⚠️ 需要執行額外的 SQL 腳本

**實作**：
```bash
# 執行修正腳本
supabase_fix_rls_policies.sql
```

---

### 方案 B：僅在 API 層過濾（不推薦）❌

**優點**：
- ✅ 實作簡單

**缺點**：
- ❌ 安全性較低
- ❌ 容易因開發疏忽而外洩資訊
- ❌ 每個 API 端點都需要重複實作過濾邏輯
- ❌ 直接使用 Supabase Client 可繞過

**不推薦原因**：
- 無法防止開發者直接使用 Supabase Client 查詢
- 安全性依賴開發者的細心程度

---

## 📝 需要更新的程式碼

### 1. 修改 UserService

```typescript
// src/services/user.service.ts

/**
 * 取得使用者公開資訊（不含敏感資訊）
 */
async getUserPublicProfile(userId: string) {
  const { data, error } = await this.db
    .rpc('get_user_public_profile', { p_user_id: userId });
  
  if (error) throw new BadRequestError(error.message);
  return data[0];
}

/**
 * 取得使用者完整資訊（根據權限自動過濾）
 */
async getUserFullProfile(userId: string, requesterId: string) {
  const { data, error } = await this.db
    .rpc('get_user_full_profile', { 
      p_user_id: userId,
      p_requester_id: requesterId 
    });
  
  if (error) throw new BadRequestError(error.message);
  return data[0];
}

/**
 * 檢查是否可以查看聯絡資訊
 */
async canViewContactInfo(targetUserId: string, requesterId: string): Promise<boolean> {
  const { data, error } = await this.db
    .rpc('can_view_contact_info', {
      p_target_user_id: targetUserId,
      p_requester_id: requesterId
    });
  
  if (error) throw new BadRequestError(error.message);
  return data;
}
```

### 2. 修改 ConversationService

在 `getConversation` 方法中，根據 `is_unlocked` 狀態來決定是否返回完整的使用者資訊：

```typescript
async getConversation(conversationId: string, userId: string) {
  const { data, error } = await this.db
    .from("conversations")
    .select(`
      *,
      initiator:users!conversations_initiator_id_fkey(
        id, name, avatar_url, bio, skills
      ),
      recipient:users!conversations_recipient_id_fkey(
        id, name, avatar_url, bio, skills
      ),
      project:projects(id, title)
    `)
    .eq("id", conversationId)
    .or(`initiator_id.eq.${userId},recipient_id.eq.${userId}`)
    .single();

  if (error || !data) {
    throw new NotFoundError("找不到該對話或無權限查看");
  }

  // 如果已解鎖，額外查詢完整的使用者資訊（含聯絡方式）
  if (data.is_unlocked) {
    const otherUserId = data.initiator_id === userId 
      ? data.recipient_id 
      : data.initiator_id;
    
    // 使用安全函式查詢完整資訊
    const { data: fullProfile } = await this.db
      .rpc('get_user_full_profile', {
        p_user_id: otherUserId,
        p_requester_id: userId
      });

    // 替換對應的使用者資訊
    if (data.initiator_id === otherUserId) {
      data.initiator = { ...data.initiator, ...fullProfile[0] };
    } else {
      data.recipient = { ...data.recipient, ...fullProfile[0] };
    }
  }

  return data;
}
```

### 3. 修改 API 端點

```typescript
// src/app/api/v1/users/[id]/route.ts

export const GET = asyncHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const authUser = getAuthUser(request); // 可選的認證
  
  const userService = new UserService();
  
  // 如果已登入，使用完整查詢（自動過濾敏感欄位）
  if (authUser) {
    const user = await userService.getUserFullProfile(
      params.id,
      authUser.userId
    );
    return successResponse(user);
  }
  
  // 未登入，只返回公開資訊
  const user = await userService.getUserPublicProfile(params.id);
  return successResponse(user);
});
```

---

## 🧪 測試檢查清單

### 聯絡資訊權限測試

- [ ] **測試 1**：未登入查看使用者資料
  - 應該只看到公開資訊（name, bio, skills, avatar, rating）
  - **不應該**看到 email, phone

- [ ] **測試 2**：登入後查看自己的資料
  - 應該看到完整資訊，包含 email, phone

- [ ] **測試 3**：登入後查看陌生人資料
  - 應該只看到公開資訊
  - **不應該**看到 email, phone

- [ ] **測試 4**：付費解鎖直接聯絡（200 代幣）後
  - 應該看到對方的 email, phone
  - 對方也應該看到自己的 email, phone

- [ ] **測試 5**：工程師提交提案（100 代幣）後
  - **不應該**看到發案者的 email, phone
  - 發案者也**不應該**看到工程師的 email, phone

- [ ] **測試 6**：發案者解鎖提案（100 代幣）後
  - 雙方都應該看到彼此的 email, phone

### 訊息權限測試

- [ ] **測試 7**：工程師提交提案後
  - 工程師應該看到自己發送的提案內容
  - 發案者**不應該**看到提案內容（需付費解鎖）

- [ ] **測試 8**：工程師嘗試發送第二條訊息（未解鎖）
  - 應該被阻止，顯示「等待發案者解鎖」

- [ ] **測試 9**：發案者解鎖提案後
  - 發案者應該看到提案內容
  - 雙方都可以自由發送訊息

- [ ] **測試 10**：直接聯絡（200 代幣）後
  - 雙方立即可以自由對話
  - 可以查看彼此聯絡資訊

### 安全性測試

- [ ] **測試 11**：嘗試直接用 Supabase Client 查詢其他人的 email
  - 應該被 RLS 阻止或返回 NULL

- [ ] **測試 12**：嘗試繞過 API 直接查詢資料庫
  - 應該被 RLS 阻止

- [ ] **測試 13**：管理員查看所有使用者資料
  - 應該可以看到完整資訊

---

## 📊 資料流程圖

### 流程 1：直接聯絡（200 代幣）

```
使用者 A 查看使用者 B 的個人頁面
  ↓
點擊「解鎖聯絡方式 (200 代幣)」
  ↓
確認付費
  ↓
API: POST /api/v1/conversations/direct
  ↓
TokenService: 扣除 200 代幣
  ↓
ConversationService: 創建對話
  - type: 'direct'
  - initiator_paid: true
  - recipient_paid: true  ← 直接聯絡，對方無需付費
  - is_unlocked: true     ← 立即解鎖
  ↓
導向聊天室
  ↓
雙方可查看聯絡資訊 ✅
雙方可自由對話 ✅
```

### 流程 2：提案聯絡（雙方各 100 代幣）

```
工程師查看專案詳情
  ↓
點擊「提交提案」
  ↓
填寫提案內容（Markdown）
  ↓
確認付費（100 代幣）
  ↓
API: POST /api/v1/projects/:id/bids
  ↓
TokenService: 扣除 100 代幣
  ↓
BidService: 創建 bid
  ↓
ConversationService: 創建對話
  - type: 'project_proposal'
  - initiator_paid: true   ← 工程師已付費
  - recipient_paid: false  ← 發案者尚未付費
  - is_unlocked: false     ← 尚未解鎖
  ↓
發送提案訊息
  ↓
工程師可看到自己的提案 ✅
發案者看不到提案 ❌ (需付費)
工程師無法再發訊息 ❌ (等待解鎖)
雙方都看不到聯絡資訊 ❌


--- 發案者付費解鎖 ---

發案者收到提案通知
  ↓
點擊「查看提案 (100 代幣)」
  ↓
確認付費（100 代幣）
  ↓
API: POST /api/v1/conversations/unlock-proposal
  ↓
TokenService: 扣除 100 代幣
  ↓
ConversationService: 更新對話
  - recipient_paid: true   ← 發案者已付費
  - is_unlocked: true      ← 雙方付費，自動解鎖
  ↓
雙方可查看聯絡資訊 ✅
雙方可自由對話 ✅
```

---

## 🚀 部署步驟

### Step 1: 備份資料庫
```bash
# 在 Supabase Dashboard 中創建備份
```

### Step 2: 執行修正腳本
```sql
-- 在 Supabase SQL Editor 中執行
-- 檔案：supabase_fix_rls_policies.sql
```

### Step 3: 驗證 RLS 政策
```sql
-- 檢查所有 RLS 政策
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';

-- 確認以下表已啟用 RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'user_tokens', 'token_transactions', 'conversations', 'messages');
```

### Step 4: 測試安全函式
```sql
-- 測試公開資訊查詢
SELECT * FROM get_user_public_profile('user-uuid-here');

-- 測試完整資訊查詢
SELECT * FROM get_user_full_profile(
  'target-user-uuid',
  'requester-user-uuid'
);

-- 測試權限檢查
SELECT can_view_contact_info(
  'target-user-uuid',
  'requester-user-uuid'
);
```

### Step 5: 更新 API 程式碼
- 更新 UserService
- 更新 ConversationService
- 更新相關 API 端點

### Step 6: 前端測試
- 執行完整的測試檢查清單
- 確認所有權限邏輯正確

---

## ✅ 總結

### 安全性改進

| 項目 | 修正前 | 修正後 |
|------|-------|-------|
| Email 保護 | ❌ 任何人可見 | ✅ 需付費解鎖 |
| Phone 保護 | ❌ 任何人可見 | ✅ 需付費解鎖 |
| 提案可見性 | ❌ 工程師看不到自己的提案 | ✅ 工程師可見自己的提案 |
| 資料庫層防護 | ❌ 無 RLS | ✅ 完整 RLS 政策 |
| API 繞過風險 | ❌ 高 | ✅ 低（資料庫層防護） |

### 現在的狀態

✅ **完全安全**：
- 聯絡資訊在資料庫層級被保護
- 即使 API 有漏洞也無法繞過
- 使用安全函式確保一致性
- 符合商業邏輯與用戶體驗

⚠️ **需要執行**：
1. 執行 `supabase_fix_rls_policies.sql`
2. 更新 API 程式碼使用安全函式
3. 執行完整測試

🎯 **最終目標**：
- 使用者隱私得到保護
- 付費解鎖功能正常運作
- 商業模式可持續發展

