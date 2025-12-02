-- ===================================================================
-- Supabase 資料庫遷移腳本
-- 將專案表展開為獨立欄位
-- ===================================================================

-- Step 1: 新增 project_mode ENUM（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_mode') THEN
        CREATE TYPE project_mode AS ENUM ('new_development', 'maintenance_modification');
    END IF;
END $$;

-- Step 2: 新增 project_mode 欄位
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS project_mode project_mode NOT NULL DEFAULT 'new_development';

-- Step 3: 新增全新開發專案欄位
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS new_usage_scenario TEXT,
ADD COLUMN IF NOT EXISTS new_goals TEXT,
ADD COLUMN IF NOT EXISTS new_features TEXT[],
ADD COLUMN IF NOT EXISTS new_outputs TEXT[],
ADD COLUMN IF NOT EXISTS new_outputs_other TEXT,
ADD COLUMN IF NOT EXISTS new_design_style TEXT[],
ADD COLUMN IF NOT EXISTS new_integrations TEXT[],
ADD COLUMN IF NOT EXISTS new_integrations_other TEXT,
ADD COLUMN IF NOT EXISTS new_deliverables TEXT[],
ADD COLUMN IF NOT EXISTS new_communication_preference TEXT[],
ADD COLUMN IF NOT EXISTS new_special_requirements TEXT,
ADD COLUMN IF NOT EXISTS new_concerns TEXT[];

-- Step 4: 新增修改維護專案欄位
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS maint_system_name TEXT,
ADD COLUMN IF NOT EXISTS maint_system_purpose TEXT,
ADD COLUMN IF NOT EXISTS maint_current_users_count VARCHAR(50),
ADD COLUMN IF NOT EXISTS maint_system_age VARCHAR(50),
ADD COLUMN IF NOT EXISTS maint_current_problems TEXT,
ADD COLUMN IF NOT EXISTS maint_desired_improvements TEXT,
ADD COLUMN IF NOT EXISTS maint_new_features TEXT,
ADD COLUMN IF NOT EXISTS maint_known_tech_stack TEXT[],
ADD COLUMN IF NOT EXISTS maint_has_source_code BOOLEAN,
ADD COLUMN IF NOT EXISTS maint_has_documentation BOOLEAN,
ADD COLUMN IF NOT EXISTS maint_can_provide_access BOOLEAN,
ADD COLUMN IF NOT EXISTS maint_technical_contact TEXT,
ADD COLUMN IF NOT EXISTS maint_expected_outcomes TEXT,
ADD COLUMN IF NOT EXISTS maint_success_criteria TEXT,
ADD COLUMN IF NOT EXISTS maint_additional_notes TEXT;

-- Step 5: 遷移舊資料（如果有 project_brief 或 maintenance_details）
-- 將 project_brief 中的資料拆分到對應欄位
UPDATE projects
SET 
  new_usage_scenario = project_brief->>'usageScenario',
  new_goals = project_brief->>'goals',
  new_features = ARRAY(SELECT jsonb_array_elements_text(project_brief->'features'))
WHERE project_brief IS NOT NULL 
  AND project_brief->>'usageScenario' IS NOT NULL;

-- 將舊的 description 移到 new_usage_scenario（如果 new_usage_scenario 為空）
UPDATE projects
SET new_usage_scenario = description
WHERE project_mode = 'new_development' 
  AND new_usage_scenario IS NULL 
  AND description IS NOT NULL;

-- 將舊的 special_requirements 移到 new_special_requirements
UPDATE projects
SET new_special_requirements = special_requirements
WHERE project_mode = 'new_development' 
  AND special_requirements IS NOT NULL;

-- 將舊的 deliverables 移到 new_deliverables
UPDATE projects
SET new_deliverables = deliverables
WHERE deliverables IS NOT NULL;

-- 將舊的 communication_preference 移到 new_communication_preference
UPDATE projects
SET new_communication_preference = communication_preference
WHERE communication_preference IS NOT NULL;

-- Step 6: 將舊資料設定為全新開發模式
UPDATE projects 
SET project_mode = 'new_development' 
WHERE project_mode IS NULL;

-- Step 7: 建立索引
CREATE INDEX IF NOT EXISTS idx_projects_project_mode ON projects(project_mode);

-- 完成
DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '資料庫遷移完成！';
    RAISE NOTICE '========================================';
    RAISE NOTICE '新增欄位：';
    RAISE NOTICE '  全新開發: 12 個獨立欄位';
    RAISE NOTICE '  修改維護: 15 個獨立欄位';
    RAISE NOTICE '';
    RAISE NOTICE '舊資料處理：';
    RAISE NOTICE '  ✓ 已將舊資料遷移到新欄位';
    RAISE NOTICE '  ✓ 所有專案預設為全新開發模式';
    RAISE NOTICE '========================================';
END $$;

