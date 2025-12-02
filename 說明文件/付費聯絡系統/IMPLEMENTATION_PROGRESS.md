# 付費聯絡系統實作進度

## ✅ 已完成

### 1. 資料庫設計
- ✅ 新增 `conversation_type` 和 `transaction_type` ENUM
- ✅ 新增 `user_tokens` 表（代幣帳戶）
- ✅ 新增 `token_transactions` 表（交易記錄）
- ✅ 重構 `conversations` 表（支援兩種聯絡類型）
- ✅ 更新 `messages` 表
- ✅ 設定 RLS 政策
- ✅ 創建觸發器和輔助函式

### 2. 後端 Services
- ✅ `TokenService` - 代幣系統
  - 查詢餘額
  - 扣除/增加代幣
  - 交易記錄
  - 退款機制
- ✅ `ConversationService` - 對話系統
  - 創建直接聯絡（200 代幣）
  - 創建提案對話（工程師付 100）
  - 解鎖提案（發案者付 100）
  - 發送訊息（含限制檢查）
  - 取得對話列表
  - 未讀訊息計數

### 3. API 端點
- ✅ `GET /api/v1/tokens/balance` - 查詢代幣餘額
- ✅ `GET /api/v1/tokens/transactions` - 查詢交易記錄
- ✅ `GET /api/v1/conversations` - 對話列表
- ✅ `GET /api/v1/conversations/:id` - 對話詳情
- ✅ `GET /api/v1/conversations/:id/messages` - 訊息列表
- ✅ `POST /api/v1/conversations/:id/messages` - 發送訊息
- ✅ `POST /api/v1/conversations/direct` - 創建直接聯絡
- ✅ `POST /api/v1/conversations/unlock-proposal` - 解鎖提案

---

## 🔄 接下來要實作的前端功能

### 1. 提案表單（支援 Markdown + 聯絡方式檢查）
**位置**: `/src/components/projects/ProposalForm.tsx`

**功能需求**:
- Markdown 編輯器（可使用 `react-markdown` 或 `react-simplemde-editor`）
- 即時預覽
- 禁止包含聯絡方式的檢查：
  - Email 格式
  - 電話號碼
  - 網址（Line, WhatsApp, Telegram 等）
  - 社群媒體帳號
- 提交前驗證
- 模擬付費確認（100 代幣）

**檢查規則範例**:
```typescript
const contactPatterns = [
  /\b[\w\.-]+@[\w\.-]+\.\w{2,}\b/gi,           // Email
  /\b0\d{1,3}[-\s]?\d{3,4}[-\s]?\d{3,4}\b/g,  // 電話
  /\b09\d{8}\b/g,                              // 手機
  /(line|whatsapp|telegram|wechat|ig|facebook|fb)[\s:@]/gi, // 社群
  /https?:\/\/[^\s]+/gi,                       // 網址
];
```

### 2. 提案付費流程（工程師端）
**位置**: `/src/app/projects/[id]/page.tsx`

**流程**:
```typescript
const handleSubmitProposal = async () => {
  // 1. 驗證提案內容（含聯絡方式檢查）
  if (containsContactInfo(proposalContent)) {
    alert("提案內容不得包含任何聯絡方式");
    return;
  }
  
  // 2. 模擬付費確認
  const confirmed = confirm(
    "確認支付 100 代幣提交提案？\n\n" +
    "• 提案將發送給發案者\n" +
    "• 7日內無回應將退回代幣\n" +
    "• 提交後無法修改"
  );
  
  if (!confirmed) return;
  
  // 3. 創建 bid
  const bidResponse = await fetch(`/api/v1/projects/${projectId}/bids`, {
    method: "POST",
    body: JSON.stringify({
      proposal_content: proposalContent,
      proposed_amount: amount,
      estimated_days: days,
    }),
  });
  
  // 4. 創建對話（會自動扣款）
  // 這在 bid API 內部處理
  
  // 5. 發送初始訊息（提案內容）
  await fetch(`/api/v1/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content: proposalContent }),
  });
  
  // 6. 顯示成功訊息
  alert("✅ 提案已提交！已扣除 100 代幣\n等待發案者回應...");
};
```

### 3. 查看提案付費流程（發案者端）
**位置**: `/src/app/projects/[id]/bids/page.tsx`

**UI 設計**:
```tsx
<Card>
  <div className="flex items-center justify-between">
    <div>
      <h3>{freelancer.name}</h3>
      <p>預算：{bid.proposed_amount} 元</p>
      <p>時程：{bid.estimated_days} 天</p>
    </div>
    
    {!bid.conversation?.recipient_paid ? (
      <Button onClick={() => handleUnlockProposal(bid.conversation_id)}>
        🔒 查看提案 (100 代幣)
      </Button>
    ) : (
      <div>
        <Badge variant="success">✓ 已解鎖</Badge>
        <Button onClick={() => router.push(`/conversations/${bid.conversation_id}`)}>
          💬 進入聊天室
        </Button>
      </div>
    )}
  </div>
</Card>
```

### 4. 直接聯絡付費解鎖
**位置**: `/src/app/users/[id]/page.tsx`

**實作**:
```tsx
const handleUnlockContact = async () => {
  const confirmed = confirm(
    "確認支付 200 代幣解鎖聯絡方式？\n\n" +
    "解鎖後您可以：\n" +
    "• 查看對方的聯絡資訊\n" +
    "• 開通站內文字通訊"
  );
  
  if (!confirmed) return;
  
  try {
    const response = await fetch("/api/v1/conversations/direct", {
      method: "POST",
      body: JSON.stringify({ recipient_id: userId }),
    });
    
    if (response.ok) {
      const { data } = await response.json();
      alert("✅ 已解鎖聯絡方式！已扣除 200 代幣");
      router.push(`/conversations/${data.id}`);
    }
  } catch (error) {
    alert("❌ 解鎖失敗");
  }
};
```

### 5. 聊天室列表頁面
**位置**: `/src/app/conversations/page.tsx`

**UI 結構**:
```tsx
<div className="max-w-6xl mx-auto">
  <h1>我的對話</h1>
  
  <div className="grid gap-4">
    {conversations.map(conv => (
      <Card key={conv.id}>
        <div className="flex items-center gap-4">
          <Avatar user={otherUser} />
          <div className="flex-1">
            <h3>{otherUser.name}</h3>
            {conv.type === 'project_proposal' && (
              <p className="text-sm">案件：{conv.project.title}</p>
            )}
            <p className="text-sm text-gray-500">{lastMessage}</p>
          </div>
          <div className="text-right">
            <Badge variant={conv.is_unlocked ? "success" : "default"}>
              {conv.is_unlocked ? "已解鎖" : "等待解鎖"}
            </Badge>
            {unreadCount > 0 && (
              <span className="badge">{unreadCount}</span>
            )}
          </div>
        </div>
      </Card>
    ))}
  </div>
</div>
```

### 6. 聊天室對話頁面
**位置**: `/src/app/conversations/[id]/page.tsx`

**功能**:
- 訊息列表（即時更新）
- 發送訊息輸入框
- 顯示對方聯絡資訊（如已解鎖）
- 提案狀態提示
- 限制提示（工程師提案後等待發案者解鎖）

---

## 📦 需要安裝的套件

```bash
# Markdown 支援
npm install react-markdown remark-gfm rehype-sanitize

# 或使用簡易編輯器
npm install react-simplemde-editor easymde
```

---

## 🔧 輔助工具函式

### 聯絡方式檢查
```typescript
// src/utils/contactDetection.ts
export const contactPatterns = {
  email: /\b[\w\.-]+@[\w\.-]+\.\w{2,}\b/gi,
  phone: /\b0\d{1,3}[-\s]?\d{3,4}[-\s]?\d{3,4}\b/g,
  mobile: /\b09\d{8}\b/g,
  social: /(line|whatsapp|telegram|wechat|ig|instagram|facebook|fb)[\s:@]/gi,
  url: /https?:\/\/[^\s]+/gi,
};

export function containsContactInfo(text: string): boolean {
  return Object.values(contactPatterns).some(pattern => 
    pattern.test(text)
  );
}

export function detectContactInfo(text: string): string[] {
  const detected: string[] = [];
  
  Object.entries(contactPatterns).forEach(([type, pattern]) => {
    const matches = text.match(pattern);
    if (matches) {
      detected.push(`${type}: ${matches.join(', ')}`);
    }
  });
  
  return detected;
}
```

### 模擬付費確認
```typescript
// src/utils/paymentConfirm.ts
export async function confirmPayment(
  amount: number,
  purpose: string,
  details?: string[]
): Promise<boolean> {
  let message = `確認支付 ${amount} 代幣來${purpose}？\n\n`;
  
  if (details && details.length > 0) {
    message += details.map(d => `• ${d}`).join('\n') + '\n\n';
  }
  
  message += '（目前為模擬支付）';
  
  return confirm(message);
}
```

---

## 🎯 下一步行動計畫

1. **安裝 Markdown 套件**
2. **創建聯絡方式檢測工具**
3. **實作提案表單組件**
4. **整合提案付費流程到投標 API**
5. **實作聊天室列表頁面**
6. **實作聊天室對話頁面**
7. **在使用者個人頁面加入直接聯絡按鈕**
8. **測試完整流程**

---

## 🐛 已知問題與注意事項

1. **TokenService 中的 SQL 語法**
   - Supabase JS 不支援 `this.db.raw()`
   - 需要改用 RPC 或直接計算

2. **即時訊息**
   - 目前需要手動刷新
   - 建議後續整合 Supabase Realtime

3. **7日退款機制**
   - 需要設定 cron job 或使用 Supabase Edge Functions

4. **檔案上傳**
   - 訊息目前僅支援文字
   - 需要整合 Supabase Storage

---

完成這些前端功能後，整個付費聯絡系統就可以運作了！

