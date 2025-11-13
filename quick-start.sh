#!/bin/bash

# 200 OK 快速開始腳本
echo "🚀 200 OK 專案快速設置"
echo "========================"

# 檢查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安裝，請先安裝 Node.js 18+"
    exit 1
fi

# 檢查 npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安裝"
    exit 1
fi

echo "✅ Node.js $(node -v) 已安裝"
echo "✅ npm $(npm -v) 已安裝"

# 安裝依賴
echo ""
echo "📦 安裝專案依賴..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ 依賴安裝失敗"
    exit 1
fi

echo "✅ 依賴安裝完成"

# 檢查 .env 檔案
if [ ! -f ".env" ]; then
    echo ""
    echo "📝 建立環境變數檔案..."
    cp .env.example .env
    echo "✅ 已建立 .env 檔案"
    echo ""
    echo "⚠️  請編輯 .env 檔案並設定以下變數："
    echo "   - DATABASE_URL (請參考 DATABASE_SETUP.md)"
    echo "   - JWT_SECRET (請設定強密碼)"
    echo "   - NEXTAUTH_SECRET (請設定密碼)"
    echo ""
    echo "設定完成後，執行以下命令繼續："
    echo "npm run dev"
else
    echo "✅ .env 檔案已存在"

    # 檢查是否需要繼續設置
    echo ""

    echo "🚀 啟動開發伺服器..."
    npm run dev
fi
