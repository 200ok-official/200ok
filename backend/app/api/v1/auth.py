"""
Authentication Endpoints
對應原本的 src/app/api/v1/auth/*/route.ts
使用 Raw SQL 優化
"""
from datetime import datetime, timedelta
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
import uuid
import secrets

from ...db import get_db, parse_pg_array
from ...models.user import User, UserRole
from ...schemas.auth import (
    RegisterRequest, LoginRequest, RefreshTokenRequest,
    AuthResponse, UserInfo, VerifyEmailRequest
)
from ...schemas.common import SuccessResponse
from ...security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from ...config import settings
from ...services.email_service import send_verification_email


router = APIRouter(prefix="/auth", tags=["auth"])


# ==================== 原: src/app/api/v1/auth/register/route.ts ====================

@router.post("/register", response_model=SuccessResponse[AuthResponse], status_code=status.HTTP_201_CREATED)
async def register(
    data: RegisterRequest,
    db = Depends(get_db)
):
    """
    使用者註冊 - 使用 Raw SQL
    
    原始檔案: src/app/api/v1/auth/register/route.ts
    對應 Service: AuthService.register()
    
    流程:
    1. 檢查 email 是否已存在
    2. 雜湊密碼
    3. 建立使用者
    4. 生成 JWT tokens
    5. 儲存 refresh token
    6. （異步）發送驗證郵件
    
    RLS 邏輯: 無（註冊不需要權限）
    """
    # 檢查 email 是否已存在
    check_sql = "SELECT id FROM users WHERE email = :email"
    result = await db.execute(text(check_sql), {'email': data.email})
    existing_user = result.fetchone()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="此 Email 已被註冊"
        )
    
    # 雜湊密碼
    password_hash = hash_password(data.password)
    
    # 建立使用者
    user_id = uuid.uuid4()
    roles_array = [role.value for role in data.roles]
    
    insert_user_sql = """
        INSERT INTO users (id, name, email, password_hash, roles, email_verified, created_at, updated_at)
        VALUES (:id, :name, :email, :password_hash, :roles, FALSE, NOW(), NOW())
        RETURNING id, name, email, roles
    """
    
    result = await db.execute(text(insert_user_sql), {
        'id': str(user_id),
        'name': data.name,
        'email': data.email,
        'password_hash': password_hash,
        'roles': roles_array
    })
    user = result.fetchone()
    
    # 轉換 roles（psycopg 返回字串格式，需要轉為 list）
    user_roles = parse_pg_array(user.roles)
    
    # 生成 JWT tokens
    access_token = create_access_token({
        "userId": str(user.id),
        "email": user.email,
        "roles": user_roles
    })
    
    refresh_token = create_refresh_token({
        "userId": str(user.id),
        "email": user.email
    })
    
    # 儲存 refresh token
    expires_at = datetime.utcnow() + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)
    insert_token_sql = """
        INSERT INTO refresh_tokens (id, user_id, token, expires_at, created_at)
        VALUES (:id, :user_id, :token, :expires_at, NOW())
    """
    await db.execute(text(insert_token_sql), {
        'id': str(uuid.uuid4()),
        'user_id': str(user.id),
        'token': refresh_token,
        'expires_at': expires_at
    })
    
    # 生成並儲存 email 驗證 token
    verification_token = secrets.token_urlsafe(32)
    verification_expires = datetime.utcnow() + timedelta(hours=24)  # 24 小時有效
    
    insert_verification_sql = """
        INSERT INTO email_verification_tokens (id, user_id, token, expires_at, created_at)
        VALUES (:id, :user_id, :token, :expires_at, NOW())
    """
    await db.execute(text(insert_verification_sql), {
        'id': str(uuid.uuid4()),
        'user_id': str(user.id),
        'token': verification_token,
        'expires_at': verification_expires
    })
    
    # 發送驗證郵件（異步，不阻塞註冊流程）
    try:
        await send_verification_email(
            user_id=str(user.id),
            email=user.email,
            name=user.name,
            token=verification_token
        )
    except Exception as e:
        # 郵件發送失敗不影響註冊，只記錄錯誤
        print(f"⚠️  發送驗證郵件失敗: {e}")
    
    return {
        "success": True,
        "message": "註冊成功，請檢查您的信箱以驗證 Email",
        "data": AuthResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserInfo(
                id=UUID(user.id) if isinstance(user.id, str) else user.id,
                name=user.name,
                email=user.email,
                roles=user_roles,
                avatar_url=None
            )
        )
    }


# ==================== 原: src/app/api/v1/auth/login/route.ts ====================

@router.post("/login", response_model=SuccessResponse[AuthResponse])
async def login(
    data: LoginRequest,
    db = Depends(get_db)
):
    """
    使用者登入 - 使用 Raw SQL
    
    原始檔案: src/app/api/v1/auth/login/route.ts
    對應 Service: AuthService.login()
    
    流程:
    1. 查找使用者
    2. 驗證密碼
    3. 檢查 email 是否已驗證
    4. 生成 JWT tokens
    5. 儲存 refresh token
    
    RLS 邏輯: 無（登入不需要權限）
    """
    # 查找使用者
    sql = """
        SELECT id, name, email, password_hash, roles, email_verified, avatar_url
        FROM users
        WHERE email = :email
    """
    result = await db.execute(text(sql), {'email': data.email})
    user = result.fetchone()
    
    # 如果使用者不存在，回傳帳號尚未註冊的錯誤
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="此帳號尚未註冊"
        )
    
    # 如果使用者存在但沒有密碼（例如使用 Google 登入的帳號）
    if not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="此帳號使用第三方登入，請使用 Google 登入"
        )
    
    # 驗證密碼
    if not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email 或密碼錯誤"
        )
    
    # 檢查 email 是否已驗證
    if not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="請先驗證您的電子郵件，檢查您的信箱以完成驗證"
        )
    
    # 轉換 roles（psycopg 返回字串格式，需要轉為 list）
    user_roles = parse_pg_array(user.roles)
    
    # 生成 JWT tokens
    access_token = create_access_token({
        "userId": str(user.id),
        "email": user.email,
        "roles": user_roles
    })
    
    refresh_token = create_refresh_token({
        "userId": str(user.id),
        "email": user.email
    })
    
    # 儲存 refresh token
    expires_at = datetime.utcnow() + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)
    insert_token_sql = """
        INSERT INTO refresh_tokens (id, user_id, token, expires_at, created_at)
        VALUES (:id, :user_id, :token, :expires_at, NOW())
    """
    await db.execute(text(insert_token_sql), {
        'id': str(uuid.uuid4()),
        'user_id': str(user.id),
        'token': refresh_token,
        'expires_at': expires_at
    })
    
    return {
        "success": True,
        "message": "登入成功",
        "data": AuthResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserInfo(
                id=UUID(user.id) if isinstance(user.id, str) else user.id,
                name=user.name,
                email=user.email,
                roles=user_roles,
                avatar_url=user.avatar_url
            )
        )
    }


# ==================== 原: src/app/api/v1/auth/refresh/route.ts ====================

@router.post("/refresh", response_model=SuccessResponse[AuthResponse])
async def refresh_token(
    data: RefreshTokenRequest,
    db = Depends(get_db)
):
    """
    刷新 Access Token - 使用 Raw SQL
    
    原始檔案: src/app/api/v1/auth/refresh/route.ts
    對應 Service: AuthService.refreshAccessToken()
    
    流程:
    1. 驗證 refresh token
    2. 檢查是否過期
    3. 生成新的 tokens
    4. 刪除舊的 refresh token
    5. 儲存新的 refresh token
    """
    # 查找 refresh token 並包含使用者資訊
    sql = """
        SELECT 
            rt.id as token_id,
            rt.expires_at,
            u.id as user_id,
            u.name,
            u.email,
            u.roles,
            u.avatar_url
        FROM refresh_tokens rt
        INNER JOIN users u ON u.id = rt.user_id
        WHERE rt.token = :token
    """
    result = await db.execute(text(sql), {'token': data.refresh_token})
    token_record = result.fetchone()
    
    if not token_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="無效的 Refresh Token"
        )
    
    # 檢查是否過期
    if datetime.utcnow() > token_record.expires_at:
        # 刪除過期的 token
        delete_sql = "DELETE FROM refresh_tokens WHERE id = :token_id"
        await db.execute(text(delete_sql), {'token_id': str(token_record.token_id)})
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh Token 已過期"
        )
    
    # 轉換 roles（psycopg 返回字串格式，需要轉為 list）
    user_roles = parse_pg_array(token_record.roles)
    
    # 生成新的 tokens
    new_access_token = create_access_token({
        "userId": str(token_record.user_id),
        "email": token_record.email,
        "roles": user_roles
    })
    
    new_refresh_token = create_refresh_token({
        "userId": str(token_record.user_id),
        "email": token_record.email
    })
    
    # 刪除舊的 refresh token
    delete_sql = "DELETE FROM refresh_tokens WHERE id = :token_id"
    await db.execute(text(delete_sql), {'token_id': str(token_record.token_id)})
    
    # 儲存新的 refresh token
    expires_at = datetime.utcnow() + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)
    insert_token_sql = """
        INSERT INTO refresh_tokens (id, user_id, token, expires_at, created_at)
        VALUES (:id, :user_id, :token, :expires_at, NOW())
    """
    await db.execute(text(insert_token_sql), {
        'id': str(uuid.uuid4()),
        'user_id': str(token_record.user_id),
        'token': new_refresh_token,
        'expires_at': expires_at
    })
    
    return {
        "success": True,
        "message": "Token 已刷新",
        "data": AuthResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            user=UserInfo(
                id=UUID(token_record.user_id) if isinstance(token_record.user_id, str) else token_record.user_id,
                name=token_record.name,
                email=token_record.email,
                roles=user_roles,
                avatar_url=token_record.avatar_url
            )
        )
    }


# ==================== 原: src/app/api/v1/auth/logout/route.ts ====================

@router.post("/logout", response_model=SuccessResponse[dict])
async def logout(
    data: RefreshTokenRequest,
    db = Depends(get_db)
):
    """
    登出 - 使用 Raw SQL
    
    原始檔案: src/app/api/v1/auth/logout/route.ts
    對應 Service: AuthService.logout()
    
    流程:
    1. 刪除 refresh token
    """
    # 刪除 refresh token
    delete_sql = "DELETE FROM refresh_tokens WHERE token = :token"
    await db.execute(text(delete_sql), {'token': data.refresh_token})
    
    return {
        "success": True,
        "message": "登出成功",
        "data": {}
    }


# ==================== 原: src/app/api/v1/auth/verify-email/route.ts ====================

@router.post("/verify-email", response_model=SuccessResponse[dict])
async def verify_email(
    data: VerifyEmailRequest,
    db = Depends(get_db)
):
    """
    驗證 Email - 使用 Raw SQL
    
    原始檔案: src/app/api/v1/auth/verify-email/route.ts
    對應 Service: AuthService.verifyEmail()
    
    流程:
    1. 查找驗證 token
    2. 檢查是否過期
    3. 更新使用者的 email_verified 狀態
    4. 刪除已使用的 token
    """
    # 查找驗證 token
    sql = """
        SELECT id, user_id, expires_at
        FROM email_verification_tokens
        WHERE token = :token
    """
    result = await db.execute(text(sql), {'token': data.token})
    token_record = result.fetchone()
    
    if not token_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="無效的驗證 token"
        )
    
    # 檢查是否過期
    if datetime.utcnow() > token_record.expires_at:
        delete_sql = "DELETE FROM email_verification_tokens WHERE id = :token_id"
        await db.execute(text(delete_sql), {'token_id': str(token_record.id)})
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="驗證連結已過期"
        )
    
    # 更新使用者狀態
    update_user_sql = """
        UPDATE users
        SET email_verified = TRUE, updated_at = NOW()
        WHERE id = :user_id
    """
    await db.execute(text(update_user_sql), {'user_id': str(token_record.user_id)})
    
    # 刪除已使用的 token
    delete_sql = "DELETE FROM email_verification_tokens WHERE id = :token_id"
    await db.execute(text(delete_sql), {'token_id': str(token_record.id)})
    
    return {
        "success": True,
        "message": "Email 驗證成功",
        "data": {}
    }
