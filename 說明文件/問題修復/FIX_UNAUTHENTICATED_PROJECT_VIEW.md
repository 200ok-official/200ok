# 修復未登入用戶無法查看案件詳情

## 問題描述

未登入用戶訪問案件詳情頁面時出現伺服器錯誤，無法查看案件內容。

## 問題原因

`projects`、`bids`、`saved_projects`、`project_tags` 等表沒有設置 Row Level Security (RLS) 政策。雖然後端使用 service role key 可以繞過 RLS，但為了系統的完整性和安全性，應該明確設置 RLS 政策。

## 解決方案

### 1. 啟用相關表的 RLS

為以下表啟用 RLS：
- `projects`
- `bids`
- `saved_projects`
- `project_tags`

### 2. 建立 Projects 表 RLS 政策

#### 查看權限
- ✅ **所有人**（包括未登入用戶）可以查看 `open` 和 `in_progress` 狀態的案件
- ✅ **使用者**可以查看自己的所有案件（包括 `draft` 狀態）
- ✅ **管理員**可以查看所有案件

#### 建立權限
- ✅ **已登入使用者**可以建立案件
- ✅ 建立時必須是案件擁有者

#### 更新權限
- ✅ **案件擁有者**可以更新自己的案件

#### 刪除權限
- ✅ **案件擁有者**可以刪除自己的草稿案件（僅 `draft` 狀態）

### 3. 建立 Bids 表 RLS 政策

#### 查看權限
- ✅ **案件擁有者**可以查看自己案件的所有投標
- ✅ **投標者**可以查看自己的投標

#### 建立權限
- ✅ **已登入使用者**可以建立投標
- ✅ 只能對 `open` 狀態的案件投標

#### 更新權限
- ✅ **投標者**可以更新自己的投標（僅 `pending` 狀態）
- ✅ **案件擁有者**可以更新投標狀態（接受/拒絕）

### 4. 建立 Saved Projects 表 RLS 政策

- ✅ **使用者**可以查看自己的收藏
- ✅ **使用者**可以收藏案件
- ✅ **使用者**可以取消收藏

### 5. 建立 Project Tags 表 RLS 政策

- ✅ **所有人**可以查看案件標籤
- ✅ **案件擁有者**可以管理自己案件的標籤

## 執行步驟

### 選項 1：使用單獨的修復 SQL 檔案

```bash
# 在 Supabase SQL Editor 中執行
/Users/guanyuchen/200ok/supabase_fix_projects_rls.sql
```

### 選項 2：重新執行完整 Schema

```bash
# 如果是新資料庫，可以直接執行更新後的完整 schema
/Users/guanyuchen/200ok/supabase_schema.sql
```

## 驗證

執行 SQL 後，可以透過以下方式驗證：

### 1. 檢查 RLS 是否啟用

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('projects', 'bids', 'saved_projects', 'project_tags');
```

預期結果：所有表的 `rowsecurity` 應為 `true`

### 2. 檢查政策是否建立

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('projects', 'bids', 'saved_projects', 'project_tags')
ORDER BY tablename, policyname;
```

預期結果：應該看到所有建立的政策

### 3. 測試未登入訪問

在瀏覽器中以無痕模式訪問案件詳情頁面：
```
http://localhost:3000/projects/[project-id]
```

應該能夠正常顯示 `open` 或 `in_progress` 狀態的案件。

## 修改的檔案

1. `/Users/guanyuchen/200ok/supabase_schema.sql`
   - 在 `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` 部分新增 4 個表
   - 在 RLS 政策部分新增 Projects、Bids、Saved Projects、Project Tags 的政策

2. `/Users/guanyuchen/200ok/supabase_fix_projects_rls.sql` (新檔案)
   - 獨立的修復 SQL 檔案，可以在現有資料庫上執行

## 安全性考量

### ✅ 已實現的安全控制

1. **案件可見性控制**
   - 公開案件（open/in_progress）對所有人可見
   - 草稿案件僅對擁有者可見
   - 已關閉/已取消的案件僅對擁有者可見

2. **投標資訊保護**
   - 投標內容僅對案件擁有者和投標者本人可見
   - 防止其他工程師查看競爭對手的投標

3. **操作權限控制**
   - 僅案件擁有者可以修改自己的案件
   - 僅案件擁有者可以接受/拒絕投標
   - 僅投標者可以修改自己的投標

4. **收藏功能**
   - 收藏資訊僅對使用者本人可見
   - 防止洩露使用者興趣

## 注意事項

1. **後端使用 Service Role Key**
   - 後端 API 使用 service role key，會繞過 RLS
   - RLS 主要保護前端直接訪問 Supabase 的情況
   - 但設置 RLS 是最佳實踐，確保多層防護

2. **未登入用戶的限制**
   - 未登入用戶只能查看公開案件
   - 無法查看投標資訊
   - 無法進行任何寫入操作

3. **效能考量**
   - RLS 政策中的 EXISTS 子查詢可能影響效能
   - 已為相關欄位建立索引以優化查詢

## 測試清單

- [ ] 未登入用戶可以查看 open 狀態的案件
- [ ] 未登入用戶可以查看 in_progress 狀態的案件
- [ ] 未登入用戶無法查看 draft 狀態的案件
- [ ] 已登入用戶可以查看自己的 draft 案件
- [ ] 案件擁有者可以查看自己案件的投標
- [ ] 工程師只能查看自己的投標
- [ ] 已登入用戶可以收藏案件
- [ ] 案件擁有者可以修改自己的案件
- [ ] 案件擁有者可以刪除自己的 draft 案件

## 完成日期

2025-12-03

## 相關文件

- `/Users/guanyuchen/200ok/supabase_schema.sql` - 完整資料庫 Schema
- `/Users/guanyuchen/200ok/supabase_fix_projects_rls.sql` - 獨立修復 SQL

