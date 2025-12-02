# 註冊、登入與個人資料功能實作總結

## ✅ 已完成的功能

### 1. 信箱驗證機制

#### 資料庫層
- **新增資料表**: `email_verification_tokens`
  - 儲存驗證 token，24小時有效期
  - 與 users 表關聯

#### 後端 API
- **POST `/api/v1/auth/verify-email`**: 驗證信箱
- **GET `/api/v1/auth/verify-email?email=xxx`**: 重新發送驗證郵件

#### 服務層更新 (`AuthService`)
- `sendVerificationEmail()`: 生成並發送驗證郵件
- `verifyEmail()`: 驗證 token 並更新使用者狀態
- `resendVerificationEmail()`: 重新發送驗證郵件
- 註冊時自動發送驗證郵件（非阻塞）
- 登入時檢查 `email_verified` 狀態

#### 前端頁面
- **`/verify-email`**: 信箱驗證頁面
  - 自動驗證 token
  - 顯示驗證結果（成功/失敗）
  - 驗證成功後自動跳轉登入頁

---

### 2. 簡化註冊流程

#### 變更內容
- ❌ 移除「選擇身份」步驟（原本的兩步驟流程）
- ✅ 改為單一步驟註冊表單
- ✅ 預設身份為「發案者」(`client`)
- ✅ 使用者可在個人資料頁面自行調整身份

#### 註冊流程
1. 使用者填寫基本資料（姓名、信箱、密碼、手機選填）
2. 提交後顯示「驗證郵件已發送」訊息
3. 使用者前往信箱點擊驗證連結
4. 驗證成功後可登入使用

---

### 3. Navbar 登入狀態管理

#### 已登入狀態
- 顯示「發布案件」按鈕
- 顯示使用者選單（頭像 + 姓名）
- 下拉選單包含：
  - 個人資料
  - 我的案件
  - 我的投標
  - 登出

#### 未登入狀態
- 顯示「登入」按鈕
- 顯示「註冊」按鈕

---

### 4. 個人資料頁面 (`/profile`)

#### 基本資訊區
- 姓名（可編輯）
- 電子郵件（唯讀，顯示驗證狀態）
- 手機號碼（可編輯）

#### 身份選擇
- 使用者可選擇身份（可多選）：
  - 💼 接案工程師
  - 📋 發案者
- 至少需保留一個身份

#### 分區編輯
**💼 工程師資料區**:
- 個人簡介
- 技能專長（可新增/移除標籤）
- 作品集連結（可新增/移除）

**📋 發案者資料區**:
- 公司/個人簡介
- 合作偏好設定（預留擴展空間）

#### 通知提示
- 未驗證信箱時顯示警告訊息
- 可直接重新發送驗證郵件
- 成功/錯誤訊息提示

---

## 🗄️ 資料庫變更

### 新增資料表

```sql
CREATE TABLE email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Users 表欄位
- `email_verified`: 信箱驗證狀態（預設 `false`）
- `roles`: 使用者身份陣列（支援多身份）
- `phone`: 手機號碼
- `bio`: 個人簡介
- `skills`: 技能專長陣列
- `portfolio_links`: 作品集連結陣列

---

## 🔌 API 端點更新

### 認證相關
- ✅ `POST /api/v1/auth/register` - 註冊（自動發送驗證郵件）
- ✅ `POST /api/v1/auth/login` - 登入（需驗證信箱）
- ✅ `POST /api/v1/auth/verify-email` - 驗證信箱
- ✅ `GET /api/v1/auth/verify-email?email=xxx` - 重新發送驗證郵件

### 使用者資料
- ✅ `GET /api/v1/users/me` - 取得個人資料
- ✅ `PUT /api/v1/users/me` - 更新個人資料
  - 支援欄位：`name`, `phone`, `bio`, `skills`, `portfolio_links`, `roles`

---

## 📝 使用流程

### 新使用者註冊流程
1. 訪問 `/register`
2. 填寫基本資料（姓名、信箱、密碼）
3. 提交後顯示「驗證郵件已發送」
4. 前往信箱點擊驗證連結
5. 跳轉至 `/verify-email?token=xxx` 完成驗證
6. 返回 `/login` 登入

### 登入後管理個人資料
1. 點擊 Navbar 右上角的使用者選單
2. 選擇「個人資料」
3. 更新基本資訊
4. 選擇身份（工程師/發案者）
5. 根據身份填寫對應資料：
   - 工程師：簡介、技能、作品集
   - 發案者：公司簡介、合作偏好
6. 點擊「儲存變更」

---

## 🚨 重要提示

### 環境變數設定
需要在 `.env.local` 設定：
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 郵件服務整合
目前郵件發送僅在 console 輸出驗證連結。生產環境需整合：
- SendGrid
- AWS SES
- Resend
- 或其他 SMTP 服務

在 `AuthService.sendVerificationEmail()` 中取消註釋並實作實際郵件發送邏輯。

### Supabase 資料庫更新
執行以下 SQL 來新增 `email_verification_tokens` 資料表：

```sql
CREATE TABLE email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🎨 UI/UX 改善

1. **統一配色**: 使用 `#20263e`（深色）和 `#c5ae8c`（金色）主題
2. **響應式設計**: 所有頁面支援桌機/平板/手機
3. **狀態提示**: 清楚的成功/錯誤/載入狀態
4. **無障礙**: 適當的 label 與 ARIA 屬性
5. **動畫過渡**: 平滑的頁面切換與互動回饋

---

## ✨ 後續可擴展功能

- [ ] 手機號碼驗證（SMS）
- [ ] 忘記密碼功能
- [ ] 社群媒體登入（Google OAuth 已有基礎）
- [ ] 頭像上傳
- [ ] 兩步驟驗證（2FA）
- [ ] 帳號安全設定
- [ ] 通知偏好設定

