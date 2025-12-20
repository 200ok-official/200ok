"""
200ok Backend API (FastAPI)
獨立後端，直連 Supabase Postgres
"""
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from contextlib import asynccontextmanager
import logging

from .config import settings
from .db import close_db
from .api.v1 import (
    auth,
    projects,
    users,
    bids,
    conversations,
    tokens,
    reviews,
    saved_projects,
    connections,
    admin,
    test_email # 測試郵件
)


# 設定 logging
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 減少 SQLAlchemy 和 psycopg 的日誌輸出
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
logging.getLogger("sqlalchemy.pool").setLevel(logging.WARNING)
logging.getLogger("sqlalchemy.dialects").setLevel(logging.WARNING)
# logging.getLogger("psycopg").setLevel(logging.WARNING)


# Lifespan event handler
@asynccontextmanager
async def lifespan(app: FastAPI):
    """應用程式生命週期管理"""
    logger.info("🚀 Starting 200ok Backend API...")
    logger.info(f"📝 Debug mode: {settings.DEBUG}")
    logger.info(f"🔗 Database: {settings.DATABASE_URL.split('@')[1] if '@' in settings.DATABASE_URL else 'configured'}")
    
    yield
    
    # 關閉資料庫連線
    logger.info("🔌 Closing database connections...")
    await close_db()
    logger.info("👋 Shutdown complete")


# 建立 FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="200ok 接案平台後端 API - 獨立 FastAPI 後端，直連 Supabase Postgres",
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,  # 生產環境關閉 docs
    redoc_url="/redoc" if settings.DEBUG else None,
)


# ==================== Middleware ====================

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== Exception Handlers ====================

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """處理 Pydantic 驗證錯誤"""
    errors = []
    for error in exc.errors():
        field = " -> ".join(str(loc) for loc in error["loc"])
        errors.append({
            "field": field,
            "message": error["msg"],
            "type": error["type"]
        })
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "message": "請求資料驗證失敗",
            "detail": {"errors": errors}
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """處理一般例外"""
    # 過濾掉常見的資料庫錯誤（PgBouncer transaction pooling 相關）
    # 這些錯誤是預期的，不需要記錄
    error_str = str(exc)
    error_type = type(exc).__name__
    
    # 需要靜默處理的錯誤類型
    silent_errors = [
        "DuplicatePreparedStatement",
        "InFailedSqlTransaction",
        "prepared statement",
        "current transaction is aborted",
    ]
    
    # 檢查是否為需要靜默的錯誤
    should_silence = any(
        silent_error.lower() in error_str.lower() or silent_error in error_type
        for silent_error in silent_errors
    )
    
    if not should_silence:
        # 只記錄非預期的錯誤
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    # 開發環境顯示詳細錯誤
    if settings.DEBUG:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "message": "伺服器錯誤",
                "detail": {"error": str(exc), "type": type(exc).__name__}
            }
        )
    
    # 生產環境隱藏詳細錯誤
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "伺服器錯誤，請稍後再試"
        }
    )


# ==================== Routes ====================

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "success": True,
        "message": "200ok Backend API",
        "version": settings.APP_VERSION,
        "docs": "/docs" if settings.DEBUG else "disabled in production"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "success": True,
        "status": "healthy",
        "version": settings.APP_VERSION
    }


# ==================== API Routes ====================

# Include all routers
app.include_router(auth.router, prefix="/api/v1", tags=["auth"])
app.include_router(projects.router, prefix="/api/v1", tags=["projects"])
app.include_router(users.router, prefix="/api/v1", tags=["users"])
app.include_router(bids.router, prefix="/api/v1", tags=["bids"])
app.include_router(conversations.router, prefix="/api/v1", tags=["conversations"])
app.include_router(tokens.router, prefix="/api/v1", tags=["tokens"])
app.include_router(reviews.router, prefix="/api/v1", tags=["reviews"])
app.include_router(saved_projects.router, prefix="/api/v1", tags=["saved-projects"])
app.include_router(connections.router, prefix="/api/v1", tags=["connections"])
app.include_router(admin.router, prefix="/api/v1", tags=["admin"])
app.include_router(test_email.router, prefix="/api/v1", tags=["test-email"])


# ==================== 啟動說明 ====================

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info"
    )

