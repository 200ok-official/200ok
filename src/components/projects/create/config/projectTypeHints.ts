// 專案類型相關的提示內容配置

export type ProjectType = 
  | 'website' 
  | 'ecommerce' 
  | 'erp_crm' 
  | 'chatbot' 
  | 'mobile_app' 
  | 'game' 
  | 'other';

export interface ProjectTypeHints {
  // Step 2: 使用情境
  usageScenario: {
    placeholder: string;
    examples: string[];
    hint: string;
  };
  
  // Step 3: 目標
  goals: {
    commonGoals: string[];
    placeholder: string;
    hint: string;
  };
  
  // Step 4: 功能
  features: {
    placeholder: string;
    examples: string[];
    hint: string;
  };
  
  // Step 5: 產出
  outputs: {
    options: Array<{ value: string; label: string; desc: string }>;
    examples: string[];
    hint: string;
  };
  
  // Step 6: 參考
  reference: {
    hint: string;
  };
  
  // Step 7: 整合
  integrations: {
    priorityOptions: Array<{ value: string; label: string; icon: string }>;
    commonIntegrations: string[];
    hint: string;
  };
  
  // Step 8: 預算時程
  budgetSchedule: {
    hint: string;
  };
  
  // Step 9: 交付物
  deliverables: {
    priorityOptions: Array<{ value: string; label: string; icon: string }>;
    examples: string[];
    hint: string;
  };
  
  // Step 10: 補充
  additional: {
    hint: string;
  };
}

// 預設提示（當沒有選擇類型或選擇 other 時使用）
const DEFAULT_HINTS: ProjectTypeHints = {
  usageScenario: {
    placeholder: "例如：使用者打開軟體 → 執行某個操作 → 得到結果",
    examples: [
      "使用者登入 → 選擇功能 → 完成操作",
      "系統自動處理 → 產生報表 → 發送通知",
    ],
    hint: "用「→」符號來表示步驟流程，讓接案者更容易理解使用情境。",
  },
  goals: {
    commonGoals: [
      "讓顧客更快預約 / 查詢資訊",
      "減少重複手動作業",
      "提升銷售轉換率",
      "自動統計數據報表",
      "提升品牌形象",
      "降低營運成本",
      "改善客戶體驗",
      "提高工作效率",
    ],
    placeholder: "請以「、」分開多個目標，例如：提升效率、減少人工、改善體驗",
    hint: "AI 會根據您的目標自動生成專案摘要，幫助接案者快速理解需求。",
  },
  features: {
    placeholder: "例如：瀏覽商品、上傳作品、線上報名...",
    examples: [
      "會員註冊登入",
      "瀏覽商品 / 服務",
      "加入購物車",
      "線上付款",
      "預約時間",
      "上傳檔案 / 圖片",
      "留言 / 評論",
      "查看歷史紀錄",
    ],
    hint: "每項功能用一句話簡單描述即可，不需要太技術性的說明。",
  },
  outputs: {
    options: [
      { value: "backend_dashboard", label: "後台管理介面", desc: "查看所有數據和管理內容" },
      { value: "sales_report", label: "銷售報表", desc: "自動生成業績統計" },
      { value: "email_notification", label: "Email 通知", desc: "重要事件即時通知" },
      { value: "excel_export", label: "Excel 匯出", desc: "資料可匯出成試算表" },
      { value: "data_analysis", label: "數據分析圖表", desc: "視覺化數據呈現" },
      { value: "other", label: "其他", desc: "自行描述" },
    ],
    examples: [
      "網站 / 網頁",
      "手機 App",
      "後台管理系統",
      "API 文件",
      "使用手冊",
    ],
    hint: "告訴接案者您希望收到哪些具體的成果。",
  },
  reference: {
    hint: "提供參考網站或 App 可以幫助接案者更快理解您想要的風格和功能。",
  },
  integrations: {
    priorityOptions: [],
    commonIntegrations: [
      "Google Analytics",
      "Facebook Pixel",
      "Line Login",
      "金流串接",
      "Email 服務",
      "雲端儲存",
    ],
    hint: "列出需要串接的外部服務或 API，讓接案者評估技術難度。",
  },
  budgetSchedule: {
    hint: "提供明確的預算和時程可以幫助接案者評估是否適合承接。",
  },
  deliverables: {
    priorityOptions: [],
    examples: [
      "完整原始碼",
      "部署上線",
      "使用文件",
      "技術支援",
    ],
    hint: "明確的交付物可以避免後續爭議。",
  },
  additional: {
    hint: "任何其他需要特別說明的需求都可以在這裡補充。",
  },
};

// 官方形象網站
const WEBSITE_HINTS: ProjectTypeHints = {
  usageScenario: {
    placeholder: "例如：訪客進入網站 → 瀏覽公司介紹 → 查看服務項目 → 填寫聯絡表單 → 送出詢問",
    examples: [
      "訪客進入首頁 → 瀏覽關於我們 → 查看服務項目 → 填寫聯絡表單",
      "客戶搜尋公司 → 點擊進入網站 → 查看案例作品 → 預約諮詢",
    ],
    hint: "描述訪客會如何瀏覽和使用您的網站，包括主要頁面流程。",
  },
  goals: {
    commonGoals: [
      "提升品牌形象與專業度",
      "增加線上曝光與觸及",
      "讓客戶更容易找到我們",
      "展示公司服務與案例",
      "提供線上聯絡管道",
      "建立客戶信任感",
      "SEO 優化提升搜尋排名",
      "收集潛在客戶資訊",
    ],
    placeholder: "例如：提升品牌形象、增加線上曝光、提供聯絡管道、展示服務案例",
    hint: "網站的主要目的是建立形象還是獲取客戶？這會影響設計和功能重點。",
  },
  features: {
    placeholder: "例如：公司介紹頁、服務項目展示、案例作品集、聯絡表單...",
    examples: [
      "公司介紹 / 關於我們",
      "服務項目展示",
      "案例作品集",
      "聯絡表單",
      "最新消息 / 部落格",
      "多語言切換",
      "響應式設計（手機版）",
      "SEO 優化",
    ],
    hint: "官方網站通常需要：公司介紹、服務展示、聯絡方式、案例作品等基本頁面。",
  },
  outputs: {
    options: [
      { value: "backend_dashboard", label: "後台內容管理系統", desc: "方便日後自行更新內容" },
      { value: "data_analysis", label: "SEO 優化與數據分析", desc: "Google Analytics 整合與 SEO 設定" },
      { value: "email_notification", label: "Email 通知系統", desc: "聯絡表單通知功能" },
      { value: "excel_export", label: "資料匯出功能", desc: "匯出訪客資料或表單資料" },
      { value: "other", label: "其他", desc: "自行描述" },
    ],
    examples: [
      "響應式網站（電腦 + 手機版）",
      "後台內容管理系統",
      "SEO 優化設定",
      "Google Analytics 整合",
      "網站使用文件",
    ],
    hint: "確認是否需要後台管理系統，方便日後自行更新內容。",
  },
  reference: {
    hint: "提供您喜歡的網站風格參考，例如：簡約風格、商務專業、創意設計等。",
  },
  integrations: {
    priorityOptions: [
      { value: "analytics", label: "GA/分析", icon: "📈" },
      { value: "maps", label: "Google Maps", icon: "🗺️" },
      { value: "facebook", label: "Facebook", icon: "📘" },
      { value: "line", label: "LINE", icon: "💬" },
      { value: "email", label: "Email", icon: "📧" },
    ],
    commonIntegrations: [
      "Google Analytics",
      "Google Maps",
      "Facebook Pixel",
      "Line 官方帳號",
      "Email 服務（SendGrid / Mailgun）",
      "Google Tag Manager",
      "Facebook / Instagram 嵌入",
      "YouTube 影片嵌入",
    ],
    hint: "官方網站常需要整合 Google Analytics、地圖、社群媒體等服務。",
  },
  budgetSchedule: {
    hint: "官方網站通常需要 1-3 個月開發時間，預算範圍較廣，建議提供明確範圍。",
  },
  deliverables: {
    priorityOptions: [
      { value: "source_code", label: "原始碼", icon: "💻" },
      { value: "admin_credentials", label: "後台帳密", icon: "🔑" },
      { value: "deployment", label: "上線代辦", icon: "🚀" },
      { value: "documentation", label: "使用文件", icon: "📖" },
      { value: "tutorial_video", label: "教學影片", icon: "🎥" },
      { value: "maintenance", label: "維護服務", icon: "🔧" },
    ],
    examples: [
      "完整網站原始碼",
      "後台管理系統",
      "網站部署上線",
      "使用教學文件",
      "SEO 設定完成",
      "Google Analytics 設定",
    ],
    hint: "確認是否需要後台管理系統，以及是否需要協助部署上線。",
  },
  additional: {
    hint: "例如：是否需要多語言版本、特定瀏覽器相容性、無障礙設計等特殊需求。",
  },
};

// 電商平台
const ECOMMERCE_HINTS: ProjectTypeHints = {
  usageScenario: {
    placeholder: "例如：顧客進入網站 → 瀏覽商品分類 → 查看商品詳情 → 加入購物車 → 選擇配送方式 → 完成付款",
    examples: [
      "顧客搜尋商品 → 查看商品詳情 → 選擇規格 → 加入購物車 → 結帳付款",
      "會員登入 → 瀏覽推薦商品 → 加入購物車 → 使用優惠券 → 完成訂單",
    ],
    hint: "描述完整的購物流程，從瀏覽商品到完成訂單的每個步驟。",
  },
  goals: {
    commonGoals: [
      "增加線上銷售額",
      "提升購物轉換率",
      "擴大銷售通路",
      "降低庫存管理成本",
      "提供 24 小時購物服務",
      "自動化訂單處理",
      "建立會員系統",
      "提升客戶回購率",
    ],
    placeholder: "例如：增加線上銷售、提升轉換率、自動化訂單處理、建立會員系統",
    hint: "電商平台的核心目標是銷售轉換，思考如何提升購物體驗和轉換率。",
  },
  features: {
    placeholder: "例如：商品管理、購物車、金流串接、訂單管理、會員系統...",
    examples: [
      "商品分類與搜尋",
      "商品詳情頁（規格、圖片、評價）",
      "購物車功能",
      "會員註冊登入",
      "多種付款方式",
      "訂單查詢與追蹤",
      "優惠券 / 折扣碼",
      "庫存管理",
      "後台訂單管理",
      "商品評價系統",
    ],
    hint: "電商平台需要完整的購物流程：商品展示、購物車、付款、訂單管理。",
  },
  outputs: {
    options: [
      { value: "backend_dashboard", label: "後台管理系統", desc: "商品、訂單、會員管理" },
      { value: "sales_report", label: "銷售報表", desc: "業績統計與分析" },
      { value: "email_notification", label: "Email 通知", desc: "訂單確認與物流通知" },
      { value: "excel_export", label: "資料匯出", desc: "訂單、會員資料匯出" },
      { value: "data_analysis", label: "數據分析", desc: "銷售數據與流量分析" },
      { value: "other", label: "其他", desc: "自行描述" },
    ],
    examples: [
      "電商網站（前台 + 後台）",
      "商品管理系統",
      "訂單管理系統",
      "會員管理系統",
      "金流串接完成",
      "物流串接完成",
    ],
    hint: "電商平台需要完整的前後台系統，以及金流、物流的串接。",
  },
  reference: {
    hint: "參考知名電商平台的購物流程和介面設計，例如：PChome、momo、蝦皮等。",
  },
  integrations: {
    priorityOptions: [
      { value: "payment", label: "金流串接", icon: "💳" },
      { value: "line", label: "LINE", icon: "💬" },
      { value: "analytics", label: "GA/分析", icon: "📈" },
      { value: "facebook", label: "Facebook", icon: "📘" },
      { value: "email", label: "Email", icon: "📧" },
    ],
    commonIntegrations: [
      "金流（綠界、藍新、智付通）",
      "物流（黑貓、7-11、全家）",
      "Line Pay / 街口支付",
      "Google Analytics",
      "Facebook Pixel",
      "Email 服務（訂單通知）",
      "簡訊服務（物流通知）",
      "庫存管理系統",
    ],
    hint: "電商平台必須串接金流和物流，這是核心功能，務必確認。",
  },
  budgetSchedule: {
    hint: "電商平台開發時間通常需要 2-4 個月，預算範圍較大，建議提供明確範圍。",
  },
  deliverables: {
    priorityOptions: [
      { value: "source_code", label: "原始碼", icon: "💻" },
      { value: "admin_credentials", label: "後台帳密", icon: "🔑" },
      { value: "deployment", label: "上線代辦", icon: "🚀" },
      { value: "documentation", label: "使用文件", icon: "📖" },
      { value: "tutorial_video", label: "教學影片", icon: "🎥" },
      { value: "maintenance", label: "維護服務", icon: "🔧" },
      { value: "training", label: "操作培訓", icon: "👨‍🏫" },
    ],
    examples: [
      "完整電商系統原始碼",
      "後台管理系統",
      "金流串接完成",
      "物流串接完成",
      "系統部署上線",
      "使用教學文件",
      "技術支援（3-6 個月）",
    ],
    hint: "確認金流、物流串接是否包含在交付範圍內，以及後續技術支援期間。",
  },
  additional: {
    hint: "例如：是否需要多店鋪功能、多幣別、多語言、庫存同步、會員等級制度等。",
  },
};

// ERP / CRM 系統
const ERP_CRM_HINTS: ProjectTypeHints = {
  usageScenario: {
    placeholder: "例如：員工登入系統 → 查看待辦事項 → 填寫表單 → 提交審核 → 主管審核 → 完成流程",
    examples: [
      "員工登入 → 填寫請假單 → 主管審核 → 系統記錄 → 通知 HR",
      "業務員輸入客戶資料 → 系統自動分類 → 產生報表 → 主管查看分析",
    ],
    hint: "描述內部員工如何使用系統處理業務流程，包括審核、統計等環節。",
  },
  goals: {
    commonGoals: [
      "減少重複手動作業",
      "自動化業務流程",
      "提升資料準確性",
      "即時掌握營運數據",
      "改善部門協作效率",
      "降低人為錯誤",
      "建立標準作業流程",
      "提升決策效率",
    ],
    placeholder: "例如：自動化流程、提升效率、即時數據分析、改善協作",
    hint: "ERP/CRM 系統的核心是流程自動化和數據分析，思考哪些流程需要優化。",
  },
  features: {
    placeholder: "例如：客戶管理、訂單管理、庫存管理、報表分析...",
    examples: [
      "客戶資料管理（CRM）",
      "訂單 / 報價管理",
      "庫存管理",
      "財務會計模組",
      "人事管理（請假、出勤）",
      "報表分析與統計",
      "權限管理（角色、部門）",
      "審核流程（多層級）",
      "資料匯入匯出",
      "通知提醒系統",
    ],
    hint: "ERP/CRM 系統需要多個功能模組，建議先列出最核心的模組需求。",
  },
  outputs: {
    options: [
      { value: "backend_dashboard", label: "後台管理系統", desc: "各功能模組管理" },
      { value: "sales_report", label: "報表系統", desc: "數據分析與統計報表" },
      { value: "email_notification", label: "Email 通知", desc: "系統通知與提醒" },
      { value: "excel_export", label: "資料匯入匯出", desc: "Excel 資料處理" },
      { value: "data_analysis", label: "數據分析", desc: "營運數據分析" },
      { value: "other", label: "其他", desc: "自行描述" },
    ],
    examples: [
      "完整 ERP/CRM 系統",
      "各功能模組",
      "後台管理系統",
      "報表系統",
      "API 文件",
      "使用手冊",
      "系統部署",
    ],
    hint: "確認需要哪些功能模組，以及是否需要 API 供其他系統整合。",
  },
  reference: {
    hint: "參考現有 ERP/CRM 系統的功能和介面設計，例如：SAP、Salesforce、用友等。",
  },
  integrations: {
    priorityOptions: [
      { value: "email", label: "Email", icon: "📧" },
      { value: "crm", label: "CRM", icon: "👥" },
      { value: "google_sheets", label: "Google Sheets", icon: "📊" },
      { value: "calendar", label: "行事曆", icon: "📅" },
      { value: "analytics", label: "GA/分析", icon: "📈" },
    ],
    commonIntegrations: [
      "Email 服務（通知）",
      "簡訊服務（通知）",
      "會計系統（如：正航、鼎新）",
      "庫存系統",
      "金流系統",
      "Google Workspace / Office 365",
      "Line 通知",
      "API 整合",
    ],
    hint: "ERP/CRM 系統常需要與現有系統整合，確認需要串接哪些外部系統。",
  },
  budgetSchedule: {
    hint: "ERP/CRM 系統開發時間通常需要 3-6 個月以上，預算範圍較大，建議分階段開發。",
  },
  deliverables: {
    priorityOptions: [
      { value: "source_code", label: "原始碼", icon: "💻" },
      { value: "admin_credentials", label: "後台帳密", icon: "🔑" },
      { value: "documentation", label: "使用文件", icon: "📖" },
      { value: "training", label: "操作培訓", icon: "👨‍🏫" },
      { value: "deployment", label: "上線代辦", icon: "🚀" },
      { value: "maintenance", label: "維護服務", icon: "🔧" },
      { value: "tutorial_video", label: "教學影片", icon: "🎥" },
    ],
    examples: [
      "完整系統原始碼",
      "各功能模組",
      "後台管理系統",
      "API 文件",
      "使用手冊",
      "系統部署",
      "教育訓練",
      "技術支援（6-12 個月）",
    ],
    hint: "ERP/CRM 系統通常需要較長的技術支援期間，以及教育訓練服務。",
  },
  additional: {
    hint: "例如：現有系統資料遷移、多公司/多部門架構、資料備份機制、權限細分需求等。",
  },
};

// Line LIFF / Line 工具
const CHATBOT_HINTS: ProjectTypeHints = {
  usageScenario: {
    placeholder: "例如：用戶打開 Line → 點擊選單 → 進入 LIFF 頁面 → 填寫表單 → 提交資料 → 收到確認訊息",
    examples: [
      "用戶打開 Line → 點擊選單 → 進入預約系統 → 選擇服務時間 → 完成預約",
      "顧客掃描 QR Code → 進入 Line 頁面 → 瀏覽商品 → 加入購物車 → 完成購買",
    ],
    hint: "描述用戶在 Line 中如何使用您的服務，包括選單操作和頁面流程。",
  },
  goals: {
    commonGoals: [
      "透過 Line 接觸更多客戶",
      "提供 Line 內一站式服務",
      "自動化客服與行銷",
      "提升客戶互動率",
      "整合 Line 會員系統",
      "降低 App 開發成本",
      "利用 Line 生態圈",
      "提升品牌曝光",
    ],
    placeholder: "例如：透過 Line 接觸客戶、提供一站式服務、自動化行銷、整合會員系統",
    hint: "Line 工具的核心是利用 Line 的用戶基礎和生態圈，思考如何提升互動和轉換。",
  },
  features: {
    placeholder: "例如：Line Login、選單功能、LIFF 頁面、訊息推播、Rich Menu...",
    examples: [
      "Line Login 登入",
      "Line 選單（Rich Menu）",
      "LIFF 網頁應用",
      "訊息推播（Broadcast）",
      "好友分群標籤",
      "圖文選單",
      "Quick Reply 快速回覆",
      "Flex Message 訊息",
      "Webhook 事件處理",
      "會員資料管理",
    ],
    hint: "Line 工具需要整合 Line Messaging API、LIFF、Login 等功能。",
  },
  outputs: {
    options: [
      { value: "backend_dashboard", label: "後台管理系統", desc: "Line 功能與會員管理" },
      { value: "data_analysis", label: "數據分析", desc: "Line 互動數據分析" },
      { value: "email_notification", label: "Email 通知", desc: "訊息推播與通知" },
      { value: "excel_export", label: "資料匯出", desc: "會員資料匯出" },
      { value: "other", label: "其他", desc: "自行描述" },
    ],
    examples: [
      "Line 官方帳號設定",
      "LIFF 應用程式",
      "後台管理系統",
      "訊息推播功能",
      "會員管理系統",
      "API 文件",
    ],
    hint: "確認需要哪些 Line 功能，以及是否需要後台管理系統。",
  },
  reference: {
    hint: "參考其他 Line 官方帳號的互動方式，例如：7-11、全家、星巴克等。",
  },
  integrations: {
    priorityOptions: [
      { value: "line", label: "LINE", icon: "💬" },
      { value: "analytics", label: "GA/分析", icon: "📈" },
      { value: "email", label: "Email", icon: "📧" },
      { value: "payment", label: "金流串接", icon: "💳" },
      { value: "facebook", label: "Facebook", icon: "📘" },
    ],
    commonIntegrations: [
      "Line Messaging API",
      "Line Login",
      "Line Pay",
      "Line Notify",
      "Line Beacon",
      "Google Analytics",
      "資料庫系統",
      "Email 服務",
    ],
    hint: "Line 工具必須串接 Line 官方 API，確認需要哪些 Line 服務。",
  },
  budgetSchedule: {
    hint: "Line 工具開發時間通常需要 1-3 個月，預算範圍中等，需考慮 Line 官方帳號費用。",
  },
  deliverables: {
    priorityOptions: [
      { value: "source_code", label: "原始碼", icon: "💻" },
      { value: "admin_credentials", label: "後台帳密", icon: "🔑" },
      { value: "deployment", label: "上線代辦", icon: "🚀" },
      { value: "documentation", label: "使用文件", icon: "📖" },
      { value: "tutorial_video", label: "教學影片", icon: "🎥" },
      { value: "maintenance", label: "維護服務", icon: "🔧" },
    ],
    examples: [
      "Line 官方帳號設定完成",
      "LIFF 應用程式",
      "後台管理系統",
      "訊息推播功能",
      "使用文件",
      "技術支援（3-6 個月）",
    ],
    hint: "確認 Line 官方帳號的申請和設定是否包含在交付範圍內。",
  },
  additional: {
    hint: "例如：是否需要 Line Pay、Line Beacon、多帳號管理、訊息模板設計等。",
  },
};

// 手機 App
const MOBILE_APP_HINTS: ProjectTypeHints = {
  usageScenario: {
    placeholder: "例如：用戶打開 App → 登入帳號 → 選擇功能 → 完成操作 → 收到推播通知",
    examples: [
      "用戶下載 App → 註冊會員 → 瀏覽內容 → 完成預約 → 收到確認通知",
      "會員打開 App → 查看個人資料 → 使用服務 → 累積點數 → 兌換獎勵",
    ],
    hint: "描述用戶在手機上如何使用 App，包括主要功能和操作流程。",
  },
  goals: {
    commonGoals: [
      "提供行動端服務",
      "提升用戶便利性",
      "增加用戶黏著度",
      "推播通知提醒",
      "離線功能使用",
      "整合手機功能（相機、GPS）",
      "提升品牌形象",
      "收集用戶行為數據",
    ],
    placeholder: "例如：提供行動服務、提升便利性、增加黏著度、推播通知",
    hint: "手機 App 的優勢是便利性和即時性，思考如何利用手機特性提升體驗。",
  },
  features: {
    placeholder: "例如：會員系統、預約功能、推播通知、地圖定位...",
    examples: [
      "會員註冊登入",
      "推播通知",
      "相機拍照 / 上傳",
      "GPS 定位",
      "離線功能",
      "QR Code 掃描",
      "生物辨識（指紋、Face ID）",
      "社群分享",
      "內建聊天功能",
      "支付功能",
    ],
    hint: "手機 App 可以充分利用手機硬體功能，如相機、GPS、推播等。",
  },
  outputs: {
    options: [
      { value: "backend_dashboard", label: "後台管理系統", desc: "App 資料與會員管理" },
      { value: "data_analysis", label: "數據分析", desc: "App 使用數據分析" },
      { value: "email_notification", label: "推播通知", desc: "推播通知設定" },
      { value: "excel_export", label: "資料匯出", desc: "會員資料匯出" },
      { value: "other", label: "其他", desc: "自行描述" },
    ],
    examples: [
      "iOS App（App Store 上架）",
      "Android App（Google Play 上架）",
      "後台管理系統",
      "API 後端服務",
      "推播通知設定",
      "App 使用文件",
    ],
    hint: "確認需要 iOS、Android 或兩者都需要，以及是否需要上架到應用商店。",
  },
  reference: {
    hint: "參考類似功能的 App，例如：預約類 App、會員類 App、服務類 App 等。",
  },
  integrations: {
    priorityOptions: [
      { value: "maps", label: "Google Maps", icon: "🗺️" },
      { value: "facebook", label: "Facebook", icon: "📘" },
      { value: "line", label: "LINE", icon: "💬" },
      { value: "payment", label: "金流串接", icon: "💳" },
      { value: "email", label: "Email", icon: "📧" },
    ],
    commonIntegrations: [
      "推播通知（Firebase / OneSignal）",
      "Google Maps / Apple Maps",
      "Facebook Login / Google Login",
      "Line Login",
      "金流串接",
      "Email 服務",
      "簡訊服務",
      "第三方 API",
    ],
    hint: "手機 App 常需要串接推播、地圖、登入、支付等服務。",
  },
  budgetSchedule: {
    hint: "手機 App 開發時間通常需要 2-4 個月，預算範圍較大，iOS 和 Android 需要分別開發。",
  },
  deliverables: {
    priorityOptions: [
      { value: "source_code", label: "原始碼", icon: "💻" },
      { value: "admin_credentials", label: "後台帳密", icon: "🔑" },
      { value: "deployment", label: "上線代辦", icon: "🚀" },
      { value: "documentation", label: "使用文件", icon: "📖" },
      { value: "tutorial_video", label: "教學影片", icon: "🎥" },
      { value: "maintenance", label: "維護服務", icon: "🔧" },
    ],
    examples: [
      "iOS App 原始碼",
      "Android App 原始碼",
      "後台管理系統",
      "API 後端服務",
      "App Store 上架",
      "Google Play 上架",
      "使用文件",
      "技術支援（3-6 個月）",
    ],
    hint: "確認是否需要協助上架到 App Store 和 Google Play，以及後續更新維護。",
  },
  additional: {
    hint: "例如：是否需要 iPad 版本、Apple Watch 支援、多語言、深色模式、無障礙設計等。",
  },
};

// 手機遊戲 / 網頁遊戲
const GAME_HINTS: ProjectTypeHints = {
  usageScenario: {
    placeholder: "例如：玩家打開遊戲 → 選擇角色 → 開始遊戲 → 完成關卡 → 獲得獎勵 → 升級角色",
    examples: [
      "玩家進入遊戲 → 選擇關卡 → 進行遊戲 → 完成任務 → 獲得獎勵",
      "玩家登入 → 查看排行榜 → 開始對戰 → 結算成績 → 領取獎勵",
    ],
    hint: "描述玩家的遊戲流程，包括核心玩法、進度系統、獎勵機制等。",
  },
  goals: {
    commonGoals: [
      "提供娛樂體驗",
      "增加用戶黏著度",
      "建立遊戲社群",
      "遊戲內購買營收",
      "競技對戰功能",
      "收集養成系統",
      "社交互動功能",
      "持續更新內容",
    ],
    placeholder: "例如：提供娛樂體驗、增加黏著度、遊戲內購買、競技對戰",
    hint: "遊戲的核心是玩法和體驗，思考如何讓玩家持續遊玩和付費。",
  },
  features: {
    placeholder: "例如：角色系統、關卡設計、戰鬥系統、商店系統...",
    examples: [
      "角色 / 卡牌系統",
      "關卡 / 地圖系統",
      "戰鬥 / 對戰系統",
      "商店 / 商城系統",
      "任務 / 成就系統",
      "排行榜",
      "好友 / 公會系統",
      "聊天系統",
      "每日簽到",
      "抽卡 / 轉蛋系統",
    ],
    hint: "遊戲需要多個系統支撐，建議先列出核心玩法和最重要的系統。",
  },
  outputs: {
    options: [
      { value: "backend_dashboard", label: "遊戲後台管理", desc: "遊戲參數與玩家管理" },
      { value: "sales_report", label: "營收報表", desc: "遊戲內購買統計" },
      { value: "data_analysis", label: "數據分析", desc: "玩家行為與遊戲數據分析" },
      { value: "email_notification", label: "推播通知", desc: "遊戲活動通知" },
      { value: "other", label: "其他", desc: "自行描述" },
    ],
    examples: [
      "完整遊戲 App / 網頁",
      "遊戲後台管理系統",
      "玩家資料管理",
      "付費系統",
      "遊戲平衡調整工具",
      "數據分析系統",
    ],
    hint: "遊戲需要後台管理系統來調整遊戲參數、管理玩家、查看數據等。",
  },
  reference: {
    hint: "參考類似玩法的遊戲，說明您喜歡的遊戲風格、美術風格、玩法機制等。",
  },
  integrations: {
    priorityOptions: [
      { value: "payment", label: "金流串接", icon: "💳" },
      { value: "facebook", label: "Facebook", icon: "📘" },
      { value: "analytics", label: "GA/分析", icon: "📈" },
      { value: "email", label: "Email", icon: "📧" },
      { value: "openai", label: "OpenAI/ChatGPT", icon: "🤖" },
    ],
    commonIntegrations: [
      "遊戲內購買（IAP）",
      "推播通知",
      "Facebook / Google 登入",
      "Game Center / Google Play Games",
      "廣告系統（AdMob）",
      "數據分析（Firebase Analytics）",
      "客服系統",
      "第三方 SDK",
    ],
    hint: "遊戲常需要串接付費、登入、排行榜、廣告等服務。",
  },
  budgetSchedule: {
    hint: "遊戲開發時間通常需要 3-6 個月以上，預算範圍很大，建議分階段開發。",
  },
  deliverables: {
    priorityOptions: [
      { value: "source_code", label: "原始碼", icon: "💻" },
      { value: "admin_credentials", label: "後台帳密", icon: "🔑" },
      { value: "deployment", label: "上線代辦", icon: "🚀" },
      { value: "documentation", label: "使用文件", icon: "📖" },
      { value: "maintenance", label: "維護服務", icon: "🔧" },
      { value: "tutorial_video", label: "教學影片", icon: "🎥" },
    ],
    examples: [
      "完整遊戲原始碼",
      "遊戲後台系統",
      "付費系統串接",
      "遊戲上架",
      "美術資源",
      "音效資源",
      "遊戲平衡調整",
      "技術支援（6-12 個月）",
    ],
    hint: "遊戲需要持續更新和維護，確認後續內容更新和技術支援的範圍。",
  },
  additional: {
    hint: "例如：遊戲類型（RPG、益智、競技等）、美術風格、音效需求、多語言、跨平台等。",
  },
};

// 匯出配置
export const PROJECT_TYPE_HINTS: Record<ProjectType, ProjectTypeHints> = {
  website: WEBSITE_HINTS,
  ecommerce: ECOMMERCE_HINTS,
  erp_crm: ERP_CRM_HINTS,
  chatbot: CHATBOT_HINTS,
  mobile_app: MOBILE_APP_HINTS,
  game: GAME_HINTS,
  other: DEFAULT_HINTS,
};

// 獲取提示內容的輔助函數
export function getProjectTypeHints(projectType?: ProjectType): ProjectTypeHints {
  if (!projectType || projectType === 'other') {
    return DEFAULT_HINTS;
  }
  return PROJECT_TYPE_HINTS[projectType] || DEFAULT_HINTS;
}

