# 🔒 Backend API Security Audit Report

## 審計日期
2024年（當前）

## 審計範圍
- 所有 FastAPI 路由端點
- 認證與授權機制
- 數據隔離與 RLS 邏輯
- 敏感資訊暴露風險

---

## 🔍 Public (unauthenticated) endpoints:

### ✅ 正常公開端點（預期行為）

1. **`backend/app/main.py`**
   - `GET /` - 根端點，僅返回 API 資訊
   - `GET /health` - 健康檢查端點

2. **`backend/app/api/v1/auth.py`**
   - `POST /api/v1/auth/register` - 使用者註冊（正常，需要公開）
   - `POST /api/v1/auth/login` - 使用者登入（正常，需要公開）
   - `POST /api/v1/auth/refresh` - 刷新 access token（正常，使用 refresh token 驗證）
   - `POST /api/v1/auth/verify-email` - Email 驗證（正常，使用 token 驗證）

3. **`backend/app/api/v1/users.py`**
   - `GET /api/v1/users/search` - 搜尋使用者（正常，僅返回公開資料：name, bio, skills, avatar_url, rating）
   - `GET /api/v1/users/search/freelancers` - 搜尋接案者（正常，僅返回公開資料）
   - `GET /api/v1/users/{user_id}` - 取得使用者公開資料（正常，email 已設為 None）
   - `GET /api/v1/users/{user_id}/reviews` - 取得使用者評價（正常，公開資料）
   - `GET /api/v1/users/{user_id}/stats` - 取得使用者統計（正常，公開統計資料）

4. **`backend/app/api/v1/projects.py`**
   - `GET /api/v1/projects` - 取得案件列表（正常，有 RLS 邏輯限制）
   - `GET /api/v1/projects/{project_id}` - 取得案件詳情（正常，有 RLS 邏輯限制）

5. **`backend/app/api/v1/tags.py`**
   - `GET /api/v1/tags` - 取得標籤列表（正常，公開資料）

### ⚠️ 需要關注的公開端點

1. **`backend/app/api/v1/auth.py`**
   - `POST /api/v1/auth/logout` - 登出
     - **說明**: 不需要 access token，僅使用 refresh token 驗證
     - **風險**: 低（使用 refresh token 驗證，但建議改為需要 access token）
     - **建議**: 可考慮改為需要 access token，或至少驗證 refresh token 屬於當前使用者

2. **`backend/app/api/v1/test_email.py`**
   - `POST /api/v1/test-email` - 發送測試郵件
     - **說明**: 完全不需要認證，任何人都可以發送測試郵件
     - **風險**: ⚠️ **高** - 可能被濫用發送垃圾郵件
     - **建議**: 
       - 僅在開發環境啟用（使用環境變數控制）
       - 或添加管理員認證
       - 或添加 rate limiting

---

## 🔐 Authenticated endpoints & data isolation review:

### ✅ 正確實作的端點

1. **`backend/app/api/v1/users.py`**
   - `GET /api/v1/users/me/profile` - ✅ 正確使用 `get_current_user`，僅返回自己的資料
   - `PUT /api/v1/users/me/profile` - ✅ 正確使用 `get_current_user`，只能更新自己的資料
   - `PUT /api/v1/users/me/password` - ✅ 正確使用 `get_current_user`，只能更新自己的密碼
   - `PUT /api/v1/users/me/skills` - ✅ 正確使用 `get_current_user`，只能更新自己的技能

2. **`backend/app/api/v1/projects.py`**
   - `POST /api/v1/projects` - ✅ 正確使用 `get_current_user`，強制 `client_id = current_user.id`
   - `GET /api/v1/projects/me/list` - ✅ 正確使用 `get_current_user`，WHERE 條件包含 `client_id = :user_id`
   - `PUT /api/v1/projects/{project_id}` - ✅ 正確使用 `get_current_user`，檢查 `client_id = current_user.id`
   - `DELETE /api/v1/projects/{project_id}` - ✅ 正確使用 `get_current_user`，檢查 `client_id = current_user.id`
   - `POST /api/v1/projects/{project_id}/publish` - ✅ 正確使用 `get_current_user`，檢查 `client_id = current_user.id`
   - `POST /api/v1/projects/{project_id}/cancel` - ✅ 正確使用 `get_current_user`，檢查 `client_id = current_user.id`
   - `GET /api/v1/projects/{project_id}` - ✅ 正確實作 RLS 邏輯：
     - 未登入：只能查看 `open` 或 `in_progress` 狀態
     - 已登入：可以查看 `open/in_progress` 或自己的所有案件
     - 管理員：可以查看所有案件

3. **`backend/app/api/v1/conversations.py`**
   - `GET /api/v1/conversations` - ✅ 正確使用 `get_current_user`，WHERE 條件：`c.initiator_id = :user_id OR c.recipient_id = :user_id`
   - `POST /api/v1/conversations/direct` - ✅ 正確使用 `get_current_user`
   - `POST /api/v1/conversations/unlock-proposal` - ✅ 正確使用 `get_current_user`
   - `GET /api/v1/conversations/{conversation_id}` - ✅ 正確檢查：`initiator_id == current_user.id OR recipient_id == current_user.id`
   - `GET /api/v1/conversations/{conversation_id}/messages` - ✅ 正確檢查對話參與者，並實作解鎖邏輯
   - `POST /api/v1/conversations/{conversation_id}/messages` - ✅ 正確檢查對話參與者和解鎖狀態
   - `GET /api/v1/conversations/me/unread-count` - ✅ 正確使用 `get_current_user`

4. **`backend/app/api/v1/bids.py`**
   - `GET /api/v1/bids/me` - ✅ 正確使用 `get_current_user`，WHERE 條件：`b.freelancer_id = :user_id`
   - `GET /api/v1/bids/{bid_id}` - ✅ 正確檢查：`freelancer_id == current_user.id OR project_client_id == current_user.id`
   - `POST /api/v1/bids/{bid_id}/accept` - ✅ 正確檢查：`project_client_id == current_user.id`
   - `POST /api/v1/bids/{bid_id}/reject` - ✅ 正確檢查：`project_client_id == current_user.id`
   - `POST /api/v1/bids/projects/{project_id}/bids` - ✅ 正確使用 `get_current_user`，檢查 `freelancer_id = current_user.id`
   - `GET /api/v1/bids/projects/{project_id}/bids` - ✅ 正確檢查：`project_client_id == current_user.id`

5. **`backend/app/api/v1/tokens.py`**
   - `GET /api/v1/tokens/balance` - ✅ 正確使用 `get_current_user`，WHERE 條件：`user_id = :user_id`
   - `GET /api/v1/tokens/transactions` - ✅ 正確使用 `get_current_user`，WHERE 條件：`user_id = :user_id`
   - `POST /api/v1/tokens/purchase` - ✅ 正確使用 `get_current_user`

6. **`backend/app/api/v1/saved_projects.py`**
   - `POST /api/v1/saved-projects/{project_id}/save` - ✅ 正確使用 `get_current_user`，檢查 `user_id = current_user.id`
   - `DELETE /api/v1/saved-projects/{project_id}/save` - ✅ 正確使用 `get_current_user`，檢查 `user_id = current_user.id`
   - `GET /api/v1/saved-projects/saved/list` - ✅ 正確使用 `get_current_user`，WHERE 條件：`user_id = :user_id`

7. **`backend/app/api/v1/reviews.py`**
   - `POST /api/v1/reviews/{project_id}/reviews` - ✅ 正確使用 `get_current_user`
   - `GET /api/v1/reviews/{project_id}/can-review` - ✅ 正確使用 `get_current_user`

8. **`backend/app/api/v1/connections.py`**
   - `GET /api/v1/connections` - ✅ 正確使用 `get_current_user`
   - `GET /api/v1/connections/check` - ✅ 正確使用 `get_current_user`

9. **`backend/app/api/v1/admin.py`**
   - 所有端點 - ✅ 正確使用 `require_admin` 依賴

---

## 🚨 Potential privacy/security vulnerabilities:

### 1. ✅ 測試郵件端點已修復

**位置**: `backend/app/api/v1/test_email.py`

**原問題**:
- `POST /api/v1/test-email` 完全不需要認證
- 任何人都可以發送測試郵件到任意 email
- 可能被用於發送垃圾郵件或進行 email 轟炸攻擊

**風險等級**: 🔴 **高**（已修復）

**修復狀態**: ✅ **已修復**
- 已添加 `require_admin` 依賴，僅限管理員使用
- 防止未授權的郵件發送

**修復代碼**:
```python
@router.post("", response_model=SuccessResponse[dict])
async def send_test_email_endpoint(
    data: TestEmailRequest,
    current_user: User = Depends(require_admin)  # 需要管理員權限
):
    """
    發送測試 email（管理員專用）
    
    用於測試 Resend 設定是否正確
    僅限管理員使用，防止郵件濫用
    """
    # ... 現有代碼
```

---

### 2. ⚠️ 登出端點不需要 access token

**位置**: `backend/app/api/v1/auth.py`

**問題**:
- `POST /api/v1/auth/logout` 只需要 refresh token，不需要 access token
- 雖然使用 refresh token 驗證，但建議同時驗證 access token 以確保安全性

**風險等級**: 🟡 **中低**

**建議修復**:
```python
@router.post("/logout", response_model=SuccessResponse[dict])
async def logout(
    data: RefreshTokenRequest,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)  # 添加 access token 驗證
):
    # 驗證 refresh token 屬於當前使用者
    token_sql = """
        SELECT user_id FROM refresh_tokens 
        WHERE token = :token AND user_id = :user_id
    """
    result = await db.execute(text(token_sql), {
        'token': data.refresh_token,
        'user_id': str(current_user.id)
    })
    if not result.fetchone():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="無效的 Refresh Token"
        )
    
    # 刪除 refresh token
    delete_sql = "DELETE FROM refresh_tokens WHERE token = :token"
    await db.execute(text(delete_sql), {'token': data.refresh_token})
    
    return {
        "success": True,
        "message": "登出成功",
        "data": {}
    }
```

---

### 3. ✅ 用戶公開資料端點已正確過濾敏感資訊

**位置**: `backend/app/api/v1/users.py`

**檢查結果**: ✅ **安全**
- `GET /api/v1/users/{user_id}` 正確將 `email` 設為 `None`
- 不返回 `phone`、`password_hash` 等敏感資訊
- 僅返回公開資料：name, bio, skills, avatar_url, rating, portfolio_links

---

### 4. ✅ 對話端點正確實作聯絡資訊保護

**位置**: `backend/app/api/v1/conversations.py`

**檢查結果**: ✅ **安全**
- `GET /api/v1/conversations/{conversation_id}` 正確實作：
  - 只有在對方也解鎖時才顯示對方的 email 和 phone
  - 使用 `show_initiator_contact` 和 `show_recipient_contact` 邏輯控制
  - 正確檢查對話參與者權限

---

### 5. ✅ 訊息端點正確實作 RLS 邏輯

**位置**: `backend/app/api/v1/conversations.py`

**檢查結果**: ✅ **安全**
- `GET /api/v1/conversations/{conversation_id}/messages` 正確實作：
  - 檢查對話參與者
  - 未解鎖時只能查看自己發送的訊息
  - 已解鎖時可以查看所有訊息

---

### 6. ✅ 專案端點正確實作 RLS 邏輯

**位置**: `backend/app/api/v1/projects.py`

**檢查結果**: ✅ **安全**
- `GET /api/v1/projects` 正確實作：
  - 未登入：只能查看 `open` 和 `in_progress` 狀態
  - 已登入：可以查看 `open/in_progress` 或自己的所有案件
  - 管理員：可以查看所有案件
- `GET /api/v1/projects/{project_id}` 正確實作相同的 RLS 邏輯

---

### 7. ✅ 投標端點正確實作權限檢查

**位置**: `backend/app/api/v1/bids.py`

**檢查結果**: ✅ **安全**
- `GET /api/v1/bids/{bid_id}` 正確檢查：
  - 投標者可以查看
  - 專案擁有者可以查看
  - 管理員可以查看
- `GET /api/v1/bids/projects/{project_id}/bids` 正確檢查：只有專案擁有者可查看

---

## 📋 總結

### ✅ 優點
1. **認證機制完善**: 大部分端點正確使用 `get_current_user` 或 `require_admin`
2. **RLS 邏輯正確**: 專案、對話、訊息等端點都正確實作了行級安全邏輯
3. **敏感資訊保護**: 用戶公開資料端點正確過濾了 email、phone 等敏感資訊
4. **聯絡資訊保護**: 對話端點正確實作了付費解鎖邏輯，只有在雙方都解鎖時才顯示聯絡資訊

### ⚠️ 需要改進
1. ~~**測試郵件端點**: 需要添加認證或環境變數控制，防止被濫用~~ ✅ **已修復**
2. **登出端點**: 建議同時驗證 access token 和 refresh token（低優先級，當前實作已足夠安全）

### 🔒 整體安全評級
**A (優秀)**

所有關鍵安全措施都已正確實作，高風險問題已修復。

---

## 🛠️ 修復狀態

### ✅ 已修復
1. **測試郵件端點** - 已添加管理員認證，防止郵件濫用攻擊

### 🔄 可選改進（低優先級）
1. **改進登出端點** - 可考慮同時驗證 access token 和 refresh token（當前實作已足夠安全）
2. 考慮添加 rate limiting 到所有公開端點
3. 考慮添加 request logging 以追蹤可疑活動

