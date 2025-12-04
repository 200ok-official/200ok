"""
Common FastAPI Dependencies
使用 Raw SQL 優化
"""
from typing import Optional
from uuid import UUID
from fastapi import Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import text

from .db import get_db as _get_db
from .models.user import User, UserRole
from .security import decode_token


# OAuth2 scheme for token extraction
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


# Re-export get_db
async def get_db():
    async for conn in _get_db():
        yield conn


# Get current user (required auth)
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db = Depends(get_db)
) -> User:
    """
    獲取當前登入使用者（必須登入） - 使用 Raw SQL
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="請先登入",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Decode token
    payload = decode_token(token)
    user_id = payload.get("userId")
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="無效的認證憑證",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Query user (使用 raw SQL)
    sql = """
        SELECT id, name, email, password_hash, roles, bio, skills, 
               avatar_url, rating, portfolio_links, google_id, phone,
               phone_verified, email_verified, created_at, updated_at
        FROM users
        WHERE id = :user_id
    """
    result = await db.execute(text(sql), {'user_id': user_id})
    row = result.fetchone()
    
    if not row:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="使用者不存在",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 轉換 PostgreSQL array（psycopg 返回字串格式）
    from .db import parse_pg_array
    
    # 建立 User 物件（僅用於型別提示和 Enum 存取）
    # 注意：這裡不使用 ORM，只是包裝資料
    user = User()
    user.id = UUID(row.id) if isinstance(row.id, str) else row.id
    user.name = row.name
    user.email = row.email
    user.password_hash = row.password_hash
    user.roles = parse_pg_array(row.roles)  # 轉換 PostgreSQL array
    user.bio = row.bio
    user.skills = parse_pg_array(row.skills)  # 轉換 skills array
    user.avatar_url = row.avatar_url
    user.rating = row.rating
    user.portfolio_links = parse_pg_array(row.portfolio_links)  # 轉換 links array
    user.google_id = row.google_id
    user.phone = row.phone
    user.phone_verified = row.phone_verified
    user.email_verified = row.email_verified
    user.created_at = row.created_at
    user.updated_at = row.updated_at
    
    return user


# Get current user (optional auth)
async def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme),
    db = Depends(get_db)
) -> Optional[User]:
    """
    獲取當前登入使用者（選用，未登入時回傳 None） - 使用 Raw SQL
    """
    if not token:
        return None
    
    try:
        payload = decode_token(token)
        user_id = payload.get("userId")
        
        if not user_id:
            return None
        
        sql = """
            SELECT id, name, email, password_hash, roles, bio, skills, 
                   avatar_url, rating, portfolio_links, google_id, phone,
                   phone_verified, email_verified, created_at, updated_at
            FROM users
            WHERE id = :user_id
        """
        result = await db.execute(text(sql), {'user_id': user_id})
        row = result.fetchone()
        
        if not row:
            return None
        
        # 轉換 PostgreSQL array（psycopg 返回字串格式）
        from .db import parse_pg_array
        
        # 建立 User 物件
        user = User()
        user.id = UUID(row.id) if isinstance(row.id, str) else row.id
        user.name = row.name
        user.email = row.email
        user.password_hash = row.password_hash
        user.roles = parse_pg_array(row.roles)  # 轉換 array
        user.bio = row.bio
        user.skills = parse_pg_array(row.skills)  # 轉換 array
        user.avatar_url = row.avatar_url
        user.rating = row.rating
        user.portfolio_links = parse_pg_array(row.portfolio_links)  # 轉換 array
        user.google_id = row.google_id
        user.phone = row.phone
        user.phone_verified = row.phone_verified
        user.email_verified = row.email_verified
        user.created_at = row.created_at
        user.updated_at = row.updated_at
        
        return user
    except:
        return None


# Require admin role
async def require_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    要求管理員權限
    """
    # 檢查 roles 是否包含 admin
    if isinstance(current_user.roles, list):
        roles_list = current_user.roles
    else:
        roles_list = [r.value if hasattr(r, 'value') else str(r) for r in current_user.roles]
    
    if UserRole.ADMIN.value not in roles_list:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要管理員權限"
        )
    return current_user


# Pagination parameters
class PaginationParams:
    def __init__(
        self,
        page: int = Query(1, ge=1, description="頁數"),
        limit: int = Query(10, ge=1, le=100, description="每頁筆數")
    ):
        self.page = page
        self.limit = limit
        self.offset = (page - 1) * limit
    
    def get_response_metadata(self, total: int) -> dict:
        """
        生成分頁元數據
        """
        total_pages = (total + self.limit - 1) // self.limit
        return {
            "page": self.page,
            "limit": self.limit,
            "total": total,
            "total_pages": total_pages
        }
