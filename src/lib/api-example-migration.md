# API Client 遷移範例

## 範例 1: Login Page (src/app/login/page.tsx)

### 🔴 舊寫法

```typescript
const response = await fetch("/api/v1/auth/login", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(formData),
});

const data = await response.json();

if (!response.ok) {
  throw new Error(data.error || "登入失敗");
}

// 儲存 token
localStorage.setItem("access_token", data.data.access_token);
localStorage.setItem("refresh_token", data.data.refresh_token);
localStorage.setItem("user", JSON.stringify(data.data.user));
```

### 🟢 新寫法

```typescript
import { apiPost } from "@/lib/api";

try {
  const data = await apiPost("/api/v1/auth/login", formData);
  
  // 儲存 token
  localStorage.setItem("access_token", data.data.access_token);
  localStorage.setItem("refresh_token", data.data.refresh_token);
  localStorage.setItem("user", JSON.stringify(data.data.user));
  
  router.push("/");
} catch (error) {
  setError(error.message || "登入失敗");
}
```

---

## 範例 2: Projects List (src/app/projects/page.tsx)

### 🔴 舊寫法

```typescript
const params = new URLSearchParams({
  page: currentPage.toString(),
  limit: "10",
});

if (searchKeyword) {
  params.set("keyword", searchKeyword);
}

const response = await fetch(`/api/v1/projects?${params}`);
if (response.ok) {
  const data = await response.json();
  const newProjects = data.data?.projects || [];
  setProjects(newProjects);
}
```

### 🟢 新寫法（方式 1：使用 apiGet）

```typescript
import { apiGet } from "@/lib/api";

try {
  const queryParams: Record<string, string> = {
    page: currentPage.toString(),
    limit: "10",
  };
  
  if (searchKeyword) {
    queryParams.keyword = searchKeyword;
  }
  
  const data = await apiGet("/api/v1/projects", queryParams);
  const newProjects = data.data?.projects || [];
  setProjects(newProjects);
} catch (error) {
  console.error("Failed to fetch projects:", error);
}
```

### 🟢 新寫法（方式 2：使用 getApiUrl）

```typescript
import { getApiUrl, getAuthHeaders } from "@/lib/api";

const params = new URLSearchParams({
  page: currentPage.toString(),
  limit: "10",
});

if (searchKeyword) {
  params.set("keyword", searchKeyword);
}

const response = await fetch(`${getApiUrl("/api/v1/projects")}?${params}`, {
  headers: getAuthHeaders(),
});

if (response.ok) {
  const data = await response.json();
  const newProjects = data.data?.projects || [];
  setProjects(newProjects);
}
```

---

## 範例 3: 需要認證的請求 (Navbar.tsx)

### 🔴 舊寫法

```typescript
const token = localStorage.getItem("access_token");

const response = await fetch("/api/v1/users/me", {
  headers: {
    "Authorization": `Bearer ${token}`,
  },
});

if (response.ok) {
  const data = await response.json();
  setUser(data.data);
}
```

### 🟢 新寫法

```typescript
import { apiGet, isAuthenticated } from "@/lib/api";

if (isAuthenticated()) {
  try {
    const data = await apiGet("/api/v1/users/me");
    setUser(data.data);
  } catch (error) {
    console.error("Failed to fetch user:", error);
  }
}
```

---

## 範例 4: POST with body (ProposalForm.tsx)

### 🔴 舊寫法

```typescript
const token = localStorage.getItem("access_token");

const response = await fetch(`/api/v1/projects/${projectId}/bids`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  },
  body: JSON.stringify({
    price: bidAmount,
    estimated_days: estimatedDays,
    description: proposal,
  }),
});

if (!response.ok) {
  const error = await response.json();
  throw new Error(error.message);
}
```

### 🟢 新寫法

```typescript
import { apiPost } from "@/lib/api";

try {
  await apiPost(`/api/v1/projects/${projectId}/bids`, {
    price: bidAmount,
    estimated_days: estimatedDays,
    description: proposal,
  });
  
  // 成功處理
} catch (error) {
  setError(error.message || "提交失敗");
}
```

---

## 範例 5: DELETE 請求

### 🔴 舊寫法

```typescript
const token = localStorage.getItem("access_token");

const response = await fetch(`/api/v1/projects/${projectId}`, {
  method: "DELETE",
  headers: {
    "Authorization": `Bearer ${token}`,
  },
});

if (!response.ok) {
  throw new Error("刪除失敗");
}
```

### 🟢 新寫法

```typescript
import { apiDelete } from "@/lib/api";

try {
  await apiDelete(`/api/v1/projects/${projectId}`);
  // 成功處理
} catch (error) {
  setError(error.message || "刪除失敗");
}
```

---

## 範例 6: Token 刷新

### 🟢 新寫法（API client 已提供）

```typescript
import { refreshAccessToken, clearAuth } from "@/lib/api";

// 在 401 錯誤時自動刷新 token
async function handleApiError(error: any) {
  if (error.message.includes("401")) {
    const newToken = await refreshAccessToken();
    
    if (newToken) {
      // 重試原本的請求
      return retry();
    } else {
      // 刷新失敗，清除認證並導向登入頁
      clearAuth();
      router.push("/login");
    }
  }
}
```

---

## 完整遷移步驟

### 1. 在檔案頂部加入 import

```typescript
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
```

### 2. 搜尋所有 fetch 呼叫

```bash
# 在專案中搜尋
grep -r "fetch(" src/
```

### 3. 逐一替換

使用上面的範例作為參考，將每個 fetch 呼叫改為使用 API client。

### 4. 移除手動的 token 處理

API client 會自動處理：
- ❌ 不需要：`localStorage.getItem("access_token")`
- ❌ 不需要：手動加入 `Authorization` header
- ❌ 不需要：手動處理 JSON 解析
- ✅ 需要：只在登入/登出時操作 localStorage

### 5. 測試

確保所有 API 呼叫都正確指向 FastAPI 後端（`http://localhost:8000`）。

---

## 檢查清單

更新前端檔案時，確認：

- [ ] 已 import API client 函數
- [ ] 已移除手動的 token 處理（除了登入/登出）
- [ ] 已移除手動的 `Authorization` header
- [ ] 已測試 API 呼叫是否正常
- [ ] 已處理錯誤情況
- [ ] 已確認環境變數 `NEXT_PUBLIC_API_BASE_URL` 設定正確

