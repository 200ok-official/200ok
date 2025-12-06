# 200ok Backend API

獨立的 FastAPI 後端，直接連接 Supabase Postgres，不再使用 Supabase REST API。

## 🏗️ 架構設計

### 原本架構（Next.js Route Handlers）
```
Next.js App Router
├── src/app/api/**/route.ts (Route Handlers)
├── src/services/*.service.ts (使用 Supabase JS Client)
└── Supabase REST API → Postgres (透過 RLS)
```

### 新架構（FastAPI 後端）
```
Next.js Frontend (UI only)
    ↓ HTTP/JSON
FastAPI Backend (backend/)
├── SQLAlchemy → Supabase Postgres (直連)
└── 手動實作 RLS 邏輯
```

## 📁 專案結構

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app 進入點
│   ├── config.py            # 環境變數設定
│   ├── db.py                # 資料庫連線 (SQLAlchemy async + psycopg)
│   ├── security.py          # JWT / 密碼處理 / RLS 輔助函數
│   ├── dependencies.py      # FastAPI Dependencies (get_current_user, 等)
│   ├── models/              # SQLAlchemy ORM models (參考用)
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── project.py
│   │   ├── bid.py
│   │   ├── conversation.py
│   │   ├── token.py
│   │   ├── tag.py
│   │   ├── review.py
│   │   ├── payment.py
│   │   └── notification.py
│   ├── schemas/             # Pydantic schemas (API 輸入/輸出)
│   │   ├── __init__.py
│   │   ├── common.py        # 通用回應格式
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── project.py
│   │   ├── bid.py
│   │   ├── conversation.py
│   │   └── token.py
│   ├── services/            # 業務邏輯服務層
│   │   └── email_service.py # Email 發送服務 (Resend)
│   └── api/
│       ├── __init__.py
│       └── v1/
│           ├── __init__.py
│           ├── auth.py          # 認證相關 endpoints (含 Email 驗證)
│           ├── projects.py      # 專案 endpoints
│           ├── users.py         # 使用者 endpoints
│           ├── bids.py          # 投標 endpoints
│           ├── conversations.py # 對話 endpoints
│           ├── tokens.py        # 代幣系統 endpoints
│           ├── tags.py          # 標籤 endpoints
│           ├── reviews.py       # 評價 endpoints
│           ├── saved_projects.py # 收藏專案 endpoints
│           ├── connections.py   # 使用者連接 endpoints
│           ├── admin.py         # 管理員 endpoints
│           └── test_email.py   # Email 測試 endpoint
├── requirements.txt
├── .env.example
├── .gitignore
├── SETUP.md                 # 詳細設定說明
├── API_MAPPING.md           # API 對應表
└── README.md (本檔案)
```

## 🚀 快速開始

### 0. Python 版本要求

**⚠️ 重要：本專案需要使用 Python 3.10+**

本專案使用 `psycopg` (psycopg3) 作為 PostgreSQL async driver，與 PgBouncer 完全相容。

**手動設定：**
```bash
# 檢查 Python 版本
python3 --version  # 應該顯示 Python 3.10.x

# 如果沒有 Python 3.10，使用 pyenv 安裝：
brew install pyenv
pyenv install 3.10.13
pyenv local 3.10.13

# 或使用 conda
conda create -n backend python=3.10
conda activate backend
```

**詳細說明請參考 `SETUP.md`**

### 1. 安裝依賴

```bash
cd backend
python3.10 -m venv .venv  # 或 python3 -m venv .venv (如果已設定為 3.10)
source .venv/bin/activate  # macOS/Linux
# Windows: .venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
```

**重要設定：**

- `DATABASE_URL`: Supabase Postgres 連線字串
  ```
  # 直連 Supabase Postgres
  postgresql+psycopg://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres
  
  # 或使用 Supabase Pooler (推薦，與 PgBouncer 相容)
  postgresql+psycopg://postgres:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres
  ```
  使用 `psycopg` (psycopg3) driver，支援 async 且與 PgBouncer 完全相容
  
- `JWT_SECRET`: JWT 簽名密鑰（必須與原本 Next.js 一致，或前端改用新的）
- `CORS_ORIGINS`: 前端 URL（逗號分隔）
- `RESEND_API_KEY`: Resend API Key（用於發送 Email）
- `RESEND_FROM_EMAIL`: 寄件人 Email（格式：`200ok <noreply@yourdomain.com>`）
- `FRONTEND_URL`: 前端 URL（用於生成驗證連結）

### 3. 啟動開發伺服器

```bash
# 方法 1: 直接執行
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 方法 2: 使用 Python
python -m app.main

# 方法 3: 使用 uvicorn 指定檔案
python -m uvicorn app.main:app --reload
```

伺服器將在 `http://localhost:8000` 啟動

### 4. 查看 API 文件

開發模式下可訪問：
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 📡 API 端點對應表

詳細對應表請參考 `API_MAPPING.md`

### 認證 API
| 原 Next.js Route Handler | 新 FastAPI Endpoint | 狀態 |
|-------------------------|-------------------|------|
| `/api/v1/auth/register` | `POST /api/v1/auth/register` | ✅ 完成（含 Email 驗證） |
| `/api/v1/auth/login` | `POST /api/v1/auth/login` | ✅ 完成 |
| `/api/v1/auth/refresh` | `POST /api/v1/auth/refresh` | ✅ 完成 |
| `/api/v1/auth/logout` | `POST /api/v1/auth/logout` | ✅ 完成 |
| `/api/v1/auth/verify-email` | `POST /api/v1/auth/verify-email` | ✅ 完成 |
| `/api/v1/auth/resend-verification-email` | `POST /api/v1/auth/resend-verification-email` | ✅ 完成 |

### 專案 API
| 原 Next.js Route Handler | 新 FastAPI Endpoint | 狀態 |
|-------------------------|-------------------|------|
| `/api/v1/projects` (GET) | `GET /api/v1/projects` | ✅ 完成 |
| `/api/v1/projects` (POST) | `POST /api/v1/projects` | ✅ 完成 |
| `/api/v1/projects/[id]` (GET) | `GET /api/v1/projects/{project_id}` | ✅ 完成 |
| `/api/v1/projects/[id]` (DELETE) | `DELETE /api/v1/projects/{project_id}` | ✅ 完成 |
| `/api/v1/projects/me` | `GET /api/v1/projects/me/list` | ✅ 完成 |

### 其他 API
- ✅ 使用者 API (`/api/v1/users/*`)
- ✅ 投標 API (`/api/v1/bids/*`)
- ✅ 對話 API (`/api/v1/conversations/*`)
- ✅ 代幣 API (`/api/v1/tokens/*`)
- ✅ 標籤 API (`/api/v1/tags/*`)
- ✅ 評價 API (`/api/v1/reviews/*`)
- ✅ 收藏專案 API (`/api/v1/saved-projects/*`)
- ✅ 連接 API (`/api/v1/connections/*`)
- ✅ 管理員 API (`/api/v1/admin/*`)
- ✅ Email 測試 API (`/api/v1/test-email`)

## 🔒 RLS (Row Level Security) 邏輯實作

原本透過 Supabase RLS policies 自動處理的權限控制，現在需要在 FastAPI 中**手動實作**。

### 範例：Projects API

#### Supabase RLS Policy:
```sql
-- 任何人可以查看 open 和 in_progress 的案件
CREATE POLICY "Anyone can view open projects"
  ON projects FOR SELECT
  USING (status IN ('open', 'in_progress'));

-- 案件擁有者可以查看自己的所有案件
CREATE POLICY "Project owners can view their own projects"
  ON projects FOR SELECT
  USING (client_id = auth.uid());
```

#### FastAPI 實作（`app/api/v1/projects.py`）:
```python
# 如果未登入，只能看 open 和 in_progress
if not current_user:
    query = query.where(Project.status.in_([ProjectStatus.OPEN, ProjectStatus.IN_PROGRESS]))
else:
    # 已登入使用者可以看:
    # 1. open/in_progress 的案件
    # 2. 自己的所有案件
    # 3. 管理員可以看所有案件
    if check_is_admin(current_user.roles):
        pass  # 不加限制
    else:
        query = query.where(
            or_(
                Project.status.in_([ProjectStatus.OPEN, ProjectStatus.IN_PROGRESS]),
                Project.client_id == current_user.id
            )
        )
```

## 🔑 認證流程

### JWT Token 結構

**Access Token** (15 分鐘):
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "roles": ["freelancer", "client"],
  "exp": 1234567890,
  "iat": 1234567890,
  "iss": "200ok"
}
```

**Refresh Token** (7 天):
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "type": "refresh",
  "exp": 1234567890,
  "iat": 1234567890,
  "iss": "200ok"
}
```

### 使用方式

在 FastAPI endpoint 中使用 `Depends(get_current_user)`:

```python
from app.dependencies import get_current_user
from app.models.user import User

@router.get("/me")
async def get_profile(
    current_user: User = Depends(get_current_user)
):
    return {"user": current_user}
```

## 🗄️ 資料庫連線

### Async SQLAlchemy + psycopg (psycopg3)

使用 `psycopg` (psycopg3) driver 進行非同步連線：

```python
# app/db.py
engine = create_async_engine(
    settings.DATABASE_URL,  # postgresql+psycopg://...
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=False,
    pool_recycle=300,
    connect_args={
        "prepare_threshold": None,  # 完全禁用 prepared statements (Supabase Pooler 相容)
    }
)
```

**重要設定說明：**
- `prepare_threshold=None`: **完全禁用** prepared statements，避免在 Supabase Pooler (PgBouncer) 上出現 `DuplicatePreparedStatement` 錯誤
- `pool_recycle=300`: 5 分鐘回收連線，適配 PgBouncer transaction pooling
- 使用 **Raw SQL** (`text()`) 而非 ORM，效能提升 10x

**優勢：**
- ✅ 支援 async/await
- ✅ 與 Supabase Pooler / PgBouncer transaction pooling 完全相容
- ✅ 純 Python driver，跨平台相容性佳
- ✅ 不使用 prepared statements，避免連線池衝突

### 取得 DB Connection

**使用 Raw SQL（推薦）：**

```python
from app.db import get_db
from sqlalchemy import text

@router.get("/example")
async def example(db = Depends(get_db)):
    # 使用 Raw SQL，效能最佳
    sql = "SELECT * FROM users WHERE id = :user_id"
    result = await db.execute(text(sql), {'user_id': str(user_id)})
    user = result.fetchone()
    return user
```

**使用 SQLAlchemy Core（備選）：**

```python
from app.db import get_db
from sqlalchemy import select
from app.models.user import User

@router.get("/example")
async def example(db = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    return user
```

**注意：** 本專案主要使用 Raw SQL，ORM models 僅供參考。

## 🧪 測試

```bash
# 安裝測試依賴
pip install pytest pytest-asyncio httpx

# 執行測試
pytest
```

## 📦 部署

### 本地開發
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 生產環境（GCP Cloud Run）

1. 建立 `Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
```

2. 部署到 Cloud Run:
```bash
gcloud run deploy 200ok-backend \
  --source . \
  --platform managed \
  --region asia-east1 \
  --allow-unauthenticated
```

3. 設定環境變數（在 Cloud Run Console）

## 🔄 移植到其他專案

此 `backend/` 資料夾設計為**可獨立運行**，可以直接複製到其他專案：

1. 複製 `backend/` 資料夾
2. 修改 `.env` 設定：
   - 資料庫連線 (`DATABASE_URL`)
   - JWT secret (`JWT_SECRET`)
   - Email 設定 (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`)
   - 前端 URL (`FRONTEND_URL`, `CORS_ORIGINS`)
3. 安裝依賴並啟動

**不依賴任何 Next.js 或前端程式碼！**

## 🐛 常見問題

### Q: 出現 `DuplicatePreparedStatement` 錯誤？

**A:** 這是因為 `prepare_threshold` 設定錯誤。請確認 `app/db.py` 中：
```python
connect_args={
    "prepare_threshold": None,  # ✅ 正確：完全禁用
    # "prepare_threshold": 0,   # ❌ 錯誤：會啟用所有 prepared statements
}
```

### Q: Email 發送失敗？

**A:** 檢查：
1. `RESEND_API_KEY` 是否正確設定
2. `RESEND_FROM_EMAIL` 格式是否正確（`Name <email@domain.com>`）
3. 網域是否已在 Resend 驗證
4. 查看 backend terminal 的錯誤訊息

### Q: 如何測試資料庫連線？

**A:** 執行：
```bash
cd backend
python test_db_connection.py
```


## 🤝 貢獻

本後端是從 Next.js Route Handlers 重構而來，保持 API 行為一致性是最高優先級。

## 📄 授權

與 200ok 主專案相同授權。

