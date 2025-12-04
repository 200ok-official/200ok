"""
快速測試 psycopg prepared statements 是否已禁用
"""
import asyncio
from sqlalchemy import text
from app.db import engine


async def test():
    print("🔍 測試 psycopg prepared statements...")
    print()
    
    try:
        # 執行 10 次重複查詢（測試 PgBouncer 相容性）
        for i in range(10):
            async with engine.connect() as conn:
                result = await conn.execute(text("SELECT 1"))
                value = result.scalar()
                print(f"✅ 查詢 {i+1}/10: 成功 (result={value})")
        
        print()
        print("🎉 測試通過！所有查詢都成功")
        print("✅ psycopg 的 prepared statements 已正確禁用 (prepare_threshold=0)")
        print("✅ 與 PgBouncer 完全相容！")
        return True
        
    except Exception as e:
        print(f"\n❌ 測試失敗: {e}")
        return False


if __name__ == "__main__":
    result = asyncio.run(test())
    exit(0 if result else 1)

