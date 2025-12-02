-- 插入測試專案資料（符合新的獨立欄位結構）
-- 關閉 RLS
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;

-- ===== 全新開發專案 =====

-- 1. 王小明 - 牙醫診所線上預約系統
INSERT INTO public.projects (
  id, client_id, title, description, ai_summary,
  project_mode, project_type, status,
  budget_min, budget_max, budget_estimate_only,
  start_date, deadline, deadline_flexible,
  payment_method, payment_schedule,
  required_skills, reference_links,
  new_usage_scenario, new_goals, new_features, new_outputs,
  new_design_style, new_integrations, new_deliverables,
  new_communication_preference, new_special_requirements, new_concerns
) VALUES (
  '00000000-0000-4000-a000-000000000001',
  '00000000-0000-4000-a000-000000000001',
  '牙醫診所線上預約系統開發',
  '大安區新開牙醫診所需要線上化預約系統',
  '系統主要功能包含預約、病患管理與排程',
  'new_development', 'website', 'open',
  120000, 160000, false,
  '2025-01-10', '2025-03-31', false,
  'bank_transfer', '{"phase1":40000,"phase2":40000,"final":40000}',
  ARRAY['Flutter','FastAPI','PostgreSQL','Line Login'],
  ARRAY['https://www.zendentist.com'],
  '大安區新開牙醫診所需要線上化預約，降低櫃台電話量',
  '降低櫃台電話量，提升預約效率',
  ARRAY['預約系統','LINE Notify','病患管理'],
  ARRAY['後台報表','患者資料匯出'],
  ARRAY['white','light_blue'],
  ARRAY['LINE Login','LINE Notify'],
  ARRAY['Web Dashboard','患者後台'],
  ARRAY['line','email'],
  '患者資料需安全加密，後台需支援 iPad 使用',
  ARRAY['資料安全','後台易用性']
);

-- 2. 李雅雯 - 美甲店 PWA
INSERT INTO public.projects (
  id, client_id, title, description,
  project_mode, project_type, status,
  budget_min, budget_max, budget_estimate_only,
  start_date, deadline, deadline_flexible,
  payment_method, payment_schedule,
  required_skills, reference_links,
  new_usage_scenario, new_goals, new_features, new_outputs,
  new_design_style, new_integrations, new_deliverables,
  new_communication_preference, new_special_requirements, new_concerns
) VALUES (
  '00000000-0000-4000-a000-000000000002',
  '00000000-0000-4000-a000-000000000002',
  '美甲店 PWA 預約與展示網站',
  '需要能展示作品集並具備預約功能的 PWA',
  'new_development', 'ecommerce', 'draft',
  35000, 50000, true,
  '2025-02-01', '2025-02-28', true,
  'line_pay', '{"deposit":15000,"final":20000}',
  ARRAY['Next.js','Supabase','TailwindCSS'],
  ARRAY['https://www.instagram.com'],
  '美甲店需要透過社群導流預約，提升轉換率',
  '提升預約轉換率，增加品牌曝光',
  ARRAY['作品分類','AI 文案生成','線上預約'],
  ARRAY['PWA 主畫面安裝','作品集展示頁'],
  ARRAY['pink','white'],
  ARRAY['Line Messaging API','Instagram API'],
  ARRAY['展示頁','預約頁','作品集管理'],
  ARRAY['line','instagram'],
  '介面需走粉色系，需特別優化手機介面',
  ARRAY['流量高峰風險','使用者操作習慣']
);

-- 3. 黃建豪 - CRM 系統
INSERT INTO public.projects (
  id, client_id, title, description, ai_summary,
  project_mode, project_type, status,
  budget_min, budget_max, budget_estimate_only,
  deadline, deadline_flexible,
  payment_method, payment_schedule,
  required_skills, reference_links,
  new_usage_scenario, new_goals, new_features, new_outputs,
  new_design_style, new_integrations, new_deliverables,
  new_communication_preference, new_concerns
) VALUES (
  '00000000-0000-4000-a000-000000000003',
  '00000000-0000-4000-a000-000000000003',
  '小型人力仲介 CRM 系統',
  '公司需要記錄求職者資料、媒合紀錄與客戶資訊',
  'CRM for staffing agency',
  'new_development', 'erp_crm', 'in_progress',
  180000, 260000, false,
  null, true,
  'monthly_retainer', '{"monthly":20000}',
  ARRAY['React','Node.js','PostgreSQL'],
  ARRAY['https://www.104.com.tw'],
  '提升人力媒合效率，解決 Excel 混亂和多人同編問題',
  '提升媒合效率，確保資料一致性',
  ARRAY['媒合 Pipeline','求職者管理','客戶管理'],
  ARRAY['報表輸出','媒合統計'],
  ARRAY['blue','gray'],
  ARRAY['Google OAuth','Gmail API'],
  ARRAY['CRM dashboard','求職者管理','客戶管理'],
  ARRAY['email','teams'],
  ARRAY['資料量大','多人協作']
);

-- 4. 林語彤 - 補習班 App
INSERT INTO public.projects (
  id, client_id, title, description,
  project_mode, project_type, status,
  budget_min, budget_max, budget_estimate_only,
  start_date, deadline, deadline_flexible,
  payment_method, payment_schedule,
  required_skills, reference_links,
  new_usage_scenario, new_goals, new_features, new_outputs,
  new_design_style, new_integrations, new_deliverables,
  new_communication_preference, new_special_requirements, new_concerns
) VALUES (
  '00000000-0000-4000-a000-000000000004',
  '00000000-0000-4000-a000-000000000004',
  '補習班學生成績查詢 App',
  '學生與家長可查成績、進度、報名課程',
  'new_development', 'mobile_app', 'open',
  150000, 230000, false,
  '2025-03-01', '2025-05-30', false,
  'credit_card', '{"front":80000,"final":70000}',
  ARRAY['Flutter','Firebase','Cloud Run'],
  ARRAY['https://www.learnmode.net/'],
  '讓家長快速掌握孩子進度，減少行政電話',
  '減少行政電話，提升家長滿意度',
  ARRAY['課表管理','分數紀錄','課程報名'],
  ARRAY['PDF 成績單','進度圖表'],
  ARRAY['blue','white'],
  ARRAY['LINE Login','Firebase Auth','Push Notification'],
  ARRAY['App + 後台','成績查詢','課程報名'],
  ARRAY['line','email'],
  '需避免家長誤操作',
  ARRAY['大量同時查詢','資料安全']
);

-- 5. 張柏勝 - POS 系統維護（修改維護模式）
INSERT INTO public.projects (
  id, client_id, title, description,
  project_mode, project_type, status,
  budget_min, budget_max, budget_estimate_only,
  deadline, deadline_flexible,
  payment_method, payment_schedule,
  required_skills, reference_links, special_requirements,
  maint_system_name, maint_system_purpose,
  maint_current_users_count, maint_system_age,
  maint_current_problems, maint_desired_improvements, maint_new_features,
  maint_known_tech_stack, maint_has_source_code, maint_has_documentation,
  maint_can_provide_access, maint_technical_contact,
  maint_expected_outcomes, maint_success_criteria, maint_additional_notes
) VALUES (
  '00000000-0000-4000-a000-000000000005',
  '00000000-0000-4000-a000-000000000005',
  'POS 系統維護與功能追加',
  '既有 POS 系統於 2017 年開發，需要新增訂餐報表與備料預估功能',
  'maintenance_modification', 'other', 'in_progress',
  30000, 60000, true,
  null, true,
  'bank_transfer', '{"oneshot":40000}',
  ARRAY['PHP','MySQL'],
  ARRAY['https://www.restauranttech.com'],
  '舊系統請勿大改架構',
  'POS 系統', '餐廳內場外場使用的 POS 點餐系統',
  '11-50', '5+_years',
  '報表產生速度很慢，有些功能常常壞掉，沒有備料預估功能導致進貨困難',
  '提升報表速度，修復常壞的功能，新增備料預估功能',
  '新增訂餐報表功能、備料預估功能、修復現有 bug',
  ARRAY['PHP','MySQL','not_sure'],
  true, false, true,
  '原開發者已離職，但有內部 IT 可協助測試',
  '報表產生時間從 30 秒降到 5 秒內，備料功能可正確預估一週用量',
  '100 筆訂單報表 5 秒內產生，備料預估誤差在 10% 以內',
  '無完整文件，程式碼比較混亂，需要時間理解'
);

-- 6. 陳柏宇 - AI 客服
INSERT INTO public.projects (
  id, client_id, title, description, ai_summary,
  project_mode, project_type, status,
  budget_min, budget_max, budget_estimate_only,
  start_date, deadline, deadline_flexible,
  payment_method, payment_schedule,
  required_skills, reference_links,
  new_usage_scenario, new_goals, new_features, new_outputs,
  new_design_style, new_integrations, new_deliverables,
  new_communication_preference, new_concerns
) VALUES (
  '00000000-0000-4000-a000-000000000006',
  '00000000-0000-4000-a000-000000000006',
  'AI 客服聊天機器人（電商）',
  '協助回答訂單、延遲、退換貨等常見問題，並可串 Shopify',
  'LLM chatbot for shopify',
  'new_development', 'chatbot', 'open',
  60000, 120000, false,
  '2025-02-10','2025-03-15',true,
  'credit_card', '{"deposit":30000,"final":30000}',
  ARRAY['Python','OpenAI API','Shopify API'],
  ARRAY['https://help.shopify.com'],
  '提升電商客服效率，自動回答常見問題',
  '降低人工客服成本，提升回應速度',
  ARRAY['FAQ Auto Reply','Tracking 查詢','訂單狀態查詢'],
  ARRAY['工單整合','對話紀錄'],
  ARRAY['neutral'],
  ARRAY['Shopify API','OpenAI API'],
  ARRAY['Chatbot Widget','後台管理'],
  ARRAY['line','email'],
  ARRAY['語氣一致性','資料安全']
);

-- 7. 林思妤 - 家長溝通系統
INSERT INTO public.projects (
  id, client_id, title, description,
  project_mode, project_type, status,
  budget_min, budget_max, budget_estimate_only,
  start_date, deadline, deadline_flexible,
  payment_method, payment_schedule,
  required_skills, reference_links,
  new_usage_scenario, new_goals, new_features, new_outputs,
  new_design_style, new_integrations, new_deliverables,
  new_communication_preference, new_special_requirements, new_concerns
) VALUES (
  '00000000-0000-4000-a000-000000000007',
  '00000000-0000-4000-a000-000000000007',
  '國小家長溝通系統',
  '導師需要一套公告、活動回覆、請假統一的平台',
  'new_development', 'website', 'draft',
  40000, 70000, true,
  '2025-04-01','2025-05-01',true,
  'bank_transfer', '{"oneshot":50000}',
  ARRAY['Next.js','Supabase'],
  ARRAY['https://www.parentteacherapp.com'],
  '統一家長溝通管道，避免群組刷訊息',
  '避免群組刷訊息，提升溝通效率',
  ARRAY['公告模組','活動回覆模組','請假系統'],
  ARRAY['回覆統計圖表','匯出功能'],
  ARRAY['green','white'],
  ARRAY['LINE Login','Google Calendar'],
  ARRAY['Web App','家長介面','教師後台'],
  ARRAY['line','email'],
  '需特別支援手機 RWD',
  ARRAY['家長操作習慣不一']
);

-- 8. 張以諾 - Podcast 官網
INSERT INTO public.projects (
  id, client_id, title, description,
  project_mode, project_type, status,
  budget_min, budget_max, budget_estimate_only,
  deadline, deadline_flexible,
  payment_method, payment_schedule,
  required_skills, reference_links,
  new_usage_scenario, new_goals, new_features, new_outputs,
  new_design_style, new_integrations, new_deliverables,
  new_communication_preference, new_special_requirements, new_concerns
) VALUES (
  '00000000-0000-4000-a000-000000000008',
  '00000000-0000-4000-a000-000000000008',
  'Podcast 官網與單集後台',
  '主持人希望能自行上架單集、加上贊助連結並提升 SEO',
  'new_development', 'website', 'open',
  30000, 55000, true,
  null, true,
  'credit_card', '{"front":20000,"final":20000}',
  ARRAY['Next.js','Vercel'],
  ARRAY['https://podcasts.apple.com'],
  '提升品牌形象，增加曝光度',
  '增加曝光，吸引更多聽眾',
  ARRAY['SEO 模組','單集管理','贊助連結'],
  ARRAY['OG 圖片產生器','RSS Feed'],
  ARRAY['black','yellow'],
  ARRAY['RSS Feed','Spotify API'],
  ARRAY['Podcast 網站','單集管理後台'],
  ARRAY['email','line'],
  '後台需極簡，主持人非技術背景',
  ARRAY['SEO 需時間','平台串接']
);

-- 9. 蔡芷晴 - IG 排程工具
INSERT INTO public.projects (
  id, client_id, title, description,
  project_mode, project_type, status,
  budget_min, budget_max, budget_estimate_only,
  start_date, deadline, deadline_flexible,
  payment_method, payment_schedule,
  required_skills, reference_links,
  new_usage_scenario, new_goals, new_features, new_outputs,
  new_design_style, new_integrations, new_deliverables,
  new_communication_preference, new_special_requirements, new_concerns
) VALUES (
  '00000000-0000-4000-a000-000000000009',
  '00000000-0000-4000-a000-000000000009',
  'IG 小編排程工具',
  '社群小編需要排程、素材庫、AI 文案',
  'new_development', 'website', 'in_progress',
  80000, 140000, false,
  '2025-01-15','2025-04-15',false,
  'line_pay', '{"phase1":40000,"phase2":40000}',
  ARRAY['Next.js','Supabase','OpenAI API'],
  ARRAY['https://buffer.com'],
  '提升社群小編內容產能，減少人工編輯時間',
  '減少人工編輯，提升內容品質',
  ARRAY['貼文排程','自動產圖','素材管理'],
  ARRAY['Hashtag 建議','AI 文案生成'],
  ARRAY['beige','white'],
  ARRAY['Instagram Graph API','OpenAI API'],
  ARRAY['素材庫','排程管理','AI 編輯器'],
  ARRAY['line','email'],
  '介面要漂亮，符合設計美感',
  ARRAY['Instagram API 限制','圖片壓縮品質']
);

-- 10. 吳承勛 - 健身預約
INSERT INTO public.projects (
  id, client_id, title, description,
  project_mode, project_type, status,
  budget_min, budget_max, budget_estimate_only,
  start_date, deadline, deadline_flexible,
  payment_method, payment_schedule,
  required_skills, reference_links,
  new_usage_scenario, new_goals, new_features, new_outputs,
  new_design_style, new_integrations, new_deliverables,
  new_communication_preference, new_special_requirements, new_concerns
) VALUES (
  '00000000-0000-4000-a000-000000000010',
  '00000000-0000-4000-a000-000000000010',
  '健身教練課程預約系統',
  '學生可預約課程、查看剩餘堂數，並整合 LINE',
  'new_development', 'website', 'open',
  30000, 60000, true,
  '2025-02-01','2025-03-01',true,
  'bank_transfer', '{"oneshot":50000}',
  ARRAY['Next.js','Supabase'],
  ARRAY['https://www.ptbooking.com'],
  '減少 LINE 訊息追問，建立專業預約流程',
  '專業預約流程，減少溝通成本',
  ARRAY['堂數扣除','行事曆檢視','LINE 通知'],
  ARRAY['月曆 UI','堂數統計'],
  ARRAY['blue','white'],
  ARRAY['LINE Login','LINE Notify'],
  ARRAY['預約頁','教練後台','學員介面'],
  ARRAY['email','line'],
  '需支援彈性取消規則',
  ARRAY['學生操作習慣差異','時段衝突處理']
);

-- 開啟 RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
