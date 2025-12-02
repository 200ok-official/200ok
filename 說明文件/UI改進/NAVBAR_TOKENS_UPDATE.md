# Navbar 與代幣系統更新

## ✅ 更新內容

### 1. Navbar 增強功能

#### 新增顯示元素

1. **代幣餘額按鈕** 💰
   - 顯示當前代幣餘額
   - 點擊導向代幣管理頁面 (`/tokens`)
   - 金色背景，醒目易見
   - 桌面版顯示，行動版隱藏（空間考量）

2. **訊息通知圖示** 💬
   - 聊天室圖示
   - 點擊導向聊天室列表 (`/conversations`)
   - 未讀訊息數量紅色徽章（大於 0 時顯示）
   - 支援 9+ 顯示

#### 即時數據更新

- ✅ 登入時自動取得代幣餘額
- ✅ 登入時自動取得未讀訊息數
- ✅ 支援 localStorage 和 NextAuth 雙重認證

---

### 2. 代幣管理頁面 (`/tokens`)

#### 頁面功能

1. **餘額總覽**
   - 目前餘額（大卡片，深藍色漸層）
   - 累計獲得（綠色）
   - 累計消費（紅色）

2. **交易記錄**
   - 顯示最近 20 筆交易
   - 交易類型標籤
   - 金額變動（正數綠色，負數紅色）
   - 交易後餘額
   - 交易描述
   - 時間戳記

3. **加值提示**
   - 購買代幣按鈕（目前為模擬）
   - 提示訊息說明功能即將推出

4. **使用說明**
   - 說明各種代幣用途
   - 價格清單
   - 退款政策提示

---

## 🎨 UI/UX 設計

### 配色方案

| 元素 | 顏色 | 用途 |
|------|------|------|
| 代幣按鈕背景 | `#c5ae8c` | 金色，代表代幣 |
| 代幣按鈕文字 | `#20263e` | 深藍色，對比清晰 |
| 未讀徽章 | `red-500` | 紅色，引起注意 |
| 正數金額 | `green-600` | 綠色，正向 |
| 負數金額 | `red-600` | 紅色，支出 |
| 餘額卡片 | `#20263e` → `#2d3550` | 漸層，高級感 |

### 響應式設計

- **桌面版（≥768px）**
  - 顯示代幣餘額按鈕
  - 顯示完整使用者名稱
  - 顯示發布案件按鈕

- **行動版（<768px）**
  - 隱藏代幣餘額按鈕（避免擁擠）
  - 保留訊息圖示
  - 隱藏使用者名稱（僅顯示頭像）

---

## 📊 資料流程

### Navbar 載入流程

```
頁面載入
  ↓
檢查 localStorage token
  ↓
setIsLoggedIn(true)
  ↓
並行執行：
  ├─ fetchTokenBalance()    → GET /api/v1/tokens/balance
  └─ fetchUnreadCount()     → GET /api/v1/conversations
  ↓
更新 UI 顯示
```

### 代幣頁面載入流程

```
頁面載入
  ↓
檢查登入狀態
  ↓
並行執行：
  ├─ fetchBalance()         → GET /api/v1/tokens/balance
  └─ fetchTransactions()    → GET /api/v1/tokens/transactions?limit=20
  ↓
渲染頁面
```

---

## 🔧 API 端點

### 使用的端點

1. **`GET /api/v1/tokens/balance`**
   - 取得使用者代幣餘額
   - 返回：`{ balance, total_earned, total_spent }`

2. **`GET /api/v1/tokens/transactions`**
   - 取得交易記錄
   - 參數：`limit`, `offset`
   - 返回：交易列表

3. **`GET /api/v1/conversations`**
   - 取得對話列表
   - 用於計算未讀訊息（未來可優化為專門的 API）

---

## 📝 交易類型對應

| 類型代碼 | 中文名稱 | 金額 | 說明 |
|----------|----------|------|------|
| `unlock_direct_contact` | 解鎖直接聯絡 | -200 | 付費開啟與使用者的聊天 |
| `submit_proposal` | 提交提案 | -100 | 工程師提交提案 |
| `view_proposal` | 查看提案 | -100 | 發案者查看提案 |
| `refund` | 退款 | +100 | 7日無回應退款 |
| `platform_fee` | 平台贈送 | +1000 | 新用戶註冊贈送 |

---

## 🚀 未來改進

### 短期（v1.1）

- [ ] 實作專門的未讀訊息 API
- [ ] 代幣餘額定期自動刷新（WebSocket 或輪詢）
- [ ] 交易記錄分頁載入
- [ ] 交易記錄篩選（按類型、日期）

### 中期（v1.2）

- [ ] 代幣加值功能（金流串接）
- [ ] 代幣轉贈功能
- [ ] 代幣使用統計圖表
- [ ] 月度消費報告

### 長期（v2.0）

- [ ] 代幣儲值優惠方案
- [ ] VIP 會員制度
- [ ] 推薦獎勵機制
- [ ] 代幣任務系統

---

## 🐛 已修復的問題

### 問題：未登入時 API 401 錯誤

**症狀**：
- 未登入時訪問首頁會在 console 看到多個 `UnauthorizedError: 請先登入` 錯誤
- 錯誤來自 `/api/v1/tokens/balance` 和 `/api/v1/conversations`

**原因**：
- Navbar 在 `useEffect` 中無條件呼叫 API
- 沒有傳遞 `Authorization` header

**解決方案**：
1. ✅ 修改 `fetchTokenBalance` 和 `fetchUnreadCount` 接受 `token` 參數
2. ✅ 只在 `token` 存在時才呼叫這些函數
3. ✅ 在請求中加入 `Authorization: Bearer ${token}` header
4. ✅ 代幣頁面也加入相同的 token 檢查和 header

**修改的檔案**：
- `/src/components/layout/Navbar.tsx`
- `/src/app/tokens/page.tsx`

---

## 🧪 測試檢查清單

### Navbar

- [x] 未登入時不會呼叫 token/conversations API
- [ ] 登入後顯示代幣餘額
- [ ] 代幣餘額正確顯示數字
- [ ] 點擊代幣按鈕導向 `/tokens`
- [ ] 訊息圖示正確顯示
- [ ] 點擊訊息圖示導向 `/conversations`
- [ ] 未讀徽章在有訊息時顯示
- [ ] 響應式設計正常（桌面/行動版）

### 代幣頁面

- [x] 未登入時重導向到登入頁
- [x] API 請求包含 Authorization header
- [ ] 餘額卡片正確顯示
- [ ] 累計數據正確
- [ ] 交易記錄正確載入
- [ ] 交易類型正確翻譯
- [ ] 金額顏色正確（正/負）
- [ ] 時間格式正確
- [ ] 購買按鈕顯示提示
- [ ] 說明卡片正確顯示

### 認證

- [x] 未登入時無法訪問 `/tokens`
- [x] 未登入時 Navbar 不顯示代幣和訊息
- [x] 未登入時不會產生 401 錯誤
- [ ] 登出後正確清除狀態

---

## 📂 更新的檔案

1. ✅ `/src/components/layout/Navbar.tsx` - 新增代幣和訊息顯示
2. ✅ `/src/app/tokens/page.tsx` - 新建代幣管理頁面
3. ✅ `/src/app/users/[id]/page.tsx` - 修正認證問題
4. ✅ `/src/app/login/page.tsx` - 支援返回 URL
5. ✅ `/src/app/conversations/page.tsx` - 支援雙重認證
6. ✅ `/src/app/conversations/[id]/page.tsx` - 支援雙重認證

---

## 🎯 使用者體驗改進

### Before 改進前
- ❌ 不知道自己還有多少代幣
- ❌ 需要進入頁面才能看到訊息
- ❌ 不知道如何查看交易記錄
- ❌ 登入後被導回首頁，忘記原本要做什麼

### After 改進後
- ✅ Navbar 隨時可見代幣餘額
- ✅ 訊息通知一目了然
- ✅ 一鍵進入代幣管理頁面
- ✅ 登入後返回原頁面，流程順暢

---

完成！現在使用者可以輕鬆管理代幣並查看訊息了 🎉

