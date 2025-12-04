# 🔄 Supabase → Cloud SQL 遷移分析

## 📊 複雜度評估

| 項目 | 複雜度 | 工作量 | 說明 |
|------|--------|--------|------|
| **資料庫連接** | ⭐⭐ | 1-2 天 | 需要建立連接池 |
| **查詢語法改寫** | ⭐⭐⭐⭐ | 5-7 天 | 所有 `.from()` 改為 SQL |
| **RLS 實作** | ⭐⭐⭐⭐⭐ | 7-10 天 | 需要在應用層手動實現 |
| **RPC 函數** | ⭐⭐⭐ | 2-3 天 | 改為直接 SQL 調用 |
| **認證系統** | ⭐⭐⭐⭐ | 3-5 天 | 從 Supabase Auth 改為自建 |
| **測試與除錯** | ⭐⭐⭐⭐ | 5-7 天 | 完整測試所有功能 |
| **總計** | **⭐⭐⭐⭐** | **23-34 天** | 約 1-1.5 個月 |

---

## 🔍 當前 Supabase 使用情況

### 1. 資料庫連接方式

**當前**：
```typescript
// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  supabaseUrl,
  supabaseServiceRoleKey
);
```

**需要改為**：
```typescript
// src/lib/database.ts
import { Pool } from 'pg';

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
  max: 20, // 連接池大小
});
```

**影響範圍**：
- ✅ 1 個檔案需要修改
- ✅ 需要安裝 `pg` 套件
- ⚠️ 需要設定連接池參數

---

### 2. 查詢語法改寫

#### 當前 Supabase 查詢建構器

**範例 1：簡單查詢**
```typescript
// 當前
const { data, error } = await this.db
  .from("users")
  .select("*")
  .eq("id", userId)
  .single();
```

**需要改為**：
```typescript
// Cloud SQL
const result = await pool.query(
  'SELECT * FROM users WHERE id = $1',
  [userId]
);
const user = result.rows[0];
```

#### 範例 2：複雜查詢
```typescript
// 當前
const { data } = await this.db
  .from("projects")
  .select(`
    *,
    client:users!projects_client_id_fkey(id, name, avatar_url),
    tags:project_tags!inner(tag:tags(id, name))
  `)
  .eq("status", "open")
  .order("created_at", { ascending: false })
  .range(0, 9);
```

**需要改為**：
```typescript
// Cloud SQL
const result = await pool.query(`
  SELECT 
    p.*,
    json_build_object(
      'id', u.id,
      'name', u.name,
      'avatar_url', u.avatar_url
    ) as client,
    json_agg(
      json_build_object(
        'id', t.id,
        'name', t.name
      )
    ) as tags
  FROM projects p
  LEFT JOIN users u ON u.id = p.client_id
  LEFT JOIN project_tags pt ON pt.project_id = p.id
  LEFT JOIN tags t ON t.id = pt.tag_id
  WHERE p.status = $1
  GROUP BY p.id, u.id
  ORDER BY p.created_at DESC
  LIMIT 10
`, ['open']);
```

**影響範圍**：
- ❌ **所有 Service 檔案**（約 10 個檔案）
- ❌ **所有查詢都需要重寫**
- ⚠️ 需要手動處理 JOIN、聚合、分頁

---

### 3. RLS (Row Level Security) 實作

#### 當前 Supabase RLS

**資料庫層級自動執行**：
```sql
-- Supabase 自動處理
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (auth.uid()::uuid = id);
```

**優點**：
- ✅ 資料庫層級強制執行
- ✅ 無法繞過
- ✅ 自動套用到所有查詢

#### Cloud SQL 需要手動實現

**方案 A：在每個查詢中加入條件**（不推薦）
```typescript
// 每個查詢都要手動加條件
const result = await pool.query(
  'SELECT * FROM users WHERE id = $1 AND id = $2', // 手動加權限檢查
  [userId, currentUserId]
);
```

**問題**：
- ❌ 容易遺漏
- ❌ 每個查詢都要重複寫
- ❌ 容易出錯

**方案 B：建立中間層**（推薦）
```typescript
// src/lib/rls.ts
export class RLSHelper {
  static async canViewUser(viewerId: string, targetId: string): Promise<boolean> {
    // 1. 檢查是否是自己
    if (viewerId === targetId) return true;
    
    // 2. 檢查是否有已解鎖的對話
    const result = await pool.query(`
      SELECT 1 FROM conversations
      WHERE is_unlocked = true
        AND (
          (initiator_id = $1 AND recipient_id = $2) OR
          (recipient_id = $1 AND initiator_id = $2)
        )
      LIMIT 1
    `, [viewerId, targetId]);
    
    return result.rows.length > 0;
  }
  
  static async filterUserFields(
    user: any,
    viewerId: string | null
  ): Promise<any> {
    const canViewFull = viewerId && await this.canViewUser(viewerId, user.id);
    
    if (!canViewFull) {
      // 移除敏感欄位
      delete user.email;
      delete user.phone;
    }
    
    return user;
  }
}
```

**使用方式**：
```typescript
// 每個查詢後都要過濾
const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
const user = result.rows[0];
const filteredUser = await RLSHelper.filterUserFields(user, currentUserId);
```

**影響範圍**：
- ❌ **所有查詢都需要加權限檢查**
- ❌ **需要建立完整的 RLS 中間層**
- ⚠️ **複雜度極高**，容易出錯

---

### 4. RPC 函數調用

#### 當前 Supabase RPC

```typescript
// 當前
const { data, error } = await this.db
  .rpc('get_my_conversations', { p_user_id: userId });
```

**使用的 RPC 函數**：
- `get_my_conversations(p_user_id UUID)`
- `get_unread_messages(p_user_id UUID)`
- `get_user_public_profile(p_user_id UUID)`
- `get_user_full_profile(p_user_id UUID, p_viewer_id UUID)`
- `can_view_contact_info(p_viewer_id UUID, p_target_id UUID)`
- `are_users_connected(p_user1_id UUID, p_user2_id UUID)`
- `get_connection_status(p_user_id UUID, p_target_id UUID, p_type TEXT)`
- `get_user_connections(p_user_id UUID, p_status TEXT)`
- `mark_expired_connections()`
- `increment_tag_usage(tag_id UUID)`

#### Cloud SQL 需要改為

```typescript
// Cloud SQL
const result = await pool.query(
  'SELECT * FROM get_my_conversations($1)',
  [userId]
);
const conversations = result.rows;
```

**影響範圍**：
- ✅ RPC 函數定義可以保留（PostgreSQL 原生支援）
- ⚠️ 調用方式需要改為 SQL
- ⚠️ 約 10 處需要修改

---

### 5. 認證系統

#### 當前 Supabase Auth

**優點**：
- ✅ 自動處理 JWT
- ✅ 自動處理 Refresh Token
- ✅ 內建 OAuth（Google）
- ✅ 自動處理 Session

#### Cloud SQL 需要自建

**需要實作**：
1. JWT 生成和驗證
2. Refresh Token 管理
3. OAuth 流程（Google）
4. Session 管理
5. 密碼雜湊和驗證

**當前狀態**：
- ✅ 您已經有 JWT 實作（`auth.middleware.ts`）
- ✅ 已經有 Refresh Token 管理
- ⚠️ OAuth 需要重新實作（目前用 NextAuth）

**影響範圍**：
- ⚠️ OAuth 需要重新實作
- ✅ 其他認證邏輯可以保留

---

## 📝 詳細改動清單

### 必須改動的檔案

#### 1. 資料庫連接層（1 個檔案）
- [ ] `src/lib/supabase.ts` → `src/lib/database.ts`

#### 2. Service 層（10 個檔案）
- [ ] `src/services/auth.service.ts` - 約 50 處查詢
- [ ] `src/services/user.service.ts` - 約 30 處查詢
- [ ] `src/services/project.service.ts` - 約 40 處查詢
- [ ] `src/services/bid.service.ts` - 約 25 處查詢
- [ ] `src/services/conversation.service.ts` - 約 35 處查詢
- [ ] `src/services/message.service.ts` - 約 20 處查詢
- [ ] `src/services/connection.service.ts` - 約 15 處查詢
- [ ] `src/services/token.service.ts` - 約 20 處查詢
- [ ] `src/services/review.service.ts` - 約 15 處查詢
- [ ] `src/services/admin.service.ts` - 約 25 處查詢

**總計約 275 處查詢需要改寫**

#### 3. RLS 中間層（新建）
- [ ] `src/lib/rls.ts` - 建立 RLS 輔助函數
- [ ] 所有 Service 都需要整合 RLS 檢查

#### 4. 認證系統（2 個檔案）
- [ ] `src/lib/authOptions.ts` - OAuth 需要重新實作
- [ ] `src/middleware/auth.middleware.ts` - 可能需要調整

---

## ⚠️ 主要挑戰

### 1. RLS 實作複雜度 ⭐⭐⭐⭐⭐

**問題**：
- Supabase RLS 是資料庫層級自動執行
- Cloud SQL 需要在應用層手動實現
- 每個查詢都要考慮權限

**解決方案**：
```typescript
// 建立統一的查詢包裝器
export class SecureQuery {
  static async selectUsers(
    conditions: string,
    params: any[],
    viewerId: string | null
  ) {
    const query = `
      SELECT * FROM users 
      WHERE ${conditions}
    `;
    const result = await pool.query(query, params);
    
    // 過濾敏感資訊
    return result.rows.map(user => 
      RLSHelper.filterUserFields(user, viewerId)
    );
  }
}
```

**工作量**：7-10 天

---

### 2. 查詢語法轉換 ⭐⭐⭐⭐

**問題**：
- Supabase 查詢建構器 → SQL
- JOIN 查詢需要手動寫
- 聚合查詢需要重寫

**範例**：
```typescript
// Supabase（簡單）
.select('*, client:users(id, name)')

// SQL（複雜）
SELECT 
  p.*,
  json_build_object('id', u.id, 'name', u.name) as client
FROM projects p
LEFT JOIN users u ON u.id = p.client_id
```

**工作量**：5-7 天

---

### 3. 型別安全 ⭐⭐⭐

**問題**：
- Supabase 可以生成 TypeScript 型別
- Cloud SQL 需要手動定義

**解決方案**：
```typescript
// 手動定義型別
interface User {
  id: string;
  name: string;
  email: string;
  // ...
}
```

**工作量**：2-3 天

---

### 4. 錯誤處理 ⭐⭐

**問題**：
- Supabase 統一的錯誤格式
- PostgreSQL 錯誤需要手動處理

**解決方案**：
```typescript
try {
  const result = await pool.query(...);
} catch (error) {
  if (error.code === '23505') {
    // Unique constraint violation
  } else if (error.code === '23503') {
    // Foreign key violation
  }
}
```

**工作量**：1-2 天

---

## 💰 成本對比

| 項目 | Supabase | Cloud SQL |
|------|----------|-----------|
| **資料庫** | $25/月起 | $50-200/月（依規格） |
| **API 請求** | 包含 | 無限制 |
| **儲存空間** | 8GB 起 | 依規格 |
| **備份** | 自動 | 需自行設定 |
| **監控** | 內建 | 需自行設定 |
| **維護** | 無 | 需自行維護 |

---

## 🎯 建議

### 不建議遷移的原因

1. **RLS 實作複雜** ⭐⭐⭐⭐⭐
   - 需要在應用層手動實現所有權限邏輯
   - 容易出錯，安全性風險高
   - 維護成本高

2. **查詢改寫工作量大** ⭐⭐⭐⭐
   - 275+ 處查詢需要重寫
   - 複雜 JOIN 查詢需要手動優化
   - 容易引入 Bug

3. **失去 Supabase 優勢**
   - 自動 RLS 執行
   - 自動 API 生成
   - 內建認證系統
   - 即時訂閱功能

4. **維護成本增加**
   - 需要自行管理資料庫
   - 需要自行處理備份
   - 需要自行監控

### 建議保留 Supabase 的情況

✅ **如果**：
- 當前系統運作良好
- 沒有特殊需求（如資料主權、合規要求）
- 團隊規模較小
- 預算有限

### 建議遷移到 Cloud SQL 的情況

✅ **如果**：
- 有嚴格資料主權要求
- 需要完全控制資料庫
- 有專門的 DBA 團隊
- 預算充足
- 需要自訂資料庫配置

---

## 📋 遷移檢查清單（如果決定遷移）

### 階段 1：準備（3-5 天）
- [ ] 建立 Cloud SQL 實例
- [ ] 設定連接池
- [ ] 匯出 Supabase 資料
- [ ] 匯入到 Cloud SQL
- [ ] 驗證資料完整性

### 階段 2：核心改動（15-20 天）
- [ ] 改寫資料庫連接層
- [ ] 建立 RLS 中間層
- [ ] 改寫所有 Service 查詢
- [ ] 改寫 RPC 函數調用
- [ ] 重新實作 OAuth

### 階段 3：測試（5-7 天）
- [ ] 單元測試
- [ ] 整合測試
- [ ] 權限測試
- [ ] 效能測試
- [ ] 安全測試

### 階段 4：部署（2-3 天）
- [ ] 設定生產環境
- [ ] 資料遷移
- [ ] 切換流量
- [ ] 監控和除錯

**總計**：25-35 天（約 1-1.5 個月）

---

## 🔧 替代方案

### 方案 1：Supabase Self-Hosted

**優點**：
- ✅ 保留 Supabase 所有功能
- ✅ 資料在自己伺服器
- ✅ 遷移成本低

**缺點**：
- ⚠️ 需要自行維護
- ⚠️ 需要伺服器資源

### 方案 2：混合方案

**架構**：
- Supabase：開發和測試環境
- Cloud SQL：生產環境（如果需要）

**優點**：
- ✅ 開發體驗不變
- ✅ 生產環境可控

**缺點**：
- ⚠️ 需要維護兩套環境

---

## 📊 總結

| 評估項目 | 評分 |
|---------|------|
| **技術複雜度** | ⭐⭐⭐⭐ (4/5) |
| **工作量** | ⭐⭐⭐⭐ (4/5) |
| **風險** | ⭐⭐⭐⭐ (4/5) |
| **維護成本** | ⭐⭐⭐⭐⭐ (5/5) |
| **總體建議** | **不建議遷移** |

**除非有特殊需求，否則建議繼續使用 Supabase。**

---

**最後更新**：2025-12-03

