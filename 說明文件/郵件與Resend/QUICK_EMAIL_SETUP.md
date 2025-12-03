# 📧 快速設定郵件發送功能

## ⚡ 5 分鐘快速設定

### 步驟 1：註冊 Resend（2 分鐘）

1. 前往 **[https://resend.com/signup](https://resend.com/signup)**
2. 使用 GitHub 或 Email 註冊
3. 驗證您的信箱

### 步驟 2：取得 API Key（1 分鐘）

1. 登入後，前往 **[API Keys](https://resend.com/api-keys)**
2. 點擊 **「Create API Key」**
3. 名稱填入：`200ok-dev` 或 `200ok-production`
4. 權限選擇：**「Sending access」**
5. 點擊 **「Add」**
6. **立即複製** API Key（格式：`re_xxxxxxxxxx`）

⚠️ **重要**：API Key 只會顯示一次，請立即複製！

### 步驟 3：設定環境變數（1 分鐘）

開啟專案根目錄的 `.env` 或 `.env.local` 檔案，更新以下內容：

```env
# ===== Resend 郵件服務 =====
# 從 Resend Dashboard 複製的 API Key
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx

# 寄件者信箱（開發環境可使用 Resend 提供的測試信箱）
EMAIL_FROM=200 OK <onboarding@resend.dev>

# 或使用您自己的域名（需先驗證域名）
# EMAIL_FROM=200 OK <noreply@yourdomain.com>

# 應用程式網址（用於生成驗證連結）
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 步驟 4：測試郵件發送（1 分鐘）

1. **重新啟動開發伺服器**：
   ```bash
   # 按 Ctrl+C 停止伺服器
   npm run dev
   ```

2. **前往註冊頁面**：
   ```
   http://localhost:3000/register
   ```

3. **註冊新帳號**：
   - ⚠️ 使用您註冊 Resend 的信箱（測試模式下只能發送到此信箱）
   - 填寫其他資料並提交

4. **檢查收件匣**：
   - 查看收件匣（可能在垃圾郵件資料夾）
   - 應該會收到一封精美的驗證郵件 ✨

---

## 🎨 郵件視覺設計

我們的郵件模板已經完全符合您的 UI 設計規範：

### 設計元素
- ✅ **主色調**：`#20263e`（深藍色）- 用於 Header 和按鈕
- ✅ **背景色**：`#f5f3ed`（米色）- 整體背景
- ✅ **強調色**：`#c5ae8c`（金色）- 用於次要元素
- ✅ **白色卡片**：郵件主體使用白色背景，與網站一致
- ✅ **圓角設計**：8px 圓角，與按鈕風格一致
- ✅ **專業排版**：清楚的層級結構和間距

### 郵件內容包含
1. **品牌 Header**（深藍色背景）
2. **歡迎訊息**（個人化稱呼）
3. **明確的 CTA 按鈕**（「驗證我的信箱」）
4. **備用文字連結**（複製貼上用）
5. **安全提醒**（24 小時有效期）
6. **品牌 Footer**（聯絡資訊）

---

## 🔍 測試模式 vs 生產模式

### 開發/測試模式（目前）

使用 Resend 提供的測試信箱：
```env
EMAIL_FROM=200 OK <onboarding@resend.dev>
```

**限制**：
- ⚠️ 只能發送到註冊 Resend 帳號的信箱
- ⚠️ 每天最多 100 封
- ⚠️ 不適合真實用戶使用

**優點**：
- ✅ 免費且快速設定
- ✅ 適合開發測試
- ✅ 不需要驗證域名

### 生產模式（推薦用於正式環境）

使用您自己的域名：
```env
EMAIL_FROM=200 OK <noreply@200ok.com>
```

**需要額外步驟**：
1. 驗證域名（設定 DNS 記錄）
2. 參考下方「驗證自訂域名」章節

**優點**：
- ✅ 可發送到任何信箱
- ✅ 更專業的品牌形象
- ✅ 較低的垃圾郵件風險
- ✅ 每月 3,000 封免費額度

---

## 🌐 驗證自訂域名（生產環境必要）

### 前置條件
- 擁有一個域名（例如：`200ok.com`）
- 可以修改 DNS 設定

### 設定步驟

#### 1. 在 Resend 新增域名
1. 前往 **[Domains](https://resend.com/domains)**
2. 點擊 **「Add Domain」**
3. 輸入您的域名：`200ok.com`
4. 點擊 **「Add」**

#### 2. 複製 DNS 記錄
Resend 會顯示需要新增的 DNS 記錄，通常包括：

**驗證記錄（TXT）**：
```
類型：TXT
名稱：@
值：resend-verification=abc123xyz...
```

**郵件記錄（MX）**：
```
類型：MX
名稱：@
值：feedback-smtp.resend.com
優先級：10
```

**DKIM 記錄（TXT）**：
```
類型：TXT
名稱：resend._domainkey
值：p=MIGfMA0GCSqGSIb3DQEBAQUAA4GN...
```

#### 3. 在 DNS 服務商新增記錄

如果您使用 **Cloudflare**：
1. 登入 Cloudflare
2. 選擇您的域名
3. 前往 **DNS** > **Records**
4. 點擊 **「Add record」**
5. 依序新增上述三筆記錄

如果您使用其他 DNS 服務商：
- Google Domains
- Namecheap
- GoDaddy
- AWS Route 53

操作方式類似，前往 DNS 管理頁面新增記錄。

#### 4. 驗證域名
1. 等待 DNS 傳播（通常 5-30 分鐘，最長 48 小時）
2. 回到 Resend Dashboard
3. 在您的域名旁點擊 **「Verify」**
4. 等待驗證完成（顯示綠色勾勾 ✅）

#### 5. 更新環境變數
驗證成功後，更新 `.env`：

```env
# 改用您的域名
EMAIL_FROM=200 OK <noreply@200ok.com>
# 或其他信箱，例如：
# EMAIL_FROM=200 OK <hello@200ok.com>
# EMAIL_FROM=200 OK <no-reply@200ok.com>
```

#### 6. 重新啟動伺服器
```bash
npm run dev
```

---

## 🧪 驗證郵件是否正常發送

### 方法 1：查看終端機日誌
當郵件發送時，終端機會顯示：
```bash
[SEND_EMAIL_SUCCESS] { id: 'xxx', ... }
```

如果失敗：
```bash
[SEND_EMAIL_ERROR] { message: '...' }
```

### 方法 2：查看 Resend Dashboard
1. 前往 **[Emails](https://resend.com/emails)**
2. 查看最近發送的郵件
3. 確認狀態：
   - ✅ **Delivered**：成功送達
   - 🔄 **Queued**：佇列中
   - ⏱️ **Processing**：處理中
   - ❌ **Bounced**：被退回（信箱不存在或已滿）
   - ⚠️ **Complained**：被標記為垃圾郵件

### 方法 3：測試完整流程
1. 註冊新帳號
2. 收到驗證郵件
3. 點擊「驗證我的信箱」按鈕
4. 成功跳轉到驗證成功頁面
5. 確認帳號 `email_verified` 狀態變為 `true`

---

## ❓ 常見問題

### Q1: 為什麼我收不到郵件？

**檢查清單**：
1. ✅ 確認 `.env` 的 `RESEND_API_KEY` 正確
2. ✅ 確認 `EMAIL_FROM` 格式正確
3. ✅ 檢查垃圾郵件資料夾
4. ✅ 確認使用註冊 Resend 的信箱（測試模式）
5. ✅ 前往 Resend Dashboard 查看郵件狀態
6. ✅ 檢查終端機是否有錯誤訊息
7. ✅ 重新啟動開發伺服器

### Q2: API Key 在哪裡？

前往 **[https://resend.com/api-keys](https://resend.com/api-keys)**

### Q3: 測試信箱是什麼？

`onboarding@resend.dev` 是 Resend 提供的測試寄件者信箱，只能發送到您註冊 Resend 的信箱。

### Q4: 如何發送到任何信箱？

需要驗證您自己的域名（參考上方「驗證自訂域名」章節）。

### Q5: 郵件進入垃圾郵件怎麼辦？

**短期解決**：
- 手動標記為「非垃圾郵件」
- 將寄件者加入通訊錄

**長期解決**：
- 驗證自訂域名（設定 SPF、DKIM、DMARC）
- 使用專業的信箱地址（noreply@yourdomain.com）
- 避免頻繁發送（我們已實作 2 分鐘冷卻機制）

### Q6: 免費額度夠用嗎？

Resend 免費方案：
- ✅ 每月 3,000 封郵件
- ✅ 每天 100 封郵件
- ✅ 1 個自訂域名

對於初期專案來說綽綽有餘！

---

## 📊 郵件發送統計

您可以在 Resend Dashboard 查看：
- 📈 發送成功率
- 📉 退信率
- 📧 每日發送量
- ⏱️ 平均發送時間
- 🔍 個別郵件詳情

前往：**[https://resend.com/emails](https://resend.com/emails)**

---

## 🎉 完成！

現在您的郵件系統應該已經可以正常運作了！

### ✅ 功能檢查清單
- [x] 設定 Resend API Key
- [x] 配置寄件者信箱
- [x] 精美的 HTML 郵件模板（符合品牌設計）
- [x] 驗證連結功能
- [x] 2 分鐘重發限制
- [x] 錯誤處理
- [ ] 驗證自訂域名（生產環境）

### 🚀 下一步
1. 測試完整的註冊流程
2. 確認郵件正常收到
3. 檢查郵件設計是否滿意
4. 準備驗證自訂域名（上線前）

### 📞 需要協助？
- [Resend 官方文件](https://resend.com/docs)
- [Resend Discord 社群](https://resend.com/discord)
- 檢查終端機日誌
- 查看 Resend Dashboard

---

**提示**：開發時使用 `onboarding@resend.dev`，正式上線前記得驗證您的域名！

