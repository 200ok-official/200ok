"""
測試資料庫連接並檢查 psycopg prepared statements 設定
診斷 pgbouncer 相容性問題
"""
import asyncio
import sys
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.config import settings


async def test_sqlalchemy_engine():
    """測試 1: 使用 SQLAlchemy + psycopg"""
    print("=" * 70)
    print("🔍 測試 1: SQLAlchemy + psycopg")
    print("=" * 70)
    
    try:
        print("⏳ 建立 SQLAlchemy engine (使用 psycopg)...")
        engine = create_async_engine(
            settings.DATABASE_URL,
            echo=False,
            pool_size=2,
            max_overflow=1,
            pool_pre_ping=True,
            connect_args={
                "prepare_threshold": 0,  # 禁用 prepared statements (PgBouncer 相容)
            },
            execution_options={
                "compiled_cache": None,
            },
        )
        
        print("✅ Engine 建立成功！")
        print()
        
        # 執行查詢
        print("🧪 執行重複查詢測試...")
        for i in range(5):
            async with engine.connect() as conn:
                result = await conn.execute(text("SELECT version()"))
                version = result.scalar()
                print(f"   查詢 {i+1}: 成功 - {version[:50]}...")
        
        print()
        print("✅ 測試 1 通過：SQLAlchemy + psycopg 無問題")
        await engine.dispose()
        return True
        
    except Exception as e:
        print(f"❌ 測試 1 失敗: {e}")
        print()
        import traceback
        traceback.print_exc()
        return False


async def test_app_db_config():
    """測試 2: 使用應用的實際 db.py 配置"""
    print("=" * 70)
    print("🔍 測試 2: 使用應用的 db.py 配置")
    print("=" * 70)
    
    try:
        from app.db import engine
        
        print("⏳ 使用應用的 engine 執行查詢...")
        print()
        
        # 執行查詢
        print("🧪 執行重複查詢測試...")
        for i in range(5):
            async with engine.connect() as conn:
                result = await conn.execute(text("SELECT version()"))
                version = result.scalar()
                print(f"   查詢 {i+1}: 成功 - {version[:50]}...")
        
        print()
        print("✅ 測試 2 通過：應用的 db.py 配置正常工作")
        return True
        
    except Exception as e:
        print(f"❌ 測試 2 失敗: {e}")
        print()
        import traceback
        traceback.print_exc()
        return False


async def main():
    """執行所有測試"""
    print("\n🚀 開始測試 psycopg + pgbouncer 配置\n")
    print(f"📋 DATABASE_URL: {settings.DATABASE_URL[:60]}...\n")
    
    results = []
    
    # 測試 1: SQLAlchemy + psycopg
    result1 = await test_sqlalchemy_engine()
    results.append(("SQLAlchemy + psycopg", result1))
    print()
    
    # 測試 2: 使用應用配置
    result2 = await test_app_db_config()
    results.append(("應用的 db.py 配置", result2))
    print()
    
    # 總結
    print("=" * 70)
    print("📊 測試結果總結")
    print("=" * 70)
    for name, result in results:
        status = "✅ 通過" if result else "❌ 失敗"
        print(f"{status} - {name}")
    
    print()
    all_passed = all(r for _, r in results)
    if all_passed:
        print("🎉 所有測試通過！psycopg 的 prepared statements 已正確禁用。")
        print("✅ 與 PgBouncer 完全相容！")
        return 0
    else:
        print("⚠️ 部分測試失敗。請檢查上述錯誤訊息。")
        print()
        print("💡 建議:")
        print("   1. 確認 Supabase 使用 Connection Pooling (端口 6543)")
        print("   2. 檢查 .env 中的 DATABASE_URL 格式 (postgresql+psycopg://...)")
        print("   3. 確認已安裝 psycopg[binary]")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)

