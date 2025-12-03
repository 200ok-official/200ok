# 🔧 Resend 完整配置指南

## 📝 .env 或 .env.local 配置

### ⚠️ 重要：EMAIL_FROM 格式

在 `.env` 文件中，含有特殊字符（如空格、尖括號）的值需要特別處理：

### ❌ 錯誤寫法
```env
EMAIL_FROM=200 OK <noreply@superb-tutor.com>  # 會解析失敗
```

### ✅ 正確寫法（兩種方式）

#### 方式 1：使用雙引號包裹
```env
RESEND_API_KEY=re_6zJwpdNt_EZDQ_LQ8oCDShw6xjF8FsCWp
EMAIL_FROM="200 OK <noreply@superb-tutor.com>"
NEXT_PUBLIC_APP_URL=https://200ok.superb-tutor.com
```

#### 方式 2：只使用信箱（推薦，最簡單）
```env
RESEND_API_KEY=re_6zJwpdNt_EZDQ_LQ8oCDShw6xjF8FsCWp
EMAIL_FROM=noreply@superb-tutor.com
NEXT_PUBLIC_APP_URL=https://200ok.superb-tutor.com
```

在 `src/lib/email.ts` 中會自動添加名稱：
```typescript
from: process.env.EMAIL_FROM || "200 OK <noreply@200ok.com>"
```

---

## 🚨 最關鍵的問題：域名驗證

### ⚠️ 使用 `noreply@superb-tutor.com` **必須**先驗證域名！

#### 選項 A：立即測試（使用 Resend 測試信箱）

```env
RESEND_API_KEY=re_6zJwpdNt_EZDQ_LQ8oCDShw6xjF8FsCWp
EMAIL_FROM="200 OK <onboarding@resend.dev>"
NEXT_PUBLIC_APP_URL=https://200ok.superb-tutor.com
```

**優點**：
- ✅ 立即可用，無需驗證
- ✅ 適合測試

**限制**：
- ⚠️ 只能發送到您註冊 Resend 的信箱
- ⚠️ 每天限制 100 封

#### 選項 B：生產環境（驗證自己的域名）

1. **前往 Resend Dashboard**：
   https://resend.com/domains

2. **添加域名**：
   - 點擊「Add Domain」
   - 輸入：`superb-tutor.com`

3. **配置 DNS 記錄**（在您的 DNS 服務商）：
   
   **記錄 1：域名驗證**
   ```
   Type: TXT
   Name: @ (或留空)
   Value: resend._domainkey.superb-tutor.com
   ```
   
   **記錄 2：SPF**
   ```
   Type: TXT
   Name: @
   Value: v=spf1 include:amazonses.com ~all
   ```
   
   **記錄 3：DKIM**
   ```
   Type: CNAME
   Name: resend._domainkey
   Value: resend._domainkey.amazonses.com
   ```

4. **等待驗證**（通常 5-30 分鐘）

5. **驗證完成後**，使用：
   ```env
   EMAIL_FROM="200 OK <noreply@superb-tutor.com>"
   ```

---

## 📝 完整的 .env 配置範例

### 本地開發環境

```env
# ===== Database (Supabase) =====
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ===== JWT Secret =====
JWT_SECRET=your-jwt-secret-key

# ===== Resend 郵件服務 =====
RESEND_API_KEY=re_6zJwpdNt_EZDQ_LQ8oCDShw6xjF8FsCWp
EMAIL_FROM="200 OK <onboarding@resend.dev>"

# ===== Application URL =====
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ===== NextAuth (Optional) =====
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
```

### Vercel 生產環境

在 Vercel Dashboard → Settings → Environment Variables 設定：

| 變數名稱 | 值 | 適用環境 |
|---------|---|---------|
| `RESEND_API_KEY` | `re_6zJwpdNt_...` | Production, Preview, Development |
| `EMAIL_FROM` | `200 OK <noreply@superb-tutor.com>` | Production |
| `EMAIL_FROM` | `200 OK <onboarding@resend.dev>` | Preview, Development |
| `NEXT_PUBLIC_APP_URL` | `https://200ok.superb-tutor.com` | Production |
| `NEXT_PUBLIC_APP_URL` | `https://preview-xxx.vercel.app` | Preview |

⚠️ **重要**：Vercel 環境變數**不需要**雙引號！

---

## 🧪 測試步驟

### 1. 更新 .env

```env
RESEND_API_KEY=re_6zJwpdNt_EZDQ_LQ8oCDShw6xjF8FsCWp
EMAIL_FROM="200 OK <onboarding@resend.dev>"
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. 測試 Resend 連接

```bash
# 修改 test-resend.js 中的 TEST_EMAIL (第 60 行)
# 改成您註冊 Resend 的信箱

node test-resend.js
```

### 3. 啟動開發伺服器

```bash
npm run dev
```

### 4. 註冊測試

1. 前往：http://localhost:3000/register
2. 使用您註冊 Resend 的信箱註冊
3. 查看終端機日誌：
   ```
   [EMAIL] 驗證郵件已發送到 your@email.com
   ```
4. 檢查收件匣（包括垃圾郵件資料夾）

### 5. 查看 Resend 日誌

https://resend.com/logs

---

## 🚀 Vercel 部署步驟

### 1. 更新 Vercel 環境變數

```bash
# 或使用 Vercel Dashboard GUI
vercel env add RESEND_API_KEY
# 輸入: re_6zJwpdNt_EZDQ_LQ8oCDShw6xjF8FsCWp

vercel env add EMAIL_FROM
# 輸入: 200 OK <onboarding@resend.dev>

vercel env add NEXT_PUBLIC_APP_URL
# 輸入: https://200ok.superb-tutor.com
```

### 2. 重新部署

```bash
vercel --prod
```

或在 Vercel Dashboard：
1. Deployments
2. 最新部署旁的 「...」
3. Redeploy

### 3. 測試生產環境

1. 前往：https://200ok.superb-tutor.com/register
2. 註冊新帳號（使用您註冊 Resend 的信箱）
3. 查看 Vercel Logs：
   - Dashboard → Functions → `/api/v1/auth/register`
4. 查看 Resend Logs：
   - https://resend.com/logs

---

## 🔍 問題排查

### 問題 1：收不到郵件

**檢查順序**：

1. **Resend Logs**
   ```
   https://resend.com/logs
   ```
   - 狀態是 "Delivered"？ → 檢查垃圾郵件
   - 狀態是 "Failed"？ → 查看錯誤訊息

2. **常見錯誤**：
   ```
   "The domain is not verified"
   → 使用 onboarding@resend.dev 或驗證域名
   
   "Invalid API key"
   → 檢查 RESEND_API_KEY 是否正確
   
   "You can only send to verified emails in test mode"
   → 使用註冊 Resend 的信箱測試
   ```

3. **Vercel Function Logs**
   ```
   [SEND_EMAIL_ERROR] ...
   [SEND_VERIFICATION_EMAIL_ERROR] ...
   ```

### 問題 2：驗證連結無效

**檢查**：
1. URL 格式：
   ```
   https://200ok.superb-tutor.com/verify-email?token=xxx
   ```

2. 資料庫 Token：
   ```sql
   SELECT * FROM email_verification_tokens 
   WHERE user_id = 'xxx'
   ORDER BY created_at DESC;
   ```

3. Token 是否過期（24小時）

---

## ✅ 最終檢查清單

### 本地環境
- [ ] .env 中 RESEND_API_KEY 正確
- [ ] EMAIL_FROM 使用雙引號或只用信箱
- [ ] 使用 onboarding@resend.dev（測試）
- [ ] 重啟開發伺服器
- [ ] 執行 `node test-resend.js`
- [ ] 註冊測試成功收到郵件

### Vercel 生產環境
- [ ] Vercel 環境變數已設定（不需引號）
- [ ] EMAIL_FROM 使用 onboarding@resend.dev 或已驗證的域名
- [ ] NEXT_PUBLIC_APP_URL 設定為正確域名
- [ ] 修改後重新部署
- [ ] 查看 Vercel Function Logs
- [ ] 查看 Resend Logs
- [ ] 測試註冊收到郵件

---

## 💡 建議設定

### 開發階段（立即可用）
```env
EMAIL_FROM="200 OK <onboarding@resend.dev>"
```

### 生產環境（需驗證域名）
1. 先使用測試信箱部署
2. 在 Resend 驗證 `superb-tutor.com`
3. 驗證通過後改用：
   ```env
   EMAIL_FROM="200 OK <noreply@superb-tutor.com>"
   ```

---

**快速命令**：
```bash
# 1. 檢查配置
./check-email-config.sh

# 2. 測試 Resend
node test-resend.js

# 3. 啟動開發
npm run dev

# 4. 查看日誌
tail -f .next/trace
```

