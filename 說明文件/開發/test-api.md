# API 測試指南

## 🔍 問題診斷步驟

### 1. 檢查 Supabase 資料是否存在

在 Supabase SQL Editor 中執行：

```sql
-- 檢查用戶資料
SELECT id, name, email, roles, rating FROM users WHERE 'freelancer' = ANY(roles);

-- 檢查專案資料
SELECT id, title, status, client_id FROM projects WHERE status = 'open';

-- 檢查標籤資料
SELECT id, name, category FROM tags LIMIT 10;
```

### 2. 測試 API 端點

#### 測試專案 API
```bash
curl http://localhost:3000/api/v1/projects?limit=6&status=open
```

預期回應格式：
```json
{
  "success": true,
  "data": {
    "projects": [...],
    "pagination": {...}
  }
}
```

#### 測試接案工程師 API
```bash
curl http://localhost:3000/api/v1/users/search?limit=6
```

預期回應格式：
```json
{
  "success": true,
  "data": [...],
  "pagination": {...}
}
```

### 3. 檢查瀏覽器 Console

打開瀏覽器開發者工具 (F12)，查看 Console 是否有錯誤訊息。

### 4. 檢查 Network 標籤

在瀏覽器開發者工具的 Network 標籤中：
- 檢查 API 請求是否成功 (狀態碼 200)
- 查看回應內容是否符合預期格式
- 檢查是否有 CORS 錯誤

## 🐛 常見問題

### 問題 1: RLS (Row Level Security) 阻擋查詢

**解決方案：**
- 確認在 Supabase SQL Editor 中執行 seed data 時，RLS 已被暫時停用
- 確認 seed data 執行完成後，RLS 已重新啟用
- 如果仍有問題，檢查 Supabase 的 RLS 政策設定

### 問題 2: 資料格式不匹配

**檢查項目：**
- 確認 `roles` 欄位是 `user_role[]` 類型
- 確認 `skills` 欄位是 `TEXT[]` 類型
- 確認 `rating` 欄位有預設值或不是 NULL

### 問題 3: API 回應格式錯誤

**已修復：**
- ✅ 首頁：`projectsData.data.projects` (不是 `projectsData.data`)
- ✅ 首頁：`freelancersData.data` (不是 `freelancersData.data.users`)
- ✅ 專案頁：`data.data.projects` (不是 `data.data`)
- ✅ 接案工程師頁：`data.data` (不是 `data.data.users`)

## 📝 修復內容總結

1. **修復 API 回應格式解析**
   - 首頁專案列表：從 `data.data` 改為 `data.data.projects`
   - 首頁接案工程師：從 `data.data.users` 改為 `data.data`
   - 專案頁面：從 `data.data` 改為 `data.data.projects`
   - 接案工程師頁面：從 `data.data.users` 改為 `data.data`

2. **修復 Supabase 查詢語法**
   - 將 `.contains("roles", ['freelancer'])` 改為 `.filter("roles", "cs", "{freelancer}")`
   - 使用 PostgREST 的 `cs` (contains) 操作符來查詢數組欄位

3. **改善錯誤處理**
   - 添加更詳細的錯誤日誌
   - 添加 API 回應狀態檢查

## ✅ 測試檢查清單

- [ ] 首頁顯示最新 6 個開放專案
- [ ] 首頁顯示推薦的 6 位接案工程師
- [ ] `/projects` 頁面顯示所有開放專案
- [ ] `/freelancers` 頁面顯示所有接案工程師
- [ ] 搜尋功能正常工作
- [ ] 篩選功能正常工作
- [ ] 沒有 Console 錯誤
- [ ] API 回應格式正確

