"""
應用程式設定
讀取環境變數，提供全局配置
"""
from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List, Union


class Settings(BaseSettings):
    """應用程式設定"""
    
    # 應用程式基本資訊
    APP_NAME: str = "200ok Backend API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # 資料庫連線（直連 Supabase Postgres）
    DATABASE_URL: str
    # 格式: postgresql+psycopg://user:password@host:port/database
    # psycopg (psycopg3) 是 async driver，與 PgBouncer 完全相容
    
    # JWT 設定
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS 設定
    CORS_ORIGINS: Union[str, List[str]] = ["http://localhost:3000", "http://localhost:3001"]
    
    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        """將逗號分隔的字串轉換為列表"""
        if isinstance(v, str):
            # 移除空白並分割
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v
    
    # Email 設定 (Resend)
    RESEND_API_KEY: str = ""
    RESEND_FROM_EMAIL: str = "noreply@200ok.tw"
    
    # 前端 URL（用於生成驗證連結）
    FRONTEND_URL: str = "http://localhost:3000"
    
    # 代幣系統設定
    TOKEN_UNLOCK_DIRECT_COST: int = 200
    TOKEN_SUBMIT_PROPOSAL_COST: int = 100
    TOKEN_VIEW_PROPOSAL_COST: int = 50
    TOKEN_NEW_USER_GIFT: int = 1000
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# 全局設定實例
settings = Settings()

