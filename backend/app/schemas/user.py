"""
User related schemas
"""
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from ..models.user import UserRole


class UserPublic(BaseModel):
    """使用者公開資料"""
    id: UUID
    name: str
    email: Optional[str] = None  # 視權限決定是否顯示
    roles: List[str]
    bio: Optional[str] = None
    skills: Optional[List[str]] = None
    avatar_url: Optional[str] = None
    rating: Optional[float] = None
    portfolio_links: Optional[List[str]] = None
    created_at: datetime
    
    # 統計資訊（可選）
    projects_count: Optional[int] = 0
    bids_count: Optional[int] = 0
    reviews_count: Optional[int] = 0
    
    class Config:
        from_attributes = True


class UserProfile(BaseModel):
    """使用者完整資料（私密）"""
    id: UUID
    name: str
    email: str
    phone: Optional[str] = None
    roles: List[str]
    bio: Optional[str] = None
    skills: Optional[List[str]] = None
    avatar_url: Optional[str] = None
    rating: Optional[float] = None
    portfolio_links: Optional[List[str]] = None
    email_verified: bool
    phone_verified: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class UpdateUserRequest(BaseModel):
    """更新使用者資料請求"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    bio: Optional[str] = None
    skills: Optional[List[str]] = None
    avatar_url: Optional[str] = None
    portfolio_links: Optional[List[str]] = None
    phone: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "張小明",
                "bio": "資深全端工程師",
                "skills": ["Python", "FastAPI", "React"],
                "portfolio_links": ["https://github.com/user"]
            }
        }


class UpdatePasswordRequest(BaseModel):
    """更新密碼請求"""
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=100)
    
    class Config:
        json_schema_extra = {
            "example": {
                "current_password": "old_password",
                "new_password": "new_secure_password_123"
            }
        }



# Additional schemas for user operations

class UpdateUserRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[List[str]] = None
    portfolio_links: Optional[List[str]] = None


class UpdatePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)
