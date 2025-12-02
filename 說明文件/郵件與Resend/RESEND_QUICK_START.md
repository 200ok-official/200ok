# 🚀 Resend 快速設定（5 分鐘）

## 步驟 1: 取得 Resend API Key

1. 註冊/登入 [Resend](https://resend.com)
2. 前往 **API Keys** → 點擊 **Create API Key**
3. 複製 API Key（格式：`re_xxxxxxxxxxxx`）

## 步驟 2: 設定環境變數

在 `.env.local` 新增以下內容：

```env
# Resend 郵件服務
RESEND_API_KEY=re_your_actual_api_key_here
EMAIL_FROM=200 OK <onboarding@resend.dev>

# 應用程式 URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

⚠️ **注意**：
- 開發環境可直接使用 `onboarding@resend.dev`
- 生產環境必須驗證自訂域名並改為 `noreply@yourdomain.com`

## 步驟 3: 重啟開發伺服器

```bash
# 停止目前的伺服器（Ctrl+C）
npm run dev
```

## 步驟 4: 測試郵件功能

1. 前往 `http://localhost:3000/register`
2. 使用您在 Resend 註冊的信箱註冊帳號
3. 檢查信箱收到驗證郵件
4. 點擊驗證連結

✅ 完成！

---

## 📋 已實作功能

### ✅ 郵件發送
- 自動發送驗證郵件（註冊時）
- 精美的 HTML 郵件模板
- 24 小時有效期限

### ✅ 重發限制
- 2 分鐘冷卻時間
- 防止濫用與垃圾郵件
- 友善的倒數提示

### ✅ 錯誤處理
- 清楚的錯誤訊息
- 重發機制
- Dashboard 監控

---

## 🔍 驗證是否正確設定

### 檢查 Console 輸出

註冊時應該看到：

```
[EMAIL] 驗證郵件已發送到 user@example.com
```

### 檢查 Resend Dashboard

1. 前往 [Resend Emails](https://resend.com/emails)
2. 查看最新郵件狀態
3. 確認為 **Delivered**

---

## ⚠️ 常見問題

### Q: 收不到郵件？

1. 檢查垃圾郵件資料夾
2. 確認 `RESEND_API_KEY` 是否正確
3. 使用註冊 Resend 的信箱測試
4. 查看 Resend Dashboard 的郵件狀態

### Q: API Key 無效？

- 確認已複製完整的 API Key（包含 `re_` 前綴）
- 重新生成一個新的 API Key
- 確認沒有多餘的空格

### Q: 想更改冷卻時間？

編輯 `src/services/auth.service.ts`：

```typescript
const cooldownMinutes = 5; // 改為您想要的分鐘數
```

---

## 📚 更多資訊

完整設定指南：[RESEND_SETUP_GUIDE.md](./RESEND_SETUP_GUIDE.md)

需要幫助？查看 [Resend 官方文件](https://resend.com/docs)

