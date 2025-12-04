# Backend 設定指南

## Python 版本要求

**✅ 推薦使用 Python 3.10+**

本專案使用 `psycopg` (psycopg3) 作為 PostgreSQL async driver，與 PgBouncer 完全相容。

## 安裝 Python 3.10

### 方法 1: 使用 pyenv (推薦)

```bash
# 安裝 pyenv
brew install pyenv

# 安裝 Python 3.10.13
pyenv install 3.10.13

# 在 backend 目錄設定本地版本
cd backend
pyenv local 3.10.13

# 驗證版本
python --version  # 應該顯示 Python 3.10.13
```

### 方法 2: 使用 conda

```bash
# 建立新的 conda 環境
conda create -n 200ok-backend python=3.10
conda activate 200ok-backend

# 驗證版本
python --version  # 應該顯示 Python 3.10.x
```

### 方法 3: 直接下載 Python 3.10

從 [Python 官網](https://www.python.org/downloads/) 下載 Python 3.10.x 安裝檔。

## 建立虛擬環境

```bash
cd backend

# 使用 Python 3.10 建立虛擬環境
python3.10 -m venv .venv

# 啟動虛擬環境
source .venv/bin/activate  # macOS/Linux
# 或
.venv\Scripts\activate  # Windows

# 升級 pip
pip install --upgrade pip

# 安裝依賴
pip install -r requirements.txt
```

## 驗證安裝

```bash
# 檢查 Python 版本
python --version  # 應該顯示 Python 3.10.x

# 檢查已安裝的套件
pip list | grep -E "(fastapi|sqlalchemy|psycopg|pydantic)"
```

## 常見問題

### Q: 安裝時出現編譯錯誤

**A:** 確保使用 Python 3.10，不要使用 Python 3.11、3.12 或 3.13。

### Q: 如何切換 Python 版本？

**A:** 使用 pyenv：
```bash
pyenv versions  # 查看所有已安裝的版本
pyenv local 3.10.13  # 設定本地版本
```

### Q: 虛擬環境中還是使用錯誤的 Python 版本

**A:** 刪除舊的虛擬環境，重新建立：
```bash
rm -rf .venv
python3.10 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

