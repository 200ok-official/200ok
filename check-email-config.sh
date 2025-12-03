#!/bin/bash

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}📧 200 OK - Resend 郵件配置檢查${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 載入 .env
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo -e "${GREEN}✅ 找到 .env 檔案${NC}"
else
    echo -e "${RED}❌ 找不到 .env 檔案${NC}"
fi

echo ""
echo -e "${YELLOW}📋 環境變數檢查${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 檢查 RESEND_API_KEY
if [ -z "$RESEND_API_KEY" ]; then
    echo -e "${RED}❌ RESEND_API_KEY 未設定${NC}"
else
    echo -e "${GREEN}✅ RESEND_API_KEY: ${RESEND_API_KEY:0:15}...${NC}"
fi

# 檢查 EMAIL_FROM
if [ -z "$EMAIL_FROM" ]; then
    echo -e "${RED}❌ EMAIL_FROM 未設定${NC}"
    echo -e "${YELLOW}   建議設定: EMAIL_FROM=200 OK <onboarding@resend.dev>${NC}"
else
    echo -e "${GREEN}✅ EMAIL_FROM: $EMAIL_FROM${NC}"
    
    # 檢查是否使用自定義域名
    if [[ $EMAIL_FROM == *"@resend.dev"* ]]; then
        echo -e "${BLUE}   ℹ️  使用 Resend 測試信箱（立即可用）${NC}"
    else
        echo -e "${YELLOW}   ⚠️  使用自定義域名，請確保已在 Resend 驗證${NC}"
        echo -e "${YELLOW}   驗證網址: https://resend.com/domains${NC}"
    fi
fi

# 檢查 NEXT_PUBLIC_APP_URL
if [ -z "$NEXT_PUBLIC_APP_URL" ]; then
    echo -e "${RED}❌ NEXT_PUBLIC_APP_URL 未設定${NC}"
    echo -e "${YELLOW}   建議設定: NEXT_PUBLIC_APP_URL=http://localhost:3000${NC}"
else
    echo -e "${GREEN}✅ NEXT_PUBLIC_APP_URL: $NEXT_PUBLIC_APP_URL${NC}"
    echo -e "${BLUE}   驗證連結會是: $NEXT_PUBLIC_APP_URL/verify-email?token=xxx${NC}"
fi

echo ""
echo -e "${YELLOW}📁 檔案檢查${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 檢查郵件相關檔案
files=(
    "src/lib/email.ts"
    "src/services/auth.service.ts"
    "src/app/api/v1/auth/register/route.ts"
    "src/app/verify-email/page.tsx"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ $file 不存在${NC}"
    fi
done

echo ""
echo -e "${YELLOW}🔧 程式碼檢查${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 檢查 email.ts 中的 Resend 初始化
if grep -q "new Resend(process.env.RESEND_API_KEY)" src/lib/email.ts 2>/dev/null; then
    echo -e "${GREEN}✅ Resend 初始化正確${NC}"
else
    echo -e "${RED}❌ Resend 初始化有問題${NC}"
fi

# 檢查註冊流程中的郵件發送
if grep -q "sendVerificationEmail" src/services/auth.service.ts 2>/dev/null; then
    echo -e "${GREEN}✅ 註冊流程包含郵件發送${NC}"
else
    echo -e "${RED}❌ 註冊流程缺少郵件發送${NC}"
fi

echo ""
echo -e "${YELLOW}📦 依賴套件檢查${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -f "package.json" ]; then
    if grep -q '"resend"' package.json; then
        RESEND_VERSION=$(grep '"resend"' package.json | sed 's/.*: "\([^"]*\)".*/\1/')
        echo -e "${GREEN}✅ resend 套件已安裝 (版本: $RESEND_VERSION)${NC}"
    else
        echo -e "${RED}❌ resend 套件未安裝${NC}"
        echo -e "${YELLOW}   請執行: npm install resend${NC}"
    fi
fi

echo ""
echo -e "${YELLOW}🧪 建議的測試步驟${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}1. 本地測試 Resend 連接：${NC}"
echo -e "   ${GREEN}node test-resend.js${NC}"
echo ""
echo -e "${BLUE}2. 啟動開發伺服器：${NC}"
echo -e "   ${GREEN}npm run dev${NC}"
echo ""
echo -e "${BLUE}3. 註冊測試帳號：${NC}"
echo -e "   ${GREEN}http://localhost:3000/register${NC}"
echo ""
echo -e "${BLUE}4. 查看 Resend 日誌：${NC}"
echo -e "   ${GREEN}https://resend.com/logs${NC}"
echo ""

echo -e "${YELLOW}☁️  Vercel 部署檢查${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}請確認 Vercel 環境變數：${NC}"
echo -e "   1. 前往 ${GREEN}https://vercel.com${NC}"
echo -e "   2. Settings → Environment Variables"
echo -e "   3. 確認以下變數存在："
echo -e "      ${YELLOW}RESEND_API_KEY${NC}"
echo -e "      ${YELLOW}EMAIL_FROM${NC}"
echo -e "      ${YELLOW}NEXT_PUBLIC_APP_URL${NC}"
echo -e "   4. 修改後記得重新部署！"
echo ""

echo -e "${YELLOW}📚 參考文件${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "詳細流程說明: ${GREEN}./REGISTER_EMAIL_FLOW.md${NC}"
echo -e "問題診斷指南: ${GREEN}./RESEND_DIAGNOSIS.md${NC}"
echo -e "快速設定指南: ${GREEN}./說明文件/郵件與Resend/QUICK_EMAIL_SETUP.md${NC}"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✨ 檢查完成！${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

