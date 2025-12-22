"""
User related schemas
"""
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, field_validator
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
    phone: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[List[str]] = None
    avatar_url: Optional[str] = None
    portfolio_links: Optional[List[str]] = None
    roles: Optional[List[str]] = None
    
    @field_validator('roles')
    @classmethod
    def validate_roles(cls, v):
        """驗證 roles 是否為有效的角色值"""
        if v is not None:
            valid_roles = {role.value for role in UserRole}
            for role in v:
                if role not in valid_roles:
                    raise ValueError(f"無效的角色: {role}. 有效的角色為: {', '.join(valid_roles)}")
            if len(v) == 0:
                raise ValueError("至少需要一個角色")
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "張小明",
                "bio": "資深全端工程師",
                "skills": ["Python", "FastAPI", "React"],
                "avatar_url": "https://example.com/avatar.jpg",
                "portfolio_links": ["https://github.com/user"],
                "roles": ["freelancer", "client"]
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
