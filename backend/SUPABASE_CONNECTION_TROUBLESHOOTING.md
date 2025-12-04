# Supabase 連接問題排解指南

## 問題診斷結果

❌ **DNS 無法解析主機名稱：** `db.gkapoesjdekurighunsu.supabase.co`

## 可能原因

1. ⚠️ **Supabase 專案已暫停或刪除**
2. ⚠️ **主機名稱不正確或已變更**
3. ⚠️ **Supabase 改用 Connection Pooling（推薦）**
4. ⚠️ **網路/DNS 問題**

---

## 解決方案

### 方案 1：使用 Connection Pooling（推薦）⭐

Supabase 推薦使用 **Connection Pooling** 而非直連，這樣更穩定且效能更好。

#### 步驟：

1. **登入 Supabase Dashboard**
   - 前往：https://supabase.com/dashboard

2. **獲取 Connection Pooling URL**
   - 選擇專案
   - 前往：`Project Settings` → `Database`
   - 在 **Connection string** 區塊，選擇 **Connection pooling**
   - 模式選擇：`Transaction` 或 `Session`
   - 複製連接字串

3. **連接字串格式：**
   ```
   # Connection Pooling (推薦)
   postgresql://postgres.xxxx:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   
   # 使用 psycopg（for FastAPI，與 PgBouncer 完全相容）
   postgresql+psycopg://postgres.xxxx:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```

4. **更新 `.env`：**
   ```bash
   # 使用 Connection Pooling (端口 6543)
   DATABASE_URL=postgresql+psycopg://postgres.xxxx:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```

---

### 方案 2：使用直連（Direct Connection）

如果需要使用直連（某些功能如 migrations 需要）：

1. **獲取直連 URL**
   - 在 Supabase Dashboard → `Project Settings` → `Database`
   - 在 **Connection string** 區塊，選擇 **Direct connection**
   - 複製連接字串

2. **連接字串格式：**
   ```
   # Direct Connection (端口 5432)
   postgresql://postgres:[PASSWORD]@db.xxxx.supabase.co:5432/postgres
   
   # 使用 psycopg（支援 async）
   postgresql+psycopg://postgres:[PASSWORD]@db.xxxx.supabase.co:5432/postgres
   ```

3. **注意事項：**
   - 直連有連線數限制
   - 建議僅用於 migrations 或管理操作
   - 生產環境建議使用 Connection Pooling

---

### 方案 3：檢查專案狀態

1. **確認專案是否啟用**
   - 登入 Supabase Dashboard
   - 查看專案狀態（是否顯示 "Paused" 或 "Inactive"）
   - 如果暫停，點擊 "Resume" 恢復專案

2. **檢查 IPv4 Add-on**
   - 某些 Supabase 專案需要 IPv4 Add-on
   - 前往：`Project Settings` → `Add-ons`
   - 確認 IPv4 是否啟用

---

### 方案 4：使用 Supabase API（替代方案）

如果資料庫連接持續有問題，可考慮使用 Supabase REST API：

```python
# 使用 Supabase Python Client
from supabase import create_client

supabase = create_client(
    "https://xxxx.supabase.co",
    "your-anon-key"
)
```

---

## 連接字串對比

| 連接方式 | 端口 | 主機格式 | 用途 |
|---------|------|----------|------|
| **Connection Pooling** | 6543 | `aws-0-xx.pooler.supabase.com` | 🟢 應用程式（推薦） |
| **Direct Connection** | 5432 | `db.xxxx.supabase.co` | 🟡 Migrations、管理 |
| **IPv6 Pooling** | 6543 | `[2a05:d014:...]` | 🔵 IPv6 網路 |

---

## 測試連接

更新 `.env` 後，執行測試：

```bash
cd backend
source .venv/bin/activate
python test_db_connection.py
```

---

## 常見錯誤與解決

### 錯誤 1：`nodename nor servname provided, or not known`
- **原因**：主機名稱無法解析
- **解決**：使用 Connection Pooling URL

### 錯誤 2：`connection timeout`
- **原因**：防火牆或網路問題
- **解決**：檢查防火牆設定、確認專案未暫停

### 錯誤 3：`password authentication failed`
- **原因**：密碼錯誤
- **解決**：在 Supabase Dashboard 重設資料庫密碼

### 錯誤 4：`too many connections`
- **原因**：超過連線數限制
- **解決**：使用 Connection Pooling

---

## 推薦配置

### 開發環境

```env
# .env
DATABASE_URL=postgresql+asyncpg://postgres.xxxx:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

### 生產環境

```env
# .env.production
DATABASE_URL=postgresql+asyncpg://postgres.xxxx:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

### 連線池設定建議

**重要：使用 pgbouncer (Connection Pooling) 時，必須禁用 statement cache**

```python
# app/db.py
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_size=10,          # Connection Pooling 可用較小值
    max_overflow=5,        
    pool_pre_ping=True,    # 檢查連線有效性
    pool_recycle=3600,     # 1小時回收
    connect_args={
        # ⚠️ 必須設定：pgbouncer 不支援 prepared statements
        "statement_cache_size": 0,  # 完全禁用 asyncpg statement cache
        "command_timeout": 60,
    },
    execution_options={
        "compiled_cache": None,  # 禁用 SQLAlchemy 編譯快取
    },
)
```

---

## 需要協助？

如果以上方案都無法解決，請提供：
1. Supabase Dashboard 顯示的專案狀態
2. Connection string 類型（Pooling 或 Direct）
3. 完整錯誤訊息

---

**更新日期：** 2025-12-04

