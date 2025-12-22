"""
Auth related schemas
"""
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field, field_validator
from ..models.user import UserRole


class RegisterRequest(BaseModel):
    """註冊請求"""
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    roles: List[UserRole] = Field(default=[UserRole.CLIENT])
    
    @field_validator('password')
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError('密碼至少需要 8 個字元')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "張小明",
                "email": "user@example.com",
                "password": "secure_password_123",
                "roles": ["client"]
            }
        }


class LoginRequest(BaseModel):
    """登入請求"""
    email: EmailStr
    password: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "your_password"
            }
        }


class RefreshTokenRequest(BaseModel):
    """刷新 Token 請求"""
    refresh_token: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            }
        }


class UserInfo(BaseModel):
    """使用者基本資訊"""
    id: UUID
    name: str
    email: str
    roles: List[str]
    avatar_url: Optional[str] = None
    
    class Config:
        from_attributes = True


class TokenPair(BaseModel):
    """Token 對"""
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"


class AuthResponse(BaseModel):
    """認證回應（登入/註冊）"""
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    user: UserInfo
    
    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "Bearer",
                "user": {
                    "id": "123e4567-e89b-12d3-a456-426614174000",
                    "name": "張小明",
                    "email": "user@example.com",
                    "roles": ["client"]
                }
            }
        }


class VerifyEmailRequest(BaseModel):
    """驗證 Email 請求"""
    token: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "token": "abc123def456..."
            }
        }


class ResendVerificationRequest(BaseModel):
    """重新發送驗證郵件請求"""
    email: EmailStr
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com"
            }
        }


class GoogleAuthRequest(BaseModel):
    """Google OAuth 請求"""
    google_id: str = Field(..., description="Google 帳號 ID")
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=100)
    picture: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "google_id": "123456789012345678901",
                "email": "user@gmail.com",
                "name": "張小明",
                "picture": "https://lh3.googleusercontent.com/..."
            }
        }

