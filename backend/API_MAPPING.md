# API Endpoint Mapping: Next.js Route Handlers → FastAPI

This document provides a mapping from the original Next.js Route Handlers to their corresponding new FastAPI endpoints in the `backend/` service.

## 🔥 完整 API 對應表

### ✅ Auth API

| Original URL (Next.js)           | New URL (FastAPI)                     | Method | Status | Notes                                     |
| :------------------------------- | :------------------------------------ | :----- | :----: | :---------------------------------------- |
| `/api/v1/auth/login`             | `/api/v1/auth/login`    | POST   | ✅ | User login                                |
| `/api/v1/auth/register`          | `/api/v1/auth/register` | POST   | ✅ | User registration                         |
| `/api/v1/auth/refresh`           | `/api/v1/auth/refresh`  | POST   | ✅ | Refresh access token                      |
| `/api/v1/auth/logout`            | `/api/v1/auth/logout`   | POST   | ✅ | User logout                               |
| `/api/v1/auth/verify-email`      | `/api/v1/auth/verify-email` | POST | ✅ | Verify email with token                   |
| `/api/v1/auth/resend-verification-email` | `/api/v1/auth/resend-verification-email` | POST | ✅ | Resend email verification link            |

### ✅ Projects API

| Original URL (Next.js)           | New URL (FastAPI)                     | Method | Status | Notes                                     |
| :------------------------------- | :------------------------------------ | :----- | :----: | :---------------------------------------- |
| `/api/v1/projects`               | `/api/v1/projects`      | GET    | ✅ | List and search projects                  |
| `/api/v1/projects`               | `/api/v1/projects`      | POST   | ✅ | Create a new project                      |
| `/api/v1/projects/[id]`          | `/api/v1/projects/{id}` | GET    | ✅ | Get project details                       |
| `/api/v1/projects/[id]`          | `/api/v1/projects/{id}` | PUT    | ✅ | Update project                            |
| `/api/v1/projects/[id]`          | `/api/v1/projects/{id}` | DELETE | ✅ | Delete project (draft only)               |
| `/api/v1/projects/[id]/publish`  | `/api/v1/projects/{id}/publish` | POST | ✅ | Publish project (draft → open)            |
| `/api/v1/projects/[id]/cancel`   | `/api/v1/projects/{id}/cancel` | POST | ✅ | Cancel project                            |
| `/api/v1/projects/me`            | `/api/v1/projects/me/list` | GET | ✅ | Get my projects                           |
| `/api/v1/projects/saved`         | `/api/v1/projects/saved/list` | GET | ✅ | Get my saved projects                     |
| `/api/v1/projects/[id]/save`     | `/api/v1/projects/{id}/save` | POST | ✅ | Save a project                            |
| `/api/v1/projects/[id]/save`     | `/api/v1/projects/{id}/save` | DELETE | ✅ | Unsave a project                          |

### ✅ Users API

| Original URL (Next.js)           | New URL (FastAPI)                     | Method | Status | Notes                                     |
| :------------------------------- | :------------------------------------ | :----- | :----: | :---------------------------------------- |
| `/api/v1/users/[id]`             | `/api/v1/users/{user_id}` | GET | ✅ | Get user public profile                   |
| `/api/v1/users/me`               | `/api/v1/users/me/profile` | GET | ✅ | Get my profile                            |
| `/api/v1/users/me`               | `/api/v1/users/me/profile` | PUT | ✅ | Update my profile                         |
| `/api/v1/users/me/password`      | `/api/v1/users/me/password` | PUT | ✅ | Update password                           |
| `/api/v1/users/me/skills`        | `/api/v1/users/me/skills` | PUT | ✅ | Update skills                             |
| `/api/v1/users/search`           | `/api/v1/users/search/freelancers` | GET | ✅ | Search freelancers                        |
| `/api/v1/users/[id]/reviews`     | `/api/v1/users/{user_id}/reviews` | GET | ✅ | Get user reviews                          |
| `/api/v1/users/[id]/stats`       | `/api/v1/users/{user_id}/stats` | GET | ✅ | Get user stats                            |

### ✅ Bids API

| Original URL (Next.js)           | New URL (FastAPI)                     | Method | Status | Notes                                     |
| :------------------------------- | :------------------------------------ | :----- | :----: | :---------------------------------------- |
| `/api/v1/bids/me`                | `/api/v1/bids/me` | GET | ✅ | Get my bids                               |
| `/api/v1/bids/[id]`              | `/api/v1/bids/{bid_id}` | GET | ✅ | Get bid details                           |
| `/api/v1/bids/[id]/accept`       | `/api/v1/bids/{bid_id}/accept` | POST | ✅ | Accept a bid                              |
| `/api/v1/bids/[id]/reject`       | `/api/v1/bids/{bid_id}/reject` | POST | ✅ | Reject a bid                              |
| `/api/v1/projects/[id]/bids`     | `/api/v1/bids/projects/{project_id}/bids` | GET | ✅ | Get project bids (owner only)             |
| `/api/v1/projects/[id]/bids`     | `/api/v1/bids/projects/{project_id}/bids` | POST | ✅ | Create a bid on project                   |

### ✅ Conversations & Messages API

| Original URL (Next.js)           | New URL (FastAPI)                     | Method | Status | Notes                                     |
| :------------------------------- | :------------------------------------ | :----- | :----: | :---------------------------------------- |
| `/api/v1/conversations`          | `/api/v1/conversations` | GET | ✅ | Get my conversations                      |
| `/api/v1/conversations/direct`   | `/api/v1/conversations/direct` | POST | ✅ | Create direct conversation (200 tokens)   |
| `/api/v1/conversations/unlock-proposal` | `/api/v1/conversations/unlock-proposal` | POST | ✅ | Unlock proposal (100 tokens)              |
| `/api/v1/conversations/[id]`     | `/api/v1/conversations/{id}` | GET | ✅ | Get conversation details                  |
| `/api/v1/conversations/[id]/messages` | `/api/v1/conversations/{id}/messages` | GET | ✅ | Get messages in conversation              |
| `/api/v1/conversations/[id]/messages` | `/api/v1/conversations/{id}/messages` | POST | ✅ | Send a message                            |
| `/api/v1/messages/unread-count`  | `/api/v1/conversations/me/unread-count` | GET | ✅ | Get unread message count                  |

### ✅ Tokens API

| Original URL (Next.js)           | New URL (FastAPI)                     | Method | Status | Notes                                     |
| :------------------------------- | :------------------------------------ | :----- | :----: | :---------------------------------------- |
| `/api/v1/tokens/balance`         | `/api/v1/tokens/balance` | GET | ✅ | Get token balance                         |
| `/api/v1/tokens/transactions`    | `/api/v1/tokens/transactions` | GET | ✅ | Get token transactions                    |
| `/api/v1/tokens/purchase`        | `/api/v1/tokens/purchase` | POST | ✅ | Purchase tokens                           |

### ✅ Tags API

| Original URL (Next.js)           | New URL (FastAPI)                     | Method | Status | Notes                                     |
| :------------------------------- | :------------------------------------ | :----- | :----: | :---------------------------------------- |
| `/api/v1/tags`                   | `/api/v1/tags` | GET | ✅ | Get all tags                              |

### ✅ Reviews API

| Original URL (Next.js)           | New URL (FastAPI)                     | Method | Status | Notes                                     |
| :------------------------------- | :------------------------------------ | :----- | :----: | :---------------------------------------- |
| `/api/v1/projects/[id]/reviews`  | `/api/v1/projects/{project_id}/reviews` | POST | ✅ | Create a review                           |
| `/api/v1/projects/[id]/can-review` | `/api/v1/projects/{project_id}/can-review` | GET | ✅ | Check if can review                       |

### ✅ Connections API

| Original URL (Next.js)           | New URL (FastAPI)                     | Method | Status | Notes                                     |
| :------------------------------- | :------------------------------------ | :----- | :----: | :---------------------------------------- |
| `/api/v1/connections`            | `/api/v1/connections` | GET | ✅ | Get my connections                        |
| `/api/v1/connections/check`      | `/api/v1/connections/check` | GET | ✅ | Check connection status                   |

### ✅ Admin API

| Original URL (Next.js)           | New URL (FastAPI)                     | Method | Status | Notes                                     |
| :------------------------------- | :------------------------------------ | :----- | :----: | :---------------------------------------- |
| `/api/v1/admin/stats`            | `/api/v1/admin/stats` | GET | ✅ | Get admin stats                           |
| `/api/v1/admin/users`            | `/api/v1/admin/users` | GET | ✅ | Get all users (admin)                     |
| `/api/v1/admin/users/[id]/ban`   | `/api/v1/admin/users/{user_id}/ban` | POST | ✅ | Ban user (admin)                          |
| `/api/v1/admin/projects`         | `/api/v1/admin/projects` | GET | ✅ | Get all projects (admin)                  |
| `/api/v1/admin/projects/[id]`    | `/api/v1/admin/projects/{project_id}` | DELETE | ✅ | Remove project (admin)                    |
| `/api/v1/admin/activity`         | `/api/v1/admin/activity` | GET | ✅ | Get activity log (admin)                  |
| `/api/v1/admin/tags/stats`       | `/api/v1/admin/tags/stats` | GET | ✅ | Get tags stats (admin)                    |

## 📝 總結

- **總 API Endpoints**: 50+
- **已實作**: 50+ ✅
- **完成度**: 100%

## 🎯 使用方式

在前端，將原本的 `/api/v1/...` 改成使用環境變數：

```typescript
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

// 原本
fetch('/api/v1/projects')

// 改成
fetch(`${BACKEND_URL}/api/v1/projects`)
```
