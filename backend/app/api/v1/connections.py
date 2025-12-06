"""
Connections Endpoints
對應原本的 src/app/api/v1/connections/route.ts
使用 Raw SQL 優化
"""
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy import text

from ...db import get_db
from ...models.user import User
from ...schemas.common import SuccessResponse
from ...dependencies import get_current_user


router = APIRouter(prefix="/connections", tags=["connections"])


# ==================== 原: src/app/api/v1/connections/route.ts ====================

@router.get("", response_model=SuccessResponse[list])
async def get_my_connections(
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    取得我的連接關係 - 使用 Raw SQL
    
    原始檔案: src/app/api/v1/connections/route.ts
    
    RLS 邏輯: 只能查看自己的連接
    """
    # 一次性取得所有資料（連接 + 對方使用者資訊）
    sql = """
        SELECT 
            uc.id,
            uc.connection_type,
            uc.status,
            uc.conversation_id,
            uc.created_at,
            uc.expires_at,
            uc.initiator_id,
            uc.recipient_id,
            CASE 
                WHEN uc.initiator_id = :user_id THEN u_recipient.id
                ELSE u_initiator.id
            END as other_user_id,
            CASE 
                WHEN uc.initiator_id = :user_id THEN u_recipient.name
                ELSE u_initiator.name
            END as other_user_name,
            CASE 
                WHEN uc.initiator_id = :user_id THEN u_recipient.avatar_url
                ELSE u_initiator.avatar_url
            END as other_user_avatar_url
        FROM user_connections uc
        LEFT JOIN users u_initiator ON u_initiator.id = uc.initiator_id
        LEFT JOIN users u_recipient ON u_recipient.id = uc.recipient_id
        WHERE uc.initiator_id = :user_id OR uc.recipient_id = :user_id
        ORDER BY uc.created_at DESC
    """
    
    result = await db.execute(text(sql), {'user_id': str(current_user.id)})
    rows = result.fetchall()
    
    connections_data = []
    for row in rows:
        connections_data.append({
            "id": str(row.id),
            "connection_type": row.connection_type,
            "status": row.status,
            "conversation_id": str(row.conversation_id) if row.conversation_id else None,
            "created_at": row.created_at,
            "expires_at": row.expires_at,
            "other_user": {
                "id": str(row.other_user_id),
                "name": row.other_user_name,
                "avatar_url": row.other_user_avatar_url
            } if row.other_user_id else None
        })
    
    return {
        "success": True,
        "data": connections_data
    }


# ==================== 原: src/app/api/v1/connections/check/route.ts ====================

@router.get("/check", response_model=SuccessResponse[dict])
async def check_connection(
    user_id: UUID = Query(..., alias="userId"),
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    檢查與某使用者的連接狀態 - 使用 Raw SQL
    
    原始檔案: src/app/api/v1/connections/check/route.ts
    
    RLS 邏輯: 只能查詢與自己相關的連接
    """
    # 查詢與指定使用者的連接（包含完整的解鎖狀態）
    sql = """
        SELECT 
            id, 
            status, 
            connection_type, 
            conversation_id,
            initiator_id,
            recipient_id,
            initiator_unlocked_at,
            recipient_unlocked_at,
            expires_at,
            created_at
        FROM user_connections
        WHERE (
            (initiator_id = :current_user_id AND recipient_id = :target_user_id)
            OR
            (initiator_id = :target_user_id AND recipient_id = :current_user_id)
        )
        ORDER BY created_at DESC
        LIMIT 1
    """
    
    result = await db.execute(text(sql), {
        'current_user_id': str(current_user.id),
        'target_user_id': str(user_id)
    })
    connection = result.fetchone()
    
    if not connection:
        return {
            "success": True,
            "data": {
                "has_connection": False,
                "status": None
            }
        }
    
    # 判斷當前使用者是否為 initiator
    is_current_user_initiator = str(connection.initiator_id) == str(current_user.id)
    
    # 判斷當前使用者是否已解鎖（不論是 initiator 還是 recipient）
    current_user_unlocked = (
        (is_current_user_initiator and connection.initiator_unlocked_at is not None) or
        (not is_current_user_initiator and connection.recipient_unlocked_at is not None)
    )
    
    # 判斷對方是否已解鎖
    other_user_unlocked = (
        (is_current_user_initiator and connection.recipient_unlocked_at is not None) or
        (not is_current_user_initiator and connection.initiator_unlocked_at is not None)
    )
    
    # 只要有一方解鎖，雙方都應該顯示已解鎖（用於 UI 顯示）
    either_unlocked = connection.initiator_unlocked_at is not None or connection.recipient_unlocked_at is not None
    
    return {
        "success": True,
        "data": {
            "has_connection": True,
            "status": connection.status,
            "connection_type": connection.connection_type,
            "conversation_id": str(connection.conversation_id) if connection.conversation_id else None,
            "initiator_id": str(connection.initiator_id),
            "recipient_id": str(connection.recipient_id),
            "is_initiator": is_current_user_initiator,
            "initiator_unlocked": connection.initiator_unlocked_at is not None,
            "recipient_unlocked": connection.recipient_unlocked_at is not None,
            "current_user_unlocked": current_user_unlocked,  # 當前使用者是否已解鎖
            "other_user_unlocked": other_user_unlocked,      # 對方是否已解鎖
            "either_unlocked": either_unlocked,              # 只要有一方解鎖就為 True
            "expires_at": connection.expires_at.isoformat() if connection.expires_at else None,
            "created_at": connection.created_at.isoformat() if connection.created_at else None
        }
    }
