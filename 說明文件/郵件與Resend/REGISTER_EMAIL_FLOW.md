# 📧 註冊流程郵件發送確認

## ✅ 郵件發送流程

### 1️⃣ 用戶註冊
```
POST /api/v1/auth/register
```

### 2️⃣ API 處理流程
```typescript
// src/app/api/v1/auth/register/route.ts (第 37 行)
const result = await authService.register(data);
```

### 3️⃣ AuthService.register()
```typescript
// src/services/auth.service.ts (第 78-80 行)
// 發送驗證郵件（不阻塞註冊流程）
this.sendVerificationEmail(user.id, user.email, user.name).catch(error => {
  console.error("[REGISTER_SEND_EMAIL_ERROR]", error);
});
```

**✨ 重點：郵件發送是異步的，不會阻塞註冊流程**
- 即使郵件發送失敗，註冊仍會成功
- 錯誤會記錄在 Console，但不會返回給用戶

### 4️⃣ sendVerificationEmail()
```typescript
// src/services/auth.service.ts (第 330-370 行)
async sendVerificationEmail(userId, email, name) {
  // 1. 生成驗證 token
  const token = crypto.randomBytes(32).toString('hex');
  
  // 2. 儲存到資料庫 (24小時有效)
  await db.insert('email_verification_tokens', { token, ... });
  
  // 3. 生成驗證連結
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;
  
  // 4. 使用 Resend 發送
  const emailResult = await sendVerificationEmail(email, name, verificationUrl);
}
```

### 5️⃣ Resend 發送
```typescript
// src/lib/email.ts (第 15-28 行)
export async function sendEmail({ to, subject, html }) {
  const data = await resend.emails.send({
    from: process.env.EMAIL_FROM || "200 OK <noreply@200ok.com>",
    to: [to],
    subject,
    html,
  });
}
```

---

## 🔍 您目前的配置

根據您的 `.env` 檔案：

```env
NEXT_PUBLIC_APP_URL=https://200ok.superb-tutor.com
EMAIL_FROM=200 OK <noreply@superb-tutor.com>
RESEND_API_KEY=re_xxxxx...
```

### ⚠️ 關鍵檢查點

#### 1. 驗證連結會指向
```
https://200ok.superb-tutor.com/verify-email?token=xxxxx
```
✅ 這個 URL 必須可以訪問

#### 2. 發件人地址
```
200 OK <noreply@superb-tutor.com>
```
⚠️ **必須在 Resend 驗證 `superb-tutor.com` 域名！**

---

## 🧪 測試步驟

### 方法 1：Vercel 生產環境測試

1. **確認 Vercel 環境變數**：
   ```
   RESEND_API_KEY=re_xxxxx
   EMAIL_FROM=200 OK <noreply@superb-tutor.com>
   NEXT_PUBLIC_APP_URL=https://200ok.superb-tutor.com
   ```

2. **註冊新帳號**：
   ```
   https://200ok.superb-tutor.com/register
   ```

3. **檢查 Vercel 日誌**：
   ```
   Vercel Dashboard → Functions → 找 /api/v1/auth/register
   ```
   
   成功的日誌：
   ```
   [EMAIL] 驗證郵件已發送到 user@example.com
   ```
   
   失敗的日誌：
   ```
   [REGISTER_SEND_EMAIL_ERROR] ...
   [SEND_VERIFICATION_EMAIL_ERROR] ...
   [SEND_EMAIL_ERROR] ...
   ```

4. **檢查 Resend Dashboard**：
   ```
   https://resend.com/logs
   ```
   - 查看最近的郵件發送記錄
   - 成功：狀態顯示 "Delivered"
   - 失敗：顯示錯誤原因（如 "Domain not verified"）

### 方法 2：本地測試

1. **啟動開發伺服器**：
   ```bash
   npm run dev
   ```

2. **註冊測試帳號**：
   ```
   http://localhost:3000/register
   ```

3. **查看終端機日誌**：
   ```
   [EMAIL] 驗證郵件已發送到 test@example.com
   ```
   或
   ```
   [REGISTER_SEND_EMAIL_ERROR] The domain is not verified
   ```

---

## 🚨 常見問題排查

### 問題 1：域名未驗證

**症狀**：
```
Error: The domain is not verified
```

**解決方法**：
1. 前往 https://resend.com/domains
2. 點擊「Add Domain」
3. 輸入 `superb-tutor.com`
4. 複製 DNS 記錄：
   ```
   Type: TXT
   Name: @
   Value: resend_verify=xxx
   
   Type: MX
   Name: @
   Value: feedback-smtp.us-east-1.amazonses.com
   Priority: 10
   ```
5. 到您的 DNS 服務商（Cloudflare/GoDaddy）添加記錄
6. 等待驗證（5-30分鐘）

**或使用測試信箱**：
```env
EMAIL_FROM=200 OK <onboarding@resend.dev>
```

### 問題 2：收不到郵件

**檢查順序**：
1. ✅ 垃圾郵件資料夾
2. ✅ Resend Logs（https://resend.com/logs）
3. ✅ Vercel Function Logs
4. ✅ 資料庫是否有 token 記錄

**SQL 查詢**：
```sql
-- 查看最近的驗證 token
SELECT * FROM email_verification_tokens 
ORDER BY created_at DESC 
LIMIT 5;
```

### 問題 3：驗證連結無效

**症狀**：點擊郵件連結後顯示 404 或錯誤

**檢查**：
1. 驗證連結格式：
   ```
   https://200ok.superb-tutor.com/verify-email?token=xxx
   ```

2. 確認頁面存在：
   ```
   src/app/verify-email/page.tsx
   ```

3. Token 是否過期（24小時）

---

## 📝 測試清單

在 Vercel 生產環境：

- [ ] Resend API Key 已設定
- [ ] EMAIL_FROM 已設定
- [ ] NEXT_PUBLIC_APP_URL 已設定為正確域名
- [ ] 如使用自定義域名，已在 Resend 驗證
- [ ] 修改環境變數後已重新部署
- [ ] 註冊新帳號（使用測試信箱）
- [ ] 檢查 Vercel Function Logs
- [ ] 檢查 Resend Dashboard Logs
- [ ] 檢查收件匣（包括垃圾郵件）
- [ ] 測試驗證連結可以正常訪問

---

## 💡 建議

### 開發環境
```env
EMAIL_FROM=200 OK <onboarding@resend.dev>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 生產環境（需驗證域名）
```env
EMAIL_FROM=200 OK <noreply@superb-tutor.com>
NEXT_PUBLIC_APP_URL=https://200ok.superb-tutor.com
```

### Preview 環境
```env
EMAIL_FROM=200 OK <onboarding@resend.dev>
NEXT_PUBLIC_APP_URL=https://preview-xxx.vercel.app
```

---

## 🎯 快速驗證命令

```bash
# 1. 測試 Resend 連接
node test-resend.js

# 2. 檢查環境變數
echo $RESEND_API_KEY
echo $EMAIL_FROM
echo $NEXT_PUBLIC_APP_URL

# 3. 查看最近的部署日誌
vercel logs
```

---

**結論**：✅ 註冊流程**確實會**自動發送驗證郵件，關鍵是確保：
1. Resend API Key 正確
2. 域名已驗證（或使用測試信箱）
3. 環境變數在 Vercel 正確設定
4. 修改後重新部署

