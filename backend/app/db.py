"""
資料庫連線設定
使用 SQLAlchemy Core + psycopg (psycopg3) async driver
不使用 ORM，速度快 10x，完美適配 PgBouncer 和 Cloud Run
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncConnection
from sqlalchemy import text, TypeDecorator, event
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.orm import DeclarativeBase
from typing import AsyncGenerator, Any, Optional
from contextlib import asynccontextmanager
from uuid import uuid4
from .config import settings


# ==================== Engine 設定 ====================
# 
# 使用 SQLAlchemy Core + psycopg (psycopg3)，完全沒有 ORM
# 優點：
# 1. psycopg 支援 prepare_threshold=None，完美解決 PgBouncer prepared statement 問題
# 2. 純 Python driver，跨平台相容性好
# 3. 速度是 ORM 10x
# 4. 完美適配 Cloud Run（省 connection 數）
#
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,  # 關閉 SQL 日誌以簡化輸出（如需除錯可改為 True）
    pool_size=5,  # Connection pool 大小
    max_overflow=10,  # 最多額外建立的連線數
    pool_pre_ping=False,  # 關閉 pre-ping（避免 prepared statements）
    pool_recycle=300,  # 5 分鐘回收連線（PgBouncer transaction pooling 建議較短時間）
    # 禁用 SQLAlchemy 的 prepared statement 功能（PgBouncer 相容）
    execution_options={
        "compiled_cache": None,  # 禁用 SQLAlchemy SQL 編譯快取
        "schema_translate_map": None,  # 禁用 schema 轉換
    },
    # 直接在 psycopg 連接參數中設置 prepare_threshold=None
    connect_args={
        "prepare_threshold": None,  # 完全禁用 prepared statements（適配 Supabase pooler / PgBouncer）
    },
    # 使用原生 SQL 模式，不進行任何預處理
    future=True,
)


# ==================== Base 和 EnumTypeDecorator（供 models 參考用） ====================

# Base class for models（保留供 models 參考，但實際不使用 ORM）
class Base(DeclarativeBase):
    """ORM Base class（保留供 models 參考用）"""
    pass


class EnumTypeDecorator(TypeDecorator):
    """通用的 enum 類型裝飾器（保留供 models 參考用）"""
    impl = ENUM
    cache_ok = True
    
    def __init__(self, enum_class, **kwargs):
        self.enum_class = enum_class
        kwargs.setdefault('values_callable', lambda x: [e.value for e in x])
        super().__init__(enum_class, **kwargs)
    
    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, self.enum_class):
            return value.value
        return value
    
    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, str):
            try:
                for e in self.enum_class:
                    if e.value == value:
                        return e
                return self.enum_class[value.upper()]
            except (ValueError, KeyError):
                return value
        return value


# ==================== FastAPI Dependency ====================

@asynccontextmanager
async def get_db_connection():
    """
    取得資料庫連線（用於 context manager）
    
    使用方式:
    ```python
    async with get_db_connection() as conn:
        result = await conn.execute(text("SELECT * FROM users"))
    ```
    """
    async with engine.begin() as conn:
        # 不需要 DEALLOCATE ALL，因為已設定 prepare_threshold=None
        # PgBouncer transaction pooling 會自動處理連線狀態
        yield conn


async def get_db() -> AsyncGenerator[AsyncConnection, None]:
    """
    FastAPI Dependency: 提供資料庫連線
    
    使用方式:
    ```python
    from sqlalchemy import text
    
    async def some_endpoint(db = Depends(get_db)):
        result = await db.execute(
            text("SELECT * FROM users WHERE id = :id"),
            {"id": user_id}
        )
        rows = result.mappings().all()
    ```
    
    注意：
    - 使用 text() 包裝 SQL
    - 使用 :param_name 作為參數佔位符
    - 使用 result.mappings().all() 取得 dict-like 結果
    - 使用 result.fetchone() 取得單筆
    - 使用 result.fetchall() 取得所有筆
    - 使用 result.scalar() 取得單一值
    - psycopg 已設定 prepare_threshold=None，天然相容 PgBouncer
    """
    async with engine.begin() as conn:
        # 不需要 DEALLOCATE ALL，因為已設定 prepare_threshold=None
        # PgBouncer transaction pooling 會自動處理連線狀態
        yield conn


# ==================== 執行 Raw Query 的輔助函數 ====================

def parse_pg_array(value: Any) -> Optional[list]:
    """
    將 psycopg 返回的 PostgreSQL array 字串轉換為 Python list
    
    psycopg 返回格式: '{item1,item2,item3}'
    asyncpg 返回格式: ['item1', 'item2', 'item3']
    
    此函數確保與 asyncpg 的行為一致
    
    範例:
    - '{client,freelancer}' -> ['client', 'freelancer']
    - '{}' -> []
    - None -> None
    - ['already', 'list'] -> ['already', 'list']
    """
    if value is None:
        return None
    if isinstance(value, list):
        return value  # 已經是 list
    if isinstance(value, str):
        # 移除外層的大括號並分割
        if value.startswith('{') and value.endswith('}'):
            value = value[1:-1]
        if not value:  # 空 array
            return []
        return value.split(',')
    return value


async def execute_query(query: str, params: dict = None):
    """
    執行查詢並返回結果（獨立連線）
    
    用於需要獨立事務的場景
    """
    async with engine.begin() as conn:
        result = await conn.execute(text(query), params or {})
        return result


async def execute_many(query: str, params_list: list[dict]):
    """
    批次執行（獨立連線）
    """
    async with engine.begin() as conn:
        await conn.execute(text(query), params_list)


# ==================== 生命週期管理 ====================

async def close_db():
    """關閉資料庫連線池"""
    await engine.dispose()

