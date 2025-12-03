# 🔍 Resend 郵件發送診斷報告

## 📋 檢查清單

您提供的配置：
- ✅ EMAIL_FROM: `200 OK <noreply@superb-tutor.com>`
- ✅ 已更新 RESEND_API_KEY

## ⚠️ 常見問題診斷

### 問題 1：域名未驗證 ⭐ **最可能的原因**

如果您使用自己的域名 `noreply@superb-tutor.com`，**必須先在 Resend 完成域名驗證**。

#### ✅ 解決方法：

**選項 A：使用 Resend 測試信箱（立即可用）**
```env
EMAIL_FROM=200 OK <onboarding@resend.dev>
```

**選項 B：驗證您的域名（推薦用於生產環境）**

1. 登入 Resend Dashboard：https://resend.com/domains
2. 點擊「Add Domain」
3. 輸入：`superb-tutor.com`
4. 複製 DNS 記錄到您的域名服務商（如 Cloudflare、GoDaddy）
5. 等待驗證通過（通常 5-30 分鐘）
6. 驗證成功後，才能使用 `noreply@superb-tutor.com`

---

### 問題 2：Vercel 環境變數未設定

#### ✅ 檢查步驟：

1. 登入 Vercel Dashboard
2. 選擇您的專案
3. Settings → Environment Variables
4. 確認以下變數存在且正確：

| 變數名稱 | 範例值 | 環境 |
|---------|--------|------|
| `RESEND_API_KEY` | `re_xxxxxxxxxx` | Production, Preview, Development |
| `EMAIL_FROM` | `200 OK <onboarding@resend.dev>` | Production, Preview, Development |
| `NEXT_PUBLIC_APP_URL` | `https://yourdomain.com` | Production |
| `NEXT_PUBLIC_APP_URL` | `https://preview-xxx.vercel.app` | Preview |

⚠️ **重要**：設定或修改環境變數後，必須**重新部署**！

---

### 問題 3：API Key 權限不足

#### ✅ 檢查步驟：

1. 前往 Resend Dashboard：https://resend.com/api-keys
2. 確認您的 API Key 有 **「Sending access」** 權限
3. 如果不確定，建立新的 API Key：
   - 名稱：`200ok-production`
   - 權限：`Sending access`
   - 複製新的 Key 並更新到 Vercel

---

### 問題 4：錯誤日誌檢查

#### ✅ 查看 Vercel 日誌：

1. Vercel Dashboard → 選擇專案
2. 前往「Deployments」
3. 點擊最新的部署
4. 查看「Functions」標籤
5. 找到 `/api/v1/auth/register` 或相關 API
6. 查看錯誤訊息

常見錯誤訊息：

```javascript
// 域名未驗證
{
  "error": "The domain is not verified"
}

// API Key 無效
{
  "error": "Invalid API key"
}

// 發送地址錯誤
{
  "error": "The 'from' address must be a verified domain"
}
```

---

### 問題 5：環境變數格式錯誤

#### ✅ 正確格式：

```env
# ✅ 正確 - 有角括號
EMAIL_FROM=200 OK <onboarding@resend.dev>

# ✅ 正確 - 只有信箱
EMAIL_FROM=onboarding@resend.dev

# ❌ 錯誤 - 缺少引號或轉義
EMAIL_FROM="200 OK <onboarding@resend.dev>"  # Vercel 不需要引號

# ❌ 錯誤 - 多餘空格
EMAIL_FROM= 200 OK <onboarding@resend.dev>
```

---

## 🚀 快速修復步驟

### 方案 1：立即修復（使用測試信箱）

1. **更新 Vercel 環境變數**：
   ```
   EMAIL_FROM=200 OK <onboarding@resend.dev>
   ```

2. **重新部署**：
   - Vercel Dashboard → Deployments → 右上角「...」→ Redeploy

3. **測試**：
   - 註冊新帳號（使用您註冊 Resend 的信箱）
   - 檢查收件匣

### 方案 2：使用自己的域名（推薦）

1. **在 Resend 驗證域名**：
   - https://resend.com/domains
   - 添加 `superb-tutor.com`
   - 配置 DNS 記錄
   - 等待驗證通過

2. **更新 Vercel 環境變數**：
   ```
   EMAIL_FROM=200 OK <noreply@superb-tutor.com>
   ```

3. **重新部署並測試**

---

## 🧪 本地測試命令

創建一個測試腳本來驗證 Resend 配置：

```bash
# 在專案根目錄執行
node test-resend.js
```

---

## 📞 還是不行？

如果以上步驟都完成了還是無法發送，請提供：

1. **Vercel 錯誤日誌**（Functions 標籤下）
2. **Resend Dashboard 的 Logs**（https://resend.com/logs）
3. **您的域名驗證狀態**截圖

我可以進一步協助診斷！

---

## ✅ 檢查項目總結

- [ ] Resend API Key 已設定且正確
- [ ] EMAIL_FROM 格式正確
- [ ] 如果使用自己的域名，已在 Resend 完成驗證
- [ ] Vercel 環境變數已設定（所有環境）
- [ ] 修改環境變數後已重新部署
- [ ] 查看過 Vercel 和 Resend 的錯誤日誌
- [ ] 本地測試可以成功發送

