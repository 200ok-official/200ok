#!/bin/bash
# 快速設定 Python 3.10 環境

echo "🔍 檢查 Python 版本..."

# 檢查是否已安裝 pyenv
if ! command -v pyenv &> /dev/null; then
    echo "❌ pyenv 未安裝"
    echo "📦 正在安裝 pyenv..."
    brew install pyenv
    echo 'eval "$(pyenv init -)"' >> ~/.zshrc
    eval "$(pyenv init -)"
fi

# 檢查是否已安裝 Python 3.10
if ! pyenv versions | grep -q "3.10"; then
    echo "📦 正在安裝 Python 3.10.13..."
    pyenv install 3.10.13
fi

# 設定本地版本
echo "⚙️  設定本地 Python 版本為 3.10.13..."
pyenv local 3.10.13

# 驗證版本
PYTHON_VERSION=$(python --version 2>&1 | grep -oP 'Python \K[0-9]+\.[0-9]+')
if [[ "$PYTHON_VERSION" == "3.10" ]]; then
    echo "✅ Python 版本正確: $(python --version)"
    
    # 重新建立虛擬環境
    if [ -d ".venv" ]; then
        echo "🗑️  刪除舊的虛擬環境..."
        rm -rf .venv
    fi
    
    echo "📦 建立新的虛擬環境..."
    python -m venv .venv
    
    echo "✅ 完成！請執行："
    echo "   source .venv/bin/activate"
    echo "   pip install --upgrade pip"
    echo "   pip install -r requirements.txt"
else
    echo "❌ Python 版本錯誤: $(python --version)"
    echo "   請手動設定 Python 3.10"
fi
