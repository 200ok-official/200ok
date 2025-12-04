# 快速設定：切換到 psycopg

## 🚀 三步驟完成遷移

### 步驟 1: 更新依賴

```bash
cd backend
source .venv/bin/activate

# 卸載舊的 asyncpg
pip uninstall asyncpg -y

# 安裝 psycopg（注意：zsh 需要使用引號）
pip install "psycopg[binary]==3.1.18"
```

### 步驟 2: 更新 DATABASE_URL

編輯 `backend/.env`，將 URL 中的 `asyncpg` 改為 `psycopg`：

```bash
# Before
DATABASE_URL=postgresql+asyncpg://postgres.xxxx:[PASSWORD]@...

# After  
DATABASE_URL=postgresql+psycopg://postgres.xxxx:[PASSWORD]@...
```

### 步驟 3: 測試並啟動

```bash
# 測試連線
python test_prepared_statements.py

# 啟動服務
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## ✅ 完成！

看到以下訊息表示成功：

```
🎉 測試通過！所有查詢都成功
✅ psycopg 的 prepared statements 已正確禁用 (prepare_threshold=0)
✅ 與 PgBouncer 完全相容！
```

## 🎯 為什麼這樣做？

- ✅ **解決 PgBouncer 問題**：psycopg 天然支援 PgBouncer transaction pooling
- ✅ **簡化設定**：只需一行 `prepare_threshold=0`
- ✅ **SQLAlchemy 官方推薦**：在 PgBouncer 環境的最佳選擇
- ✅ **無需修改程式碼**：所有 API 端點完全不需要改

## 📖 詳細說明

請參考 `PSYCOPG_MIGRATION.md`

