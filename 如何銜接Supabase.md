# 如何銜接 Supabase 新資料庫

## 執行步驟

### 1. 登入 Supabase
前往 https://app.supabase.com 登入您的帳號

### 2. 選擇專案
選擇您的 200ok 專案

### 3. 開啟 SQL Editor
點擊左側選單的「SQL Editor」

### 4. 執行遷移腳本
- 複製 `supabase_migration.sql` 的完整內容
- 貼到 SQL Editor 中
- 點擊右下角的「Run」按鈕
- 等待執行完成

### 5. 確認結果
執行成功後會看到訊息：
```
資料庫遷移完成！
新增欄位：
  全新開發: 12 個獨立欄位
  修改維護: 15 個獨立欄位

舊資料處理：
  ✓ 已將舊資料遷移到新欄位
  ✓ 所有專案預設為全新開發模式
```

## 新增的欄位

### 全新開發專案欄位 (new_*)
- new_usage_scenario - 使用場景
- new_goals - 目標
- new_features - 功能需求
- new_outputs - 交付項目
- new_outputs_other - 其他交付項目
- new_design_style - 設計風格
- new_integrations - 整合需求
- new_integrations_other - 其他整合
- new_deliverables - 交付物
- new_communication_preference - 溝通偏好
- new_special_requirements - 特殊需求
- new_concerns - 擔憂事項

### 修改維護專案欄位 (maint_*)
- maint_system_name - 系統名稱
- maint_system_purpose - 系統用途
- maint_current_users_count - 使用人數
- maint_system_age - 系統使用時間
- maint_current_problems - 目前問題
- maint_desired_improvements - 希望改善
- maint_new_features - 新功能需求
- maint_known_tech_stack - 已知技術棧
- maint_has_source_code - 是否有原始碼
- maint_has_documentation - 是否有文件
- maint_can_provide_access - 是否可提供存取
- maint_technical_contact - 技術聯絡人
- maint_expected_outcomes - 預期成果
- maint_success_criteria - 成功標準
- maint_additional_notes - 補充說明

## 舊資料處理
所有現有專案會自動：
- 設定為「全新開發」模式
- 保留所有原有資料
- 不影響任何現有功能

## 問題排查
如果執行失敗，請確認：
1. 是否有權限執行 SQL
2. 網路連線是否正常
3. 專案是否選擇正確

執行完成後即可開始使用新的專案建立流程！

