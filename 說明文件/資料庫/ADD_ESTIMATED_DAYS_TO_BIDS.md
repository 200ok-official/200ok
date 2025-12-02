# 為 bids 表添加 estimated_days 欄位

## 📝 問題描述

提交提案時出現錯誤：
```
Could not find the 'estimated_days' column of 'bids' in the schema cache
```

原因：Supabase 中的 `bids` 表缺少 `estimated_days` 欄位。

---

## ✅ 解決方案

### 步驟 1：執行 SQL 遷移腳本

在 Supabase Dashboard 中執行以下 SQL：

**檔案**：`supabase_add_estimated_days_to_bids.sql`

```sql
-- 為 bids 表添加 estimated_days 欄位
ALTER TABLE public.bids 
ADD COLUMN IF NOT EXISTS estimated_days INTEGER;

-- 添加註解
COMMENT ON COLUMN public.bids.estimated_days IS '預估完成天數';
```

### 步驟 2：執行方式

#### 方法 A：使用 Supabase Dashboard（推薦）

1. 前往 [Supabase Dashboard](https://app.supabase.com)
2. 選擇你的專案
3. 點擊左側選單的 **SQL Editor**
4. 點擊 **New Query**
5. 貼上 `supabase_add_estimated_days_to_bids.sql` 的內容
6. 點擊 **Run** 執行

#### 方法 B：使用 psql（如果有資料庫連線）

```bash
# 複製你的資料庫連線字串（在 Supabase > Settings > Database）
psql "postgresql://postgres:[密碼]@[主機].supabase.co:5432/postgres" -f supabase_add_estimated_days_to_bids.sql
```

---

## 🔍 驗證欄位已添加

執行以下 SQL 確認欄位存在：

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'bids' 
  AND column_name = 'estimated_days';
```

**預期結果**：
```
column_name     | data_type | is_nullable
----------------+-----------+-------------
estimated_days  | integer   | YES
```

---

## 📊 更新後的 bids 表結構

```sql
CREATE TABLE public.bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  freelancer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  proposal TEXT NOT NULL,
  bid_amount NUMERIC(10,2) NOT NULL,
  estimated_days INTEGER,  -- ✅ 新增的欄位
  status bid_status DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, freelancer_id)
);

-- 索引
CREATE INDEX idx_bids_project_id ON public.bids(project_id);
CREATE INDEX idx_bids_freelancer_id ON public.bids(freelancer_id);
CREATE INDEX idx_bids_status ON public.bids(status);
```

---

## 🎯 欄位說明

### estimated_days

- **類型**：`INTEGER`
- **可為空**：是（NULL）
- **說明**：工程師預估的完成天數
- **範例**：
  - `30` - 預估 30 天完成
  - `60` - 預估 60 天（2 個月）完成
  - `NULL` - 未提供預估天數

### 使用方式

提案提交時會將 `months * 30 + days` 的總天數儲存到這個欄位：

```typescript
// 範例：2 個月 + 15 天 = 75 天
estimated_days: months * 30 + days  // 2 * 30 + 15 = 75
```

---

## 🚀 完成後

執行遷移後，重新提交提案應該就能成功了！

系統會正確創建：
1. ✅ 投標記錄（bids）
2. ✅ 對話記錄（conversations）
3. ✅ 初始訊息（messages）
4. ✅ 代幣交易（token_transactions）
5. ✅ 用戶連接（user_connections）

---

完成時間：2025-01-02
更新者：AI Assistant
狀態：✅ 等待執行遷移

