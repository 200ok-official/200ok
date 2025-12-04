"""
認證與安全相關功能
- JWT 生成與驗證
- 密碼雜湊
- 權限檢查
"""
from datetime import datetime, timedelta
from typing import Optional, List
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import HTTPException, status
from .config import settings
from .models.user import UserRole


# ==================== 密碼雜湊設定 ====================

# 使用 passlib 內建 bcrypt（你已經鎖版本，所以穩定）
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)


# ==================== 密碼處理 ====================

def hash_password(password: str) -> str:
    """
    雜湊密碼（bcrypt 版本已解決過去 bug，不需自行截斷）
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    驗證密碼
    """
    return pwd_context.verify(plain_password, hashed_password)


# ==================== JWT 處理 ====================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """生成 Access Token"""
    to_encode = data.copy()

    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "iss": "200ok"
    })

    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(data: dict) -> str:
    """生成 Refresh Token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)

    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "iss": "200ok",
        "type": "refresh"
    })

    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    """解碼並驗證 JWT"""
    try:
        return jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
            issuer="200ok"
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token 已過期",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="無效的 Token",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ==================== 權限檢查 ====================

def check_roles(user_roles: List[str], required_roles: List[str]) -> bool:
    """檢查使用者是否擁有所需角色"""
    return any(role in user_roles for role in required_roles)


def check_is_owner(user_id: str, resource_owner_id: str) -> bool:
    """檢查是否為資源擁有者"""
    return str(user_id) == str(resource_owner_id)


def check_is_admin(user_roles: List[str]) -> bool:
    """管理員可存取所有資源"""
    return UserRole.ADMIN.value in user_roles


def check_can_access_project(user_id: str, user_roles: List[str], project_client_id: str) -> bool:
    """專案存取權限"""
    if check_is_admin(user_roles):
        return True
    return check_is_owner(user_id, project_client_id)


# ==================== RLS 邏輯輔助函數 ====================

def can_view_user_contact(requester_id: str, target_user_id: str, has_unlocked_conversation: bool) -> bool:
    """是否可以查看聯絡資訊"""
    if str(requester_id) == str(target_user_id):
        return True
    return has_unlocked_conversation


def can_view_message(
    user_id: str,
    conversation_initiator_id: str,
    conversation_recipient_id: str,
    is_unlocked: bool,
    message_sender_id: str
) -> bool:
    """訊息是否可讀"""

    # 必須是對話參與者
    if str(user_id) not in [str(conversation_initiator_id), str(conversation_recipient_id)]:
        return False

    # 對話已解鎖
    if is_unlocked:
        return True

    # 自己發送的訊息永遠能看
    return str(user_id) == str(message_sender_id)


def can_send_initial_proposal(
    user_id: str,
    conversation_type: str,
    conversation_initiator_id: str,
    message_count: int
) -> bool:
    """是否能發送第一封提案訊息"""
    return (
        str(user_id) == str(conversation_initiator_id)
        and conversation_type == "project_proposal"
        and message_count == 0
    )


# ==================== 另一個 check_is_admin（舊版相容） ====================
def check_is_admin(roles: list) -> bool:
    """相容舊呼叫方式"""
    return UserRole.ADMIN.value in [str(r) for r in roles]