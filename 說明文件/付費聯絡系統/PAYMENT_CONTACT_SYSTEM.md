# 付費聯絡系統實作說明

## 🎯 系統概述

### 兩種聯絡方式

####  1. **直接聯絡** (Direct Contact)
- **費用**：200 代幣
- **功能**：
  - 查看對方完整聯絡方式（個人頁面填寫的資訊）
  - 開通站內文字通訊
- **使用場景**：從使用者個人頁面直接聯絡

#### 2. **案件提案聯絡** (Project Proposal Contact)
- **費用**：雙方各 100 代幣
- **流程**：
  1. **工程師提交提案**：支付 100 代幣
     - 7 日內發案者未回應 → 退回 100 代幣
  2. **發案者查看提案**：支付 100 代幣
     - 雙方都付費後開通聊天室
     - 可查看彼此聯絡方式
- **使用場景**：針對特定案件的提案溝通

---

## 📊 資料庫設計

### 新增 ENUM 類型

```sql
CREATE TYPE conversation_type AS ENUM ('direct', 'project_proposal');
CREATE TYPE transaction_type AS ENUM (
  'unlock_direct_contact',
  'submit_proposal',
  'view_proposal',
  'refund',
  'platform_fee'
);
```

### 代幣系統表

#### user_tokens (使用者代幣)
| 欄位 | 類型 | 說明 |
|------|------|------|
| id | UUID | 主鍵 |
| user_id | UUID | 使用者 ID (UNIQUE) |
| balance | INTEGER | 當前餘額 |
| total_earned | INTEGER | 總獲得 |
| total_spent | INTEGER | 總支出 |
| created_at | TIMESTAMP | 建立時間 |
| updated_at | TIMESTAMP | 更新時間 |

#### token_transactions (代幣交易記錄)
| 欄位 | 類型 | 說明 |
|------|------|------|
| id | UUID | 主鍵 |
| user_id | UUID | 使用者 ID |
| amount | INTEGER | 金額（正數增加，負數減少） |
| balance_after | INTEGER | 交易後餘額 |
| transaction_type | ENUM | 交易類型 |
| reference_id | UUID | 關聯 ID（對話、提案等） |
| description | TEXT | 說明 |
| created_at | TIMESTAMP | 建立時間 |

### 對話系統表

#### conversations (對話/聊天室)
| 欄位 | 類型 | 說明 |
|------|------|------|
| id | UUID | 主鍵 |
| type | conversation_type | direct 或 project_proposal |
| project_id | UUID | 案件 ID (project_proposal 用) |
| bid_id | UUID | 投標 ID (project_proposal 用) |
| is_unlocked | BOOLEAN | 是否已解鎖（雙方都付費） |
| initiator_id | UUID | 發起者 ID |
| recipient_id | UUID | 接收者 ID |
| initiator_paid | BOOLEAN | 發起者是否已付費 |
| recipient_paid | BOOLEAN | 接收者是否已付費 |
| initiator_unlocked_at | TIMESTAMP | 發起者解鎖時間 |
| recipient_unlocked_at | TIMESTAMP | 接收者解鎖時間 |
| created_at | TIMESTAMP | 建立時間 |
| updated_at | TIMESTAMP | 更新時間 |

#### messages (訊息)
| 欄位 | 類型 | 說明 |
|------|------|------|
| id | UUID | 主鍵 |
| conversation_id | UUID | 對話 ID |
| sender_id | UUID | 發送者 ID |
| content | TEXT | 訊息內容 |
| attachment_urls | TEXT[] | 附件 URLs |
| is_read | BOOLEAN | 是否已讀 |
| created_at | TIMESTAMP | 建立時間 |

---

## 🔄 業務流程

### 流程 A：直接聯絡

```
使用者A 查看使用者B的個人頁面
    ↓
點擊「聯絡」按鈕
    ↓
顯示「確認支付 200 代幣解鎖聯絡方式」
    ↓
確認支付（模擬）
    ↓
1. 扣除 200 代幣
2. 創建 conversation (type: 'direct')
3. initiator_paid = true
4. is_unlocked = true
    ↓
可以查看聯絡方式 + 進入聊天室
```

### 流程 B：案件提案聯絡

#### B.1 工程師提交提案

```
工程師瀏覽案件
    ↓
點擊「提交提案」
    ↓
填寫提案內容
    ↓
顯示「確認支付 100 代幣提交提案」
    ↓
確認支付（模擬）
    ↓
1. 扣除 100 代幣
2. 創建 bid
3. 創建 conversation (type: 'project_proposal')
4. initiator_paid = true
5. 發送通知給發案者
    ↓
等待發案者回應
    ↓
[7日內無回應 → 退回 100 代幣]
```

#### B.2 發案者查看提案

```
發案者收到新提案通知
    ↓
查看提案列表
    ↓
點擊「查看提案詳情」
    ↓
顯示「確認支付 100 代幣查看提案」
    ↓
確認支付（模擬）
    ↓
1. 扣除 100 代幣
2. recipient_paid = true
3. is_unlocked = true（雙方都付費）
4. 雙方都可查看聯絡方式
    ↓
可以進入聊天室溝通
```

---

## 💻 前端實作（目前階段）

### 模擬付費彈窗

```typescript
// 確認支付彈窗
const confirmPayment = async (amount: number, purpose: string) => {
  const confirmed = confirm(
    `確認支付 ${amount} 枚代幣來${purpose}？\n\n` +
    `（目前為模擬支付，實際版本將整合金流）`
  );
  return confirmed;
};
```

### 使用範例

#### 1. 直接聯絡按鈕
```tsx
<Button onClick={async () => {
  const confirmed = await confirmPayment(200, "解鎖聯絡方式");
  if (confirmed) {
    // 呼叫 API 解鎖
    await unlockDirectContact(targetUserId);
  }
}}>
  🔒 解鎖聯絡方式 (200 代幣)
</Button>
```

#### 2. 提交提案按鈕
```tsx
<Button onClick={async () => {
  const confirmed = await confirmPayment(100, "提交提案");
  if (confirmed) {
    // 呼叫 API 提交提案
    await submitProposal(projectId, proposalContent);
  }
}}>
  提交提案 (100 代幣)
</Button>
```

#### 3. 查看提案按鈕
```tsx
<Button onClick={async () => {
  const confirmed = await confirmPayment(100, "查看提案詳情");
  if (confirmed) {
    // 呼叫 API 解鎖提案
    await unlockProposal(bidId);
  }
}}>
  查看提案 (100 代幣)
</Button>
```

---

## 🎨 UI 狀態設計

### 聯絡方式顯示

#### 未解鎖狀態
```tsx
<div className="bg-gray-100 p-4 rounded-lg border-2 border-gray-300">
  <div className="flex items-center justify-between mb-3">
    <h3 className="font-semibold text-gray-600">📧 聯絡方式</h3>
    <Badge variant="default">🔒 已鎖定</Badge>
  </div>
  <p className="text-sm text-gray-500 mb-4">
    支付 200 代幣即可查看完整聯絡方式並開通聊天功能
  </p>
  <Button>解鎖聯絡方式 (200 代幣)</Button>
</div>
```

#### 已解鎖狀態
```tsx
<div className="bg-green-50 p-4 rounded-lg border-2 border-green-300">
  <div className="flex items-center justify-between mb-3">
    <h3 className="font-semibold text-green-800">📧 聯絡方式</h3>
    <Badge variant="success">✓ 已解鎖</Badge>
  </div>
  <div className="space-y-2 text-sm">
    <p><strong>Email:</strong> {user.email}</p>
    <p><strong>電話:</strong> {user.phone}</p>
  </div>
  <Button className="mt-4">💬 開始聊天</Button>
</div>
```

### 提案狀態顯示

#### 工程師視角
```tsx
<Badge variant={
  bid.conversation?.initiator_paid && bid.conversation?.recipient_paid
    ? "success"  // 雙方都已付費
    : bid.conversation?.initiator_paid
    ? "info"     // 僅自己付費，等待對方
    : "default"  // 尚未付費
}>
  {status}
</Badge>
```

#### 發案者視角
```tsx
{!bid.conversation?.recipient_paid ? (
  <Button>查看提案 (100 代幣)</Button>
) : (
  <Button variant="success">💬 聊天室</Button>
)}
```

---

## 📝 待實作功能清單

### 後端 API

- [ ] `POST /api/v1/conversations/unlock-direct`
  - 解鎖直接聯絡
  - 扣除 200 代幣
  - 創建 conversation

- [ ] `POST /api/v1/bids/submit`
  - 提交提案
  - 扣除 100 代幣
  - 創建 bid 和 conversation

- [ ] `POST /api/v1/bids/:id/unlock`
  - 解鎖提案查看
  - 扣除 100 代幣
  - 設定 conversation.is_unlocked = true

- [ ] `GET /api/v1/conversations`
  - 取得使用者的所有對話

- [ ] `GET /api/v1/conversations/:id/messages`
  - 取得對話訊息

- [ ] `POST /api/v1/conversations/:id/messages`
  - 發送訊息

- [ ] `GET /api/v1/tokens/balance`
  - 取得代幣餘額

- [ ] `GET /api/v1/tokens/transactions`
  - 取得交易記錄

### 前端頁面

- [ ] `/profile/:id` - 其他使用者個人頁面
  - 顯示聯絡方式鎖定狀態
  - 解鎖聯絡方式按鈕

- [ ] `/projects/:id` - 案件詳情頁
  - 提交提案表單（含付費提示）
  - 提案列表（發案者視角）

- [ ] `/conversations` - 聊天室列表
  - 顯示所有對話
  - 區分「直接聯絡」和「案件聯絡」

- [ ] `/conversations/:id` - 聊天室
  - 訊息列表
  - 發送訊息
  - 顯示聯絡方式（如已解鎖）

- [ ] `/tokens` - 代幣管理頁
  - 顯示餘額
  - 交易記錄
  - 儲值功能（預留）

---

## 🔒 安全性考量

### 付費驗證
- 所有付費操作都需驗證使用者餘額
- 使用資料庫交易確保原子性
- 記錄所有交易以供追溯

### 退款機制
- 7日無回應自動退款
- 使用 cron job 或定時任務檢查
- 退款同樣記錄在 token_transactions

### 防止濫用
- 限制提案數量（例如：每案件每人僅能提交一次）
- 檢查對話是否已存在
- 驗證使用者身份（freelancer 才能提案）

---

## 🚀 下一步開發重點

1. ✅ 資料庫 Schema 設計
2. ✅ 前端 UI 設計
3. ⏳ 實作代幣 Service
4. ⏳ 實作對話 Service
5. ⏳ 實作提案流程
6. ⏳ 實作聊天室前端
7. ⏳ 實作退款機制
8. ⏳ 整合真實金流（未來）

---

## 💡 使用者體驗優化建議

### 代幣餘額不足提示
```tsx
if (balance < requiredAmount) {
  alert(
    `代幣餘額不足！\n\n` +
    `需要：${requiredAmount} 代幣\n` +
    `目前餘額：${balance} 代幣\n\n` +
    `請前往代幣頁面儲值。`
  );
  router.push('/tokens');
}
```

### 提案狀態通知
- 工程師提交提案 → 發案者收到通知
- 發案者解鎖提案 → 工程師收到通知
- 7日未回應 → 工程師收到退款通知

### 聊天室功能
- 即時訊息（WebSocket）
- 未讀訊息計數
- 訊息通知
- 附件上傳（圖片、文件）

---

## 📊 資料遷移

### 初始化使用者代幣
```sql
-- 為所有現有使用者創建代幣帳戶
INSERT INTO user_tokens (user_id, balance)
SELECT id, 1000 FROM users  -- 贈送 1000 代幣作為初始額度
ON CONFLICT (user_id) DO NOTHING;
```

### 測試資料
```sql
-- 測試用：增加特定使用者代幣
UPDATE user_tokens 
SET balance = balance + 10000 
WHERE user_id = 'your-test-user-id';
```

---

## 📞 聯絡資訊解鎖規則

### 可查看的資訊
- ✅ Email（如使用者填寫）
- ✅ 電話（如使用者填寫）
- ✅ 個人網站（如使用者填寫）
- ✅ 社群媒體連結（如使用者填寫）

### 不可查看的資訊（即使付費）
- ❌ 密碼
- ❌ 系統內部 ID
- ❌ 金流資訊

---

完成！🎉

