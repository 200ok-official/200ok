# 200 OK - API 文件

## 📋 目錄

- [認證相關 API](#認證相關-api)
- [使用者相關 API](#使用者相關-api)
- [專案相關 API](#專案相關-api)
- [錯誤處理](#錯誤處理)

## 🔐 認證方式

所有需要認證的 API 都必須在 Header 中帶上 JWT Token：

```
Authorization: Bearer <access_token>
```

## 📝 回應格式

### 成功回應

```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}
```

### 錯誤回應

```json
{
  "success": false,
  "error": "錯誤訊息"
}
```

### 分頁回應

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "total_pages": 10
  }
}
```

---

## 認證相關 API

### 註冊

註冊新使用者帳號。

**Endpoint:** `POST /api/v1/auth/register`

**Request Body:**

```json
{
  "name": "張小明",
  "email": "user@example.com",
  "password": "Password123",
  "roles": ["freelancer"]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "name": "張小明",
      "email": "user@example.com",
      "roles": ["freelancer"]
    }
  },
  "message": "註冊成功"
}
```

### 登入

使用 Email 和密碼登入。

**Endpoint:** `POST /api/v1/auth/login`

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "name": "張小明",
      "email": "user@example.com",
      "roles": ["freelancer"]
    }
  },
  "message": "登入成功"
}
```

### 刷新 Token

使用 Refresh Token 取得新的 Access Token。

**Endpoint:** `POST /api/v1/auth/refresh`

**Request Body:**

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "access_token": "new_access_token",
    "refresh_token": "new_refresh_token",
    "user": { ... }
  }
}
```

### 登出

**Endpoint:** `POST /api/v1/auth/logout`

**Request Body:**

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**

```json
{
  "success": true,
  "data": null,
  "message": "登出成功"
}
```

### 發送手機驗證碼

**Endpoint:** `POST /api/v1/auth/verify-phone`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "phone": "0912345678"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "驗證碼已發送",
    "code": "123456"  // 僅開發環境回傳
  }
}
```

### 驗證手機號碼

**Endpoint:** `PUT /api/v1/auth/verify-phone`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "phone": "0912345678",
  "code": "123456"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "verified": true
  },
  "message": "手機驗證成功"
}
```

---

## 使用者相關 API

### 取得目前使用者資料

**Endpoint:** `GET /api/v1/users/me`

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "張小明",
    "email": "user@example.com",
    "roles": ["freelancer"],
    "bio": "全端工程師...",
    "skills": ["React", "Node.js"],
    "avatar_url": "https://...",
    "portfolio_links": ["https://..."],
    "rating": 4.8,
    "phone": "0912345678",
    "phone_verified": true,
    "email_verified": true,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "_count": {
      "projects_created": 5,
      "bids": 10,
      "reviews_received": 8
    }
  }
}
```

### 更新使用者資料

**Endpoint:** `PUT /api/v1/users/me`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "name": "張小明",
  "bio": "資深全端工程師",
  "skills": ["React", "Node.js", "TypeScript"],
  "portfolio_links": ["https://github.com/user"]
}
```

**Response:**

```json
{
  "success": true,
  "data": { ... },
  "message": "個人資料更新成功"
}
```

### 更新密碼

**Endpoint:** `PUT /api/v1/users/me/password`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "current_password": "OldPassword123",
  "new_password": "NewPassword123"
}
```

**Response:**

```json
{
  "success": true,
  "data": null,
  "message": "密碼更新成功，請重新登入"
}
```

### 上傳大頭照

**Endpoint:** `POST /api/v1/users/me/avatar`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "avatar_url": "https://storage.googleapis.com/..."
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "avatar_url": "https://..."
  },
  "message": "大頭照更新成功"
}
```

### 更新技能標籤

**Endpoint:** `PUT /api/v1/users/me/skills`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "skills": ["React", "Node.js", "TypeScript", "PostgreSQL"]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "skills": ["React", "Node.js", "TypeScript", "PostgreSQL"]
  },
  "message": "技能標籤更新成功"
}
```

### 取得使用者公開資料

**Endpoint:** `GET /api/v1/users/:id`

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "張小明",
    "email": "user@example.com",
    "roles": ["freelancer"],
    "bio": "...",
    "skills": ["React", "Node.js"],
    "avatar_url": "https://...",
    "portfolio_links": ["https://..."],
    "rating": 4.8,
    "created_at": "2024-01-01T00:00:00Z",
    "_count": {
      "projects_created": 5,
      "bids": 10,
      "reviews_received": 8
    }
  }
}
```

### 取得使用者評價

**Endpoint:** `GET /api/v1/users/:id/reviews?page=1&limit=10`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "rating": 5,
      "comment": "非常專業...",
      "tags": ["專業", "準時"],
      "created_at": "2024-01-01T00:00:00Z",
      "reviewer": {
        "id": "uuid",
        "name": "李老闆",
        "avatar_url": "https://..."
      },
      "project": {
        "id": "uuid",
        "title": "電商平台開發"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 8,
    "total_pages": 1
  }
}
```

### 取得使用者統計資訊

**Endpoint:** `GET /api/v1/users/:id/stats`

**Response:**

```json
{
  "success": true,
  "data": {
    "rating": 4.8,
    "projects_created": 5,
    "bids_count": 10,
    "completed_projects": 8,
    "is_freelancer": true,
    "is_client": false
  }
}
```

### 搜尋接案者

**Endpoint:** `GET /api/v1/users/search?skills[]=React&skills[]=Node.js&minRating=4.0&page=1&limit=10`

**Query Parameters:**
- `skills[]`: 技能標籤（可多個）
- `minRating`: 最低評分
- `page`: 頁碼
- `limit`: 每頁筆數

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "張小明",
      "bio": "...",
      "skills": ["React", "Node.js"],
      "avatar_url": "https://...",
      "rating": 4.8,
      "_count": {
        "bids": 10,
        "reviews_received": 8
      }
    }
  ],
  "pagination": { ... }
}
```

---

## 錯誤處理

### HTTP 狀態碼

- `200` - 成功
- `201` - 建立成功
- `400` - 請求錯誤
- `401` - 未認證
- `403` - 無權限
- `404` - 找不到資源
- `409` - 資源衝突
- `422` - 驗證失敗
- `429` - 請求過於頻繁
- `500` - 伺服器錯誤

### 錯誤範例

**驗證錯誤：**

```json
{
  "success": false,
  "error": "資料驗證失敗",
  "errors": {
    "email": ["請輸入有效的 Email"],
    "password": ["密碼至少需要 8 個字元"]
  }
}
```

**認證錯誤：**

```json
{
  "success": false,
  "error": "請先登入"
}
```

**權限錯誤：**

```json
{
  "success": false,
  "error": "您沒有權限執行此操作"
}
```

**Rate Limit：**

```json
{
  "success": false,
  "error": "請求過於頻繁，請在 300 秒後再試"
}
```

---

## 📚 更多資訊

- 完整的專案相關 API 將在後續階段實作
- 投標、訊息、通知、評價等 API 文件待補充
- WebSocket 即時通訊協定文件待補充

---

**200 OK** - API v1.0

