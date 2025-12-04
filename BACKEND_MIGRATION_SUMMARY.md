# 200ok 後端分離重構 - 實作總結

## 📋 重構目標

將 Next.js App Router 的 Route Handlers 和 Supabase JS Client 重構為獨立的 FastAPI 後端，直接連接 Supabase Postgres。

### 原本架構
```
Next.js App Router
├── src/app/api/**/route.ts (54+ Route Handlers)
├── src/services/*.service.ts (使用 Supabase JS Client)
└── 透過 Supabase REST API → Postgres (RLS 自動處理)
```

### 新架構
```
Next.js Frontend (UI only)
    ↓ HTTP/JSON API calls
FastAPI Backend (backend/)
├── 直接連接 Supabase Postgres (SQLAlchemy async)
├── 手動實作 RLS 邏輯
└── 可獨立部署到 GCP Cloud Run
```

---

## ✅ 已完成項目

### 1. 後端基礎設施

- ✅ 建立 `backend/` 專案結構
- ✅ 設定 FastAPI application (`app/main.py`)
- ✅ 資料庫連線設定 (`app/db.py`)
  - SQLAlchemy async with asyncpg
  - Connection pooling
  - Session management
- ✅ 環境變數管理 (`app/config.py`)
- ✅ 安全模組 (`app/security.py`)
  - JWT 生成與驗證
  - 密碼雜湊 (bcrypt)
  - RLS 邏輯輔助函數
- ✅ Dependencies (`app/dependencies.py`)
  - `get_current_user` (必須登入)
  - `get_current_user_optional` (可選登入)
  - `RoleChecker` (角色驗證)
  - `PaginationParams` (分頁參數)

### 2. SQLAlchemy Models (對應資料庫 schema)

✅ 建立所有資料表的 ORM models：
- `user.py`: User, UserRole, RefreshToken, EmailVerificationToken
- `project.py`: Project, ProjectStatus, ProjectMode, SavedProject
- `bid.py`: Bid, BidStatus
- `conversation.py`: Conversation, Message, UserConnection, ConnectionStatus
- `token.py`: UserToken, TokenTransaction, TransactionType
- `tag.py`: Tag, TagCategory, ProjectTag, UserTag
- `review.py`: Review
- `payment.py`: Payment, PaymentStatus
- `notification.py`: Notification, NotificationType

### 3. Pydantic Schemas (API 輸入/輸出)

✅ 建立所有 API 的 request/response schemas：
- `common.py`: SuccessResponse, PaginationResponse, ErrorResponse
- `auth.py`: RegisterRequest, LoginRequest, AuthResponse, etc.
- `user.py`: UserPublic, UserProfile, UpdateUserRequest, etc.
- `project.py`: ProjectCreate, ProjectUpdate, ProjectResponse, etc.
- `bid.py`: BidCreate, BidResponse
- `conversation.py`: ConversationResponse, MessageResponse
- `token.py`: TokenBalanceResponse, TokenTransactionResponse, etc.

### 4. API Endpoints (已實作)

#### ✅ Authentication API (`app/api/v1/auth.py`)

| Endpoint | Method | 說明 | 對應原檔案 |
|---------|--------|------|----------|
| `/api/v1/auth/register` | POST | 使用者註冊 | `src/app/api/v1/auth/register/route.ts` |
| `/api/v1/auth/login` | POST | 使用者登入 | `src/app/api/v1/auth/login/route.ts` |
| `/api/v1/auth/refresh` | POST | 刷新 token | `src/app/api/v1/auth/refresh/route.ts` |
| `/api/v1/auth/logout` | POST | 登出 | `src/app/api/v1/auth/logout/route.ts` |
| `/api/v1/auth/verify-email` | POST | 驗證 email | `src/app/api/v1/auth/verify-email/route.ts` |

#### ✅ Projects API (`app/api/v1/projects.py`)

| Endpoint | Method | 說明 | 對應原檔案 | RLS 邏輯 |
|---------|--------|------|----------|---------|
| `/api/v1/projects` | GET | 搜尋案件（含篩選） | `src/app/api/v1/projects/route.ts` | ✅ 未登入看 open/in_progress；已登入看自己+公開；管理員全部 |
| `/api/v1/projects` | POST | 建立案件 | `src/app/api/v1/projects/route.ts` | ✅ client_id = 當前使用者 |
| `/api/v1/projects/{id}` | GET | 取得案件詳情 | `src/app/api/v1/projects/[id]/route.ts` | ✅ 同 list |
| `/api/v1/projects/{id}` | DELETE | 刪除案件 | `src/app/api/v1/projects/[id]/route.ts` | ✅ 必須是擁有者；只能刪 draft |
| `/api/v1/projects/me/list` | GET | 取得我的案件 | `src/app/api/v1/projects/me/route.ts` | ✅ 只查詢自己的 |

### 5. RLS 邏輯實作範例

在 Projects API 中示範了如何將 Supabase RLS policies 轉換成 SQLAlchemy WHERE 條件：

**Supabase RLS Policy:**
```sql
CREATE POLICY "Anyone can view open projects"
  ON projects FOR SELECT
  USING (status IN ('open', 'in_progress'));

CREATE POLICY "Project owners can view their own projects"
  ON projects FOR SELECT
  USING (client_id = auth.uid());
```

**FastAPI 實作:**
```python
if not current_user:
    # 未登入只能看 open/in_progress
    query = query.where(Project.status.in_([ProjectStatus.OPEN, ProjectStatus.IN_PROGRESS]))
else:
    # 已登入可看：公開 + 自己的
    if check_is_admin(current_user.roles):
        pass  # 管理員不限制
    else:
        query = query.where(
            or_(
                Project.status.in_([ProjectStatus.OPEN, ProjectStatus.IN_PROGRESS]),
                Project.client_id == current_user.id
            )
        )
```

### 6. 文件

- ✅ `backend/README.md`: 後端完整說明文件
- ✅ `backend/API_MAPPING.md`: 新舊 API 對應表
- ✅ `backend/env.example`: 環境變數範例
- ✅ `backend/requirements.txt`: Python 依賴清單
- ✅ `BACKEND_MIGRATION_SUMMARY.md`: 本文件

---

## ⏳ 待完成項目

### 1. ✅ API Endpoints 完成狀態 (50+ endpoints)

#### 🎉 已完成所有 API！

**✅ 核心功能 (已完成)**

1. **Users API** (8 endpoints) - `app/api/v1/users.py` ✅
   - GET `/users/{user_id}` - 取得使用者公開資料
   - GET `/users/me/profile` - 取得自己完整資料
   - PUT `/users/me/profile` - 更新自己資料
   - PUT `/users/me/password` - 更新密碼
   - PUT `/users/me/skills` - 更新技能
   - GET `/users/search/freelancers` - 搜尋接案者
   - GET `/users/{user_id}/reviews` - 取得評價
   - GET `/users/{user_id}/stats` - 取得統計

2. **Bids API** (6 endpoints) - `app/api/v1/bids.py` ✅
   - POST `/bids/projects/{project_id}/bids` - 建立投標
   - GET `/bids/projects/{project_id}/bids` - 取得專案投標
   - GET `/bids/me` - 取得我的投標
   - GET `/bids/{bid_id}` - 取得投標詳情
   - POST `/bids/{bid_id}/accept` - 接受投標
   - POST `/bids/{bid_id}/reject` - 拒絕投標

3. **Conversations & Messages API** (7 endpoints) - `app/api/v1/conversations.py` ✅
   - GET `/conversations` - 取得對話列表
   - POST `/conversations/direct` - 建立直接對話 (200 代幣)
   - POST `/conversations/unlock-proposal` - 解鎖提案 (100 代幣)
   - GET `/conversations/{id}` - 取得對話詳情
   - GET `/conversations/{id}/messages` - 取得訊息
   - POST `/conversations/{id}/messages` - 發送訊息
   - GET `/conversations/me/unread-count` - 未讀數

4. **Tokens API** (3 endpoints) - `app/api/v1/tokens.py` ✅
   - GET `/tokens/balance` - 取得餘額
   - GET `/tokens/transactions` - 取得交易記錄
   - POST `/tokens/purchase` - 購買代幣

5. **Reviews API** (2 endpoints) - `app/api/v1/reviews.py` ✅
   - POST `/projects/{project_id}/reviews` - 建立評價
   - GET `/projects/{project_id}/can-review` - 檢查是否可評價

6. **Saved Projects API** (3 endpoints) - `app/api/v1/saved_projects.py` ✅
   - POST `/projects/{project_id}/save` - 收藏案件
   - DELETE `/projects/{project_id}/save` - 取消收藏
   - GET `/projects/saved/list` - 取得收藏清單

7. **Connections API** (2 endpoints) - `app/api/v1/connections.py` ✅
   - GET `/connections` - 取得連接列表
   - GET `/connections/check` - 檢查連接狀態

8. **Tags API** (1 endpoint) - `app/api/v1/tags.py` ✅
   - GET `/tags` - 取得所有標籤

9. **Admin API** (7 endpoints) - `app/api/v1/admin.py` ✅
   - GET `/admin/stats` - 統計資訊
   - GET `/admin/users` - 所有使用者
   - POST `/admin/users/{user_id}/ban` - 封鎖使用者
   - GET `/admin/projects` - 所有專案
   - DELETE `/admin/projects/{project_id}` - 刪除專案
   - GET `/admin/activity` - 活動記錄
   - GET `/admin/tags/stats` - 標籤統計

10. **Projects API Extensions** (3 endpoints) - 已追加到 `projects.py` ✅
    - PUT `/projects/{project_id}` - 更新專案
    - POST `/projects/{project_id}/publish` - 發布專案
    - POST `/projects/{project_id}/cancel` - 取消專案

### 2. 輔助功能

- ⏳ Email 發送功能 (Resend 整合)
  - 註冊驗證郵件
  - 密碼重設郵件
- ⏳ Rate Limiting (使用 slowapi 或類似)
- ⏳ 完整的錯誤處理與 logging
- ⏳ API 文件優化 (Swagger/OpenAPI)

### 3. 測試

- ⏳ Unit tests (pytest)
- ⏳ Integration tests
- ⏳ API endpoint tests

### 4. 資料庫遷移

- ⏳ Alembic migrations 設定
- ⏳ 初始 migration 檔案

### 5. 部署相關

- ⏳ Dockerfile
- ⏳ Docker Compose (本地開發)
- ⏳ Cloud Run 部署設定
- ⏳ CI/CD pipeline

---

## 🚀 如何繼續開發

### 步驟 1: 設定開發環境

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 複製環境變數範例並填入正確值
cp env.example .env
# 編輯 .env，填入 DATABASE_URL, JWT_SECRET 等
```

### 步驟 2: 啟動開發伺服器

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

訪問：
- API: `http://localhost:8000`
- Docs: `http://localhost:8000/docs`

### 步驟 3: 實作下一個 API endpoint

以 Users API 為例：

1. **建立檔案**: `backend/app/api/v1/users.py`

2. **參考範例**: 參考 `auth.py` 和 `projects.py` 的寫法

3. **基本結構**:
```python
"""
Users Endpoints
對應原本的 src/app/api/v1/users/*/route.ts
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from ...db import get_db
from ...dependencies import get_current_user
from ...models.user import User

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me")
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    取得自己的完整資料
    
    原始檔案: src/app/api/v1/users/me/route.ts
    對應 Service: UserService.getUserProfile()
    
    RLS 邏輯: 使用者只能查看自己的完整資料
    """
    # 實作邏輯...
    return {"success": True, "data": {...}}
```

4. **在 main.py 中註冊**:
```python
from .api.v1 import users

app.include_router(users.router, prefix="/api/v1", tags=["users"])
```

5. **測試**: 使用 Swagger UI 或 curl 測試

### 步驟 4: 批次實作

建議按照以下順序批次實作：

1. **Users API** → 測試 → Commit
2. **Bids API** → 測試 → Commit
3. **Conversations API** → 測試 → Commit
4. **Tokens API** → 測試 → Commit
5. 繼續其他...

---

## 📝 重要注意事項

### 1. RLS 邏輯轉換原則

每個 Supabase RLS policy 都要轉換成對應的 WHERE 條件：

| RLS Policy | FastAPI 實作 |
|-----------|-------------|
| `auth.uid() = user_id` | `where(Model.user_id == current_user.id)` |
| `status IN ('open', 'in_progress')` | `where(Model.status.in_([...]))` |
| `EXISTS (SELECT ...)` | 使用 subquery 或 join |
| `OR` 條件 | `where(or_(...))` |
| `AND` 條件 | `where(and_(...))` |

### 2. 保持 API 行為一致

- Request body 欄位名稱要相同
- Response JSON 結構要相同
- HTTP 狀態碼要相同（200, 201, 400, 401, 403, 404, 422）
- 錯誤訊息要相似

### 3. 註解規範

每個 endpoint 都要註解：
```python
"""
[功能描述]

原始檔案: src/app/api/v1/.../route.ts
對應 Service: XxxService.xxxMethod()

RLS 邏輯: [說明權限檢查邏輯]
"""
```

### 4. 環境變數

確保 `.env` 中有：
- `DATABASE_URL`: Supabase Postgres 連線字串
- `JWT_SECRET`: 與前端一致（或前端改用新的）
- `CORS_ORIGINS`: 包含前端 URL

---

## 🎯 最終目標

1. **前端調整**:
   - 將所有 `fetch('/api/v1/...')` 改成 `fetch(process.env.NEXT_PUBLIC_API_BASE_URL + '/api/v1/...')`
   - 保持 request/response 格式不變

2. **後端部署**:
   - 本地開發: `http://localhost:8000`
   - Cloud Run: `https://your-backend.run.app`

3. **可搬遷性**:
   - `backend/` 資料夾可以完整複製到 Dogtor 專案
   - 只需修改 `.env` 即可運行

---

## 📊 進度追蹤

- ✅ 後端基礎設施: 100%
- ✅ Models & Schemas: 100%
- ✅ Auth API: 100% (5/5 endpoints)
- ✅ Projects API: 100% (5/5 示範 endpoints)
- ⏳ Users API: 0% (0/8 endpoints)
- ⏳ Bids API: 0% (0/6 endpoints)
- ⏳ Conversations API: 0% (0/7 endpoints)
- ⏳ Tokens API: 0% (0/3 endpoints)
- ⏳ 其他 API: 0%

**總進度: 約 17%** (10/60+ endpoints)

---

## 🙋 問題與解答

### Q: 為什麼不繼續用 Supabase JS Client？
A: 為了可搬遷性和更好的控制。直連 Postgres 讓後端可以獨立部署到任何地方，不依賴 Supabase 的 REST API。

### Q: RLS 邏輯會不會遺漏？
A: 每個 endpoint 都參考原本的 route.ts 和對應的 RLS policies，確保邏輯一致。可以通過測試驗證。

### Q: 效能如何？
A: 直連 Postgres + Connection Pool 通常比透過 REST API 更快。使用 async SQLAlchemy 確保高並發性能。

### Q: 如何測試？
A: 使用 FastAPI 內建的 Swagger UI (`/docs`) 或編寫 pytest 測試。

---

## 📚 參考資料

- [FastAPI 官方文檔](https://fastapi.tiangolo.com/)
- [SQLAlchemy 2.0 文檔](https://docs.sqlalchemy.org/en/20/)
- [Pydantic 文檔](https://docs.pydantic.dev/)
- 原始專案: `src/app/api/v1/` 和 `src/services/`

---

**建立日期**: 2025-12-04  
**最後更新**: 2025-12-04

