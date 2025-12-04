#!/bin/bash
# 更新 DATABASE_URL 的輔助腳本

echo "🔧 Supabase DATABASE_URL 更新工具"
echo "=================================="
echo ""

# 檢查 .env 是否存在
if [ ! -f .env ]; then
    echo "❌ .env 文件不存在"
    echo "📝 從 env.example 建立 .env..."
    if [ -f env.example ]; then
        cp env.example .env
        echo "✅ 已建立 .env"
    else
        echo "❌ env.example 也不存在！"
        exit 1
    fi
fi

echo "請選擇連接方式："
echo ""
echo "1) Connection Pooling (推薦) - 端口 6543"
echo "2) Direct Connection - 端口 5432"
echo ""
read -p "請輸入選項 (1 或 2): " choice

case $choice in
    1)
        echo ""
        echo "📋 Connection Pooling 連接字串範例："
        echo "postgresql+psycopg://postgres.xxxx:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
        echo ""
        ;;
    2)
        echo ""
        echo "📋 Direct Connection 連接字串範例："
        echo "postgresql+psycopg://postgres:[PASSWORD]@db.xxxx.supabase.co:5432/postgres"
        echo ""
        ;;
    *)
        echo "❌ 無效選項"
        exit 1
        ;;
esac

echo "請從 Supabase Dashboard 複製完整的連接字串"
echo "並確保："
echo "  - 使用 postgresql+psycopg:// 開頭（psycopg 支援 async 且與 PgBouncer 相容）"
echo "  - 包含正確的密碼"
echo ""
read -p "請輸入完整的 DATABASE_URL: " new_url

if [ -z "$new_url" ]; then
    echo "❌ URL 不能為空"
    exit 1
fi

# 驗證 URL 格式
if [[ ! $new_url =~ ^postgresql ]]; then
    echo "❌ URL 格式錯誤，應該以 postgresql 開頭"
    exit 1
fi

# 備份原有 .env
cp .env .env.backup
echo "💾 已備份原有 .env 到 .env.backup"

# 更新 DATABASE_URL
if grep -q "^DATABASE_URL=" .env; then
    # 使用 sed 更新（macOS 相容）
    sed -i '' "s|^DATABASE_URL=.*|DATABASE_URL=$new_url|" .env
    echo "✅ 已更新 DATABASE_URL"
else
    echo "DATABASE_URL=$new_url" >> .env
    echo "✅ 已新增 DATABASE_URL"
fi

echo ""
echo "🎉 完成！"
echo ""
echo "接下來請執行測試："
echo "  source .venv/bin/activate"
echo "  python test_db_connection.py"

