#!/bin/bash

# 測試後端 AI 生成專案標題和描述功能
# 直接打後端 API：POST /api/v1/projects

# 顏色設定
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 檢查 jq 是否安裝
if ! command -v jq &> /dev/null; then
    echo -e "${RED}錯誤：需要安裝 jq 工具${NC}"
    echo "安裝方式："
    echo "  macOS: brew install jq"
    echo "  Ubuntu/Debian: sudo apt install jq"
    exit 1
fi

# API 設定
API_BASE="https://superb-backend-1041765261654.asia-east1.run.app"

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}後端 AI 生成標題/描述測試${NC}"
echo -e "${BLUE}================================${NC}"
echo ""
echo -e "${YELLOW}API Base: ${NC}${API_BASE}"
echo ""

# 提示用戶登入取得 token
echo -e "${YELLOW}請先登入取得 access token${NC}"
echo ""
echo "方式 1: 使用現有帳號登入"
read -p "請輸入 Email: " EMAIL
read -sp "請輸入密碼: " PASSWORD
echo ""
echo ""

# 登入取得 token
echo -e "${BLUE}正在登入...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST \
  "${API_BASE}/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${EMAIL}\",
    \"password\": \"${PASSWORD}\"
  }")

# 檢查登入是否成功
if echo "$LOGIN_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.access_token')
    echo -e "${GREEN}✅ 登入成功${NC}"
    echo ""
else
    ERROR_MSG=$(echo "$LOGIN_RESPONSE" | jq -r '.detail // "未知錯誤"')
    echo -e "${RED}❌ 登入失敗: ${ERROR_MSG}${NC}"
    exit 1
fi

# ========================================
# 測試 1: 全新開發專案（餐廳訂位系統）
# ========================================
echo -e "${YELLOW}測試 1: 全新開發專案 - 餐廳訂位系統${NC}"
echo -e "${GREEN}專案資訊：${NC}"
echo "  類型：網頁應用"
echo "  使用場景：餐廳需要一個線上訂位系統"
echo "  目標：提供顧客便利的訂位體驗"
echo "  描述：線上選擇時間和人數，系統自動確認座位"
echo ""

PROJECT_DATA_1='{
  "project_mode": "new_development",
  "project_type": "網頁應用",
  "description": "我想做一個餐廳訂位系統，顧客可以在線上選擇時間和人數，系統會自動確認是否有位置。餐廳老闆可以在後台管理訂位記錄，並設定每個時段的座位數量。",
  "new_usage_scenario": "餐廳需要一個線上訂位系統，顧客可以透過網頁選擇日期、時間和人數，減少電話訂位的等待時間",
  "new_goals": "提供顧客便利的訂位體驗，減少電話訂位的人力成本，提升餐廳營運效率，並能即時掌握訂位狀況",
  "new_features": ["線上訂位", "座位管理", "訂位查詢", "後台管理"],
  "budget_min": 50000,
  "budget_max": 150000,
  "required_skills": ["React", "Node.js", "資料庫設計"],
  "title": "測試專案"
}'

echo -e "${BLUE}發送請求到後端...${NC}"
RESPONSE_1=$(curl -s -X POST \
  "${API_BASE}/api/v1/projects" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -d "$PROJECT_DATA_1")

# 檢查回應
if echo "$RESPONSE_1" | jq -e '.success' > /dev/null 2>&1; then
    PROJECT_ID_1=$(echo "$RESPONSE_1" | jq -r '.data.id')
    AI_TITLE_1=$(echo "$RESPONSE_1" | jq -r '.data.title')
    AI_SUMMARY_1=$(echo "$RESPONSE_1" | jq -r '.data.ai_summary // "未生成"')
    
    echo -e "${GREEN}✅ 專案創建成功${NC}"
    echo -e "${BLUE}專案 ID: ${NC}${PROJECT_ID_1}"
    echo ""
    echo -e "${GREEN}📝 AI 生成的標題：${NC}"
    echo "  ${AI_TITLE_1}"
    CHAR_COUNT_1=$(echo -n "$AI_TITLE_1" | wc -m | xargs)
    echo -e "${BLUE}  字數：${NC}${CHAR_COUNT_1}"
    
    if [ "$CHAR_COUNT_1" -gt 15 ]; then
        echo -e "${RED}  ⚠️  標題超過 15 字！${NC}"
    else
        echo -e "${GREEN}  ✅ 字數符合要求（5-15字）${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}📄 AI 生成的摘要：${NC}"
    if [ "$AI_SUMMARY_1" != "未生成" ] && [ "$AI_SUMMARY_1" != "null" ]; then
        echo "  ${AI_SUMMARY_1}"
        SUMMARY_COUNT_1=$(echo -n "$AI_SUMMARY_1" | wc -m | xargs)
        echo -e "${BLUE}  字數：${NC}${SUMMARY_COUNT_1}"
    else
        echo -e "${YELLOW}  未生成摘要（可能 Gemini API Key 未設定）${NC}"
    fi
else
    ERROR_1=$(echo "$RESPONSE_1" | jq -r '.detail // "未知錯誤"')
    echo -e "${RED}❌ 創建失敗: ${ERROR_1}${NC}"
fi

echo ""
echo "---"
echo ""

# ========================================
# 測試 2: 維護專案（進銷存系統）
# ========================================
echo -e "${YELLOW}測試 2: 維護專案 - 進銷存系統優化${NC}"
echo -e "${GREEN}專案資訊：${NC}"
echo "  系統名稱：公司內部進銷存系統"
echo "  類型：系統維護"
echo "  描述：效能優化並新增報表功能"
echo ""

PROJECT_DATA_2='{
  "project_mode": "maintenance_modification",
  "project_type": "系統維護與功能擴充",
  "description": "目前系統在處理大量訂單時會變慢，需要優化效能並新增報表功能。希望能夠改善資料庫查詢效率，並加入銷售分析報表。",
  "maint_system_name": "公司內部進銷存系統",
  "maint_system_purpose": "管理公司的進貨、銷售和庫存",
  "maint_current_problems": "處理大量訂單時系統變慢，查詢速度緩慢",
  "maint_desired_improvements": "優化資料庫查詢效率，加快系統回應速度，新增銷售分析報表",
  "maint_current_users_count": 20,
  "budget_min": 80000,
  "budget_max": 200000,
  "required_skills": ["資料庫優化", "SQL", "報表設計"],
  "title": "測試專案"
}'

echo -e "${BLUE}發送請求到後端...${NC}"
RESPONSE_2=$(curl -s -X POST \
  "${API_BASE}/api/v1/projects" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -d "$PROJECT_DATA_2")

# 檢查回應
if echo "$RESPONSE_2" | jq -e '.success' > /dev/null 2>&1; then
    PROJECT_ID_2=$(echo "$RESPONSE_2" | jq -r '.data.id')
    AI_TITLE_2=$(echo "$RESPONSE_2" | jq -r '.data.title')
    AI_SUMMARY_2=$(echo "$RESPONSE_2" | jq -r '.data.ai_summary // "未生成"')
    
    echo -e "${GREEN}✅ 專案創建成功${NC}"
    echo -e "${BLUE}專案 ID: ${NC}${PROJECT_ID_2}"
    echo ""
    echo -e "${GREEN}📝 AI 生成的標題：${NC}"
    echo "  ${AI_TITLE_2}"
    CHAR_COUNT_2=$(echo -n "$AI_TITLE_2" | wc -m | xargs)
    echo -e "${BLUE}  字數：${NC}${CHAR_COUNT_2}"
    
    if [ "$CHAR_COUNT_2" -gt 15 ]; then
        echo -e "${RED}  ⚠️  標題超過 15 字！${NC}"
    else
        echo -e "${GREEN}  ✅ 字數符合要求（5-15字）${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}📄 AI 生成的摘要：${NC}"
    if [ "$AI_SUMMARY_2" != "未生成" ] && [ "$AI_SUMMARY_2" != "null" ]; then
        echo "  ${AI_SUMMARY_2}"
        SUMMARY_COUNT_2=$(echo -n "$AI_SUMMARY_2" | wc -m | xargs)
        echo -e "${BLUE}  字數：${NC}${SUMMARY_COUNT_2}"
    else
        echo -e "${YELLOW}  未生成摘要（可能 Gemini API Key 未設定）${NC}"
    fi
else
    ERROR_2=$(echo "$RESPONSE_2" | jq -r '.detail // "未知錯誤"')
    echo -e "${RED}❌ 創建失敗: ${ERROR_2}${NC}"
fi

echo ""
echo "---"
echo ""

# ========================================
# 測試 3: 極端情況（超長描述的 ERP 系統）
# ========================================
echo -e "${YELLOW}測試 3: 極端情況 - 超長描述的 ERP 系統${NC}"
echo -e "${GREEN}測試長描述是否會產生過長標題${NC}"
echo ""

PROJECT_DATA_3='{
  "project_mode": "new_development",
  "project_type": "企業資源規劃系統（ERP）",
  "description": "我們公司目前使用多個獨立的系統處理不同部門的業務，資料分散且難以整合，造成作業效率低落和資料不一致的問題。我們希望開發一套完整的ERP系統，整合所有部門的作業流程。主要功能包括：財務管理（總帳、應收應付、資產管理）、人資管理（薪資、考勤、招募）、庫存管理（進銷存、倉儲）、採購管理（請購、詢價、訂單）、銷售管理（報價、訂單、出貨）、生產管理（BOM、工單、產能規劃）。系統需要提供豐富的報表和儀表板，支援行動裝置存取。",
  "new_usage_scenario": "中小企業需要一套完整的企業資源規劃系統，整合財務、人資、庫存、採購、銷售等所有部門的作業流程，提供即時的經營數據分析，協助管理層做出更好的決策。系統需要支援多幣別、多語言、多公司架構。",
  "new_goals": "建立一套完整的企業資源規劃系統，整合公司內部所有作業流程，提升工作效率，降低營運成本，強化決策品質。系統需具備高度彈性和擴充性，能夠隨著公司成長而調整。",
  "new_features": ["財務管理", "人資管理", "庫存管理", "採購管理", "銷售管理", "生產管理", "報表分析", "行動支援"],
  "budget_min": 500000,
  "budget_max": 2000000,
  "required_skills": ["Java", "Spring Boot", "PostgreSQL", "React", "微服務架構"],
  "title": "測試專案"
}'

echo -e "${BLUE}發送請求到後端...${NC}"
RESPONSE_3=$(curl -s -X POST \
  "${API_BASE}/api/v1/projects" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -d "$PROJECT_DATA_3")

# 檢查回應
if echo "$RESPONSE_3" | jq -e '.success' > /dev/null 2>&1; then
    PROJECT_ID_3=$(echo "$RESPONSE_3" | jq -r '.data.id')
    AI_TITLE_3=$(echo "$RESPONSE_3" | jq -r '.data.title')
    AI_SUMMARY_3=$(echo "$RESPONSE_3" | jq -r '.data.ai_summary // "未生成"')
    
    echo -e "${GREEN}✅ 專案創建成功${NC}"
    echo -e "${BLUE}專案 ID: ${NC}${PROJECT_ID_3}"
    echo ""
    echo -e "${GREEN}📝 AI 生成的標題：${NC}"
    echo "  ${AI_TITLE_3}"
    CHAR_COUNT_3=$(echo -n "$AI_TITLE_3" | wc -m | xargs)
    echo -e "${BLUE}  字數：${NC}${CHAR_COUNT_3}"
    
    if [ "$CHAR_COUNT_3" -gt 15 ]; then
        echo -e "${RED}  ⚠️  標題超過 15 字！${NC}"
    else
        echo -e "${GREEN}  ✅ 字數符合要求（5-15字）${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}📄 AI 生成的摘要：${NC}"
    if [ "$AI_SUMMARY_3" != "未生成" ] && [ "$AI_SUMMARY_3" != "null" ]; then
        echo "  ${AI_SUMMARY_3}"
        SUMMARY_COUNT_3=$(echo -n "$AI_SUMMARY_3" | wc -m | xargs)
        echo -e "${BLUE}  字數：${NC}${SUMMARY_COUNT_3}"
    else
        echo -e "${YELLOW}  未生成摘要（可能 Gemini API Key 未設定）${NC}"
    fi
else
    ERROR_3=$(echo "$RESPONSE_3" | jq -r '.detail // "未知錯誤"')
    echo -e "${RED}❌ 創建失敗: ${ERROR_3}${NC}"
fi

echo ""
echo "---"
echo ""

# ========================================
# 清理測試資料（可選）
# ========================================
echo -e "${YELLOW}是否刪除測試專案？ (y/n)${NC}"
read -p "> " DELETE_CONFIRM

if [ "$DELETE_CONFIRM" = "y" ] || [ "$DELETE_CONFIRM" = "Y" ]; then
    echo ""
    echo -e "${BLUE}正在刪除測試專案...${NC}"
    
    for PROJECT_ID in "$PROJECT_ID_1" "$PROJECT_ID_2" "$PROJECT_ID_3"; do
        if [ ! -z "$PROJECT_ID" ] && [ "$PROJECT_ID" != "null" ]; then
            curl -s -X DELETE \
              "${API_BASE}/api/v1/projects/${PROJECT_ID}" \
              -H "Authorization: Bearer ${ACCESS_TOKEN}" > /dev/null
            echo -e "${GREEN}✅ 已刪除專案: ${PROJECT_ID}${NC}"
        fi
    done
else
    echo -e "${YELLOW}保留測試專案，請手動到網站刪除${NC}"
fi

echo ""
echo "---"
echo ""

# ========================================
# 總結
# ========================================
echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}測試總結${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# 檢查標題字數
TITLE_OVER_LIMIT=0
TITLE_OK_COUNT=0

for i in 1 2 3; do
    CHAR_VAR="CHAR_COUNT_${i}"
    if [ ! -z "${!CHAR_VAR}" ]; then
        if [ "${!CHAR_VAR}" -gt 15 ]; then
            TITLE_OVER_LIMIT=1
        else
            TITLE_OK_COUNT=$((TITLE_OK_COUNT + 1))
        fi
    fi
done

echo "標題字數統計："
[ ! -z "$CHAR_COUNT_1" ] && echo "  1. 餐廳訂位系統: ${CHAR_COUNT_1} 字"
[ ! -z "$CHAR_COUNT_2" ] && echo "  2. 進銷存系統: ${CHAR_COUNT_2} 字"
[ ! -z "$CHAR_COUNT_3" ] && echo "  3. ERP 系統: ${CHAR_COUNT_3} 字"
echo ""

if [ "$TITLE_OVER_LIMIT" -eq 1 ]; then
    echo -e "${RED}⚠️  發現問題：有標題超過 15 字限制${NC}"
    echo ""
    echo -e "${YELLOW}建議修正：${NC}"
    echo "1. 檢查後端 gemini_service.py 的 generate_project_title 函數"
    echo "2. 確認 prompt 中的字數限制說明是否清楚"
    echo "3. 檢查字數計算和截斷邏輯是否正確"
    echo "4. 考慮降低 temperature 參數（目前是 0.5）"
else
    echo -e "${GREEN}✅ 所有標題字數都符合要求（5-15字）${NC}"
fi

echo ""
echo -e "${BLUE}測試完成！${NC}"
echo ""
echo "查看完整回應可至："
[ ! -z "$PROJECT_ID_1" ] && echo "  ${API_BASE}/api/v1/projects/${PROJECT_ID_1}"
[ ! -z "$PROJECT_ID_2" ] && echo "  ${API_BASE}/api/v1/projects/${PROJECT_ID_2}"
[ ! -z "$PROJECT_ID_3" ] && echo "  ${API_BASE}/api/v1/projects/${PROJECT_ID_3}"
