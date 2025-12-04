"""
Conversations & Messages Endpoints
對應原本的 src/app/api/v1/conversations/*/route.ts 和 messages
使用 Raw SQL 優化
"""
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import text
import uuid

from ...db import get_db
from ...models.user import User
from ...models.conversation import ConversationType
from ...models.token import TransactionType
from ...schemas.conversation import ConversationResponse, MessageResponse
from ...schemas.common import SuccessResponse
from ...dependencies import get_current_user


router = APIRouter(prefix="/conversations", tags=["conversations"])


# Request schemas
class CreateDirectConversationRequest(BaseModel):
    recipient_id: UUID


class CreateProposalConversationRequest(BaseModel):
    project_id: UUID
    initial_message: str
    bid_data: dict  # {amount, estimated_days, proposal}


class SendMessageRequest(BaseModel):
    content: str


class UnlockProposalRequest(BaseModel):
    conversation_id: UUID


# ==================== 原: src/app/api/v1/conversations/route.ts GET ====================

@router.get("", response_model=SuccessResponse[list])
async def get_user_conversations(
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    取得使用者的所有對話 - 使用 Raw SQL
    
    原始檔案: src/app/api/v1/conversations/route.ts GET
    對應 Service: ConversationService.getUserConversations()
    
    RLS 邏輯: 只能查看自己參與的對話
    """
    # 一次性取得所有資料（conversations + users + projects + last_message + unread_count）
    sql = """
        SELECT 
            c.id,
            c.type,
            c.project_id,
            c.is_unlocked,
            c.initiator_id,
            c.recipient_id,
            c.created_at,
            c.updated_at,
            i.id as initiator_id_full,
            i.name as initiator_name,
            i.avatar_url as initiator_avatar_url,
            r.id as recipient_id_full,
            r.name as recipient_name,
            r.avatar_url as recipient_avatar_url,
            p.id as project_id_full,
            p.title as project_title,
            last_msg.content as last_message_content,
            last_msg.created_at as last_message_created_at,
            unread.unread_count
        FROM conversations c
        LEFT JOIN users i ON i.id = c.initiator_id
        LEFT JOIN users r ON r.id = c.recipient_id
        LEFT JOIN projects p ON p.id = c.project_id
        LEFT JOIN LATERAL (
            SELECT content, created_at
            FROM messages
            WHERE conversation_id = c.id
            ORDER BY created_at DESC
            LIMIT 1
        ) last_msg ON TRUE
        LEFT JOIN LATERAL (
            SELECT COUNT(*) as unread_count
            FROM messages
            WHERE conversation_id = c.id
              AND sender_id != :user_id
              AND is_read = FALSE
        ) unread ON TRUE
        WHERE c.initiator_id = :user_id OR c.recipient_id = :user_id
        ORDER BY c.updated_at DESC
    """
    
    result = await db.execute(text(sql), {'user_id': str(current_user.id)})
    rows = result.fetchall()
    
    conversations_data = []
    for row in rows:
        conversations_data.append({
            "id": str(row.id),
            "type": row.type,
            "project_id": str(row.project_id) if row.project_id else None,
            "is_unlocked": row.is_unlocked,
            "initiator_id": str(row.initiator_id),
            "recipient_id": str(row.recipient_id),
            "created_at": row.created_at,
            "updated_at": row.updated_at,
            "initiator": {
                "id": str(row.initiator_id_full),
                "name": row.initiator_name,
                "avatar_url": row.initiator_avatar_url
            } if row.initiator_id_full else None,
            "recipient": {
                "id": str(row.recipient_id_full),
                "name": row.recipient_name,
                "avatar_url": row.recipient_avatar_url
            } if row.recipient_id_full else None,
            "project": {
                "id": str(row.project_id_full),
                "title": row.project_title
            } if row.project_id_full else None,
            "last_message": {
                "content": row.last_message_content,
                "created_at": row.last_message_created_at
            } if row.last_message_content else None,
            "unread_count": int(row.unread_count) if row.unread_count else 0
        })
    
    return {
        "success": True,
        "data": conversations_data
    }


# ==================== 原: src/app/api/v1/conversations/direct/route.ts ====================

@router.post("/direct", response_model=SuccessResponse[dict], status_code=status.HTTP_201_CREATED)
async def create_direct_conversation(
    data: CreateDirectConversationRequest,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    建立直接聯絡對話（付費 200 代幣） - 使用 Raw SQL
    
    原始檔案: src/app/api/v1/conversations/direct/route.ts
    對應 Service: ConversationService.createDirectConversation()
    
    RLS 邏輯: 必須登入；扣除 200 代幣
    """
    # 檢查餘額
    balance_sql = "SELECT id, balance FROM user_tokens WHERE user_id = :user_id"
    result = await db.execute(text(balance_sql), {'user_id': str(current_user.id)})
    user_token = result.fetchone()
    
    if not user_token or user_token.balance < 200:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="代幣餘額不足，需要 200 代幣"
        )
    
    # 檢查是否已存在對話
    check_sql = """
        SELECT id FROM conversations
        WHERE type = 'direct'
          AND (
            (initiator_id = :current_user_id AND recipient_id = :recipient_id)
            OR
            (initiator_id = :recipient_id AND recipient_id = :current_user_id)
          )
    """
    existing_result = await db.execute(text(check_sql), {
        'current_user_id': str(current_user.id),
        'recipient_id': str(data.recipient_id)
    })
    if existing_result.fetchone():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="已存在與該使用者的對話"
        )
    
    # 建立對話
    conversation_id = uuid.uuid4()
    insert_conv_sql = """
        INSERT INTO conversations (id, type, initiator_id, recipient_id, initiator_paid, recipient_paid, is_unlocked, created_at, updated_at)
        VALUES (:id, :type, :initiator_id, :recipient_id, TRUE, TRUE, TRUE, NOW(), NOW())
    """
    await db.execute(text(insert_conv_sql), {
        'id': str(conversation_id),
        'type': ConversationType.DIRECT.value,
        'initiator_id': str(current_user.id),
        'recipient_id': str(data.recipient_id)
    })
    
    # 扣除代幣
    update_token_sql = """
        UPDATE user_tokens
        SET balance = balance - 200,
            total_spent = total_spent + 200,
            updated_at = NOW()
        WHERE user_id = :user_id
        RETURNING balance
    """
    token_result = await db.execute(text(update_token_sql), {'user_id': str(current_user.id)})
    new_balance_row = token_result.fetchone()
    
    # 記錄交易
    insert_transaction_sql = """
        INSERT INTO token_transactions (id, user_id, amount, balance_after, transaction_type, reference_id, description, created_at)
        VALUES (:id, :user_id, :amount, :balance_after, :transaction_type, :reference_id, :description, NOW())
    """
    await db.execute(text(insert_transaction_sql), {
        'id': str(uuid.uuid4()),
        'user_id': str(current_user.id),
        'amount': -200,
        'balance_after': new_balance_row.balance,
        'transaction_type': TransactionType.UNLOCK_DIRECT_CONTACT.value,
        'reference_id': str(conversation_id),
        'description': "解鎖與使用者的直接聯絡"
    })
    
    return {
        "success": True,
        "message": "對話已建立，扣除 200 代幣",
        "data": {
            "conversation_id": str(conversation_id),
            "type": ConversationType.DIRECT.value,
            "is_unlocked": True
        }
    }


# ==================== 原: src/app/api/v1/conversations/unlock-proposal/route.ts ====================

@router.post("/unlock-proposal", response_model=SuccessResponse[dict])
async def unlock_proposal(
    data: UnlockProposalRequest,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    解鎖提案對話（發案者付費 100 代幣） - 使用 Raw SQL
    
    原始檔案: src/app/api/v1/conversations/unlock-proposal/route.ts
    對應 Service: ConversationService.unlockProposal()
    
    RLS 邏輯: 必須是對話的 recipient；扣除 100 代幣
    """
    # 查詢對話
    conv_sql = """
        SELECT id, recipient_id, type, recipient_paid
        FROM conversations
        WHERE id = :conversation_id
    """
    result = await db.execute(text(conv_sql), {'conversation_id': str(data.conversation_id)})
    conversation = result.fetchone()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="找不到該對話"
        )
    
    # ========== RLS 邏輯 ==========
    if str(conversation.recipient_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您沒有權限解鎖此對話"
        )
    
    if conversation.type != ConversationType.PROJECT_PROPOSAL.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="只有提案對話需要解鎖"
        )
    
    if conversation.recipient_paid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="您已經解鎖過此提案"
        )
    
    # 檢查餘額
    balance_sql = "SELECT id, balance FROM user_tokens WHERE user_id = :user_id"
    token_result = await db.execute(text(balance_sql), {'user_id': str(current_user.id)})
    user_token = token_result.fetchone()
    
    if not user_token or user_token.balance < 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="代幣餘額不足，需要 100 代幣"
        )
    
    # 更新對話狀態
    update_conv_sql = """
        UPDATE conversations
        SET recipient_paid = TRUE,
            is_unlocked = TRUE,
            updated_at = NOW()
        WHERE id = :conversation_id
    """
    await db.execute(text(update_conv_sql), {'conversation_id': str(data.conversation_id)})
    
    # 扣除代幣
    update_token_sql = """
        UPDATE user_tokens
        SET balance = balance - 100,
            total_spent = total_spent + 100,
            updated_at = NOW()
        WHERE user_id = :user_id
        RETURNING balance
    """
    token_result = await db.execute(text(update_token_sql), {'user_id': str(current_user.id)})
    new_balance_row = token_result.fetchone()
    
    # 記錄交易
    insert_transaction_sql = """
        INSERT INTO token_transactions (id, user_id, amount, balance_after, transaction_type, reference_id, description, created_at)
        VALUES (:id, :user_id, :amount, :balance_after, :transaction_type, :reference_id, :description, NOW())
    """
    await db.execute(text(insert_transaction_sql), {
        'id': str(uuid.uuid4()),
        'user_id': str(current_user.id),
        'amount': -100,
        'balance_after': new_balance_row.balance,
        'transaction_type': TransactionType.VIEW_PROPOSAL.value,
        'reference_id': str(data.conversation_id),
        'description': "查看提案"
    })
    
    return {
        "success": True,
        "message": "提案已解鎖，扣除 100 代幣",
        "data": {
            "conversation_id": str(data.conversation_id),
            "is_unlocked": True
        }
    }


# ==================== 原: src/app/api/v1/conversations/[id]/route.ts ====================

@router.get("/{conversation_id}", response_model=SuccessResponse[dict])
async def get_conversation(
    conversation_id: UUID,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    取得對話詳情 - 使用 Raw SQL
    
    原始檔案: src/app/api/v1/conversations/[id]/route.ts
    對應 Service: ConversationService.getConversation()
    
    RLS 邏輯: 必須是對話參與者
    """
    # 查詢對話
    sql = """
        SELECT 
            c.id,
            c.type,
            c.project_id,
            c.is_unlocked,
            c.initiator_id,
            c.recipient_id,
            i.id as initiator_id_full,
            i.name as initiator_name,
            i.avatar_url as initiator_avatar_url,
            i.email as initiator_email,
            r.id as recipient_id_full,
            r.name as recipient_name,
            r.avatar_url as recipient_avatar_url,
            r.email as recipient_email,
            p.id as project_id_full,
            p.title as project_title
        FROM conversations c
        LEFT JOIN users i ON i.id = c.initiator_id
        LEFT JOIN users r ON r.id = c.recipient_id
        LEFT JOIN projects p ON p.id = c.project_id
        WHERE c.id = :conversation_id
    """
    
    result = await db.execute(text(sql), {'conversation_id': str(conversation_id)})
    row = result.fetchone()
    
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="找不到該對話"
        )
    
    # ========== RLS 邏輯 ==========
    if str(row.initiator_id) != str(current_user.id) and str(row.recipient_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您沒有權限查看此對話"
        )
    
    return {
        "success": True,
        "data": {
            "id": str(row.id),
            "type": row.type,
            "project_id": str(row.project_id) if row.project_id else None,
            "is_unlocked": row.is_unlocked,
            "initiator": {
                "id": str(row.initiator_id_full),
                "name": row.initiator_name,
                "avatar_url": row.initiator_avatar_url,
                "email": row.initiator_email if row.is_unlocked else None
            } if row.initiator_id_full else None,
            "recipient": {
                "id": str(row.recipient_id_full),
                "name": row.recipient_name,
                "avatar_url": row.recipient_avatar_url,
                "email": row.recipient_email if row.is_unlocked else None
            } if row.recipient_id_full else None,
            "project": {
                "id": str(row.project_id_full),
                "title": row.project_title
            } if row.project_id_full else None
        }
    }


# ==================== 原: src/app/api/v1/conversations/[id]/messages/route.ts ====================

@router.get("/{conversation_id}/messages", response_model=SuccessResponse[list])
async def get_messages(
    conversation_id: UUID,
    limit: int = 50,
    offset: int = 0,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    取得對話的訊息列表 - 使用 Raw SQL
    
    原始檔案: src/app/api/v1/conversations/[id]/messages/route.ts GET
    對應 Service: ConversationService.getMessages()
    
    RLS 邏輯: 必須是對話參與者；未解鎖只能看自己的訊息
    """
    # 檢查對話權限
    conv_sql = """
        SELECT id, initiator_id, recipient_id, is_unlocked
        FROM conversations
        WHERE id = :conversation_id
    """
    conv_result = await db.execute(text(conv_sql), {'conversation_id': str(conversation_id)})
    conversation = conv_result.fetchone()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="找不到該對話"
        )
    
    # ========== RLS 邏輯 ==========
    if str(conversation.initiator_id) != str(current_user.id) and str(conversation.recipient_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您沒有權限查看此對話"
        )
    
    # 查詢訊息
    where_conditions = ["m.conversation_id = :conversation_id"]
    params = {
        'conversation_id': str(conversation_id),
        'user_id': str(current_user.id),
        'limit': limit,
        'offset': offset
    }
    
    # 如果對話未解鎖，只能看自己發送的訊息
    if not conversation.is_unlocked:
        where_conditions.append("m.sender_id = :user_id")
    
    where_clause = " AND ".join(where_conditions)
    
    sql = f"""
        SELECT 
            m.id,
            m.conversation_id,
            m.sender_id,
            m.content,
            m.is_read,
            m.created_at,
            u.id as sender_user_id,
            u.name as sender_name,
            u.avatar_url as sender_avatar_url
        FROM messages m
        LEFT JOIN users u ON u.id = m.sender_id
        WHERE {where_clause}
        ORDER BY m.created_at ASC
        LIMIT :limit OFFSET :offset
    """
    
    result = await db.execute(text(sql), params)
    rows = result.fetchall()
    
    messages_data = []
    for row in rows:
        messages_data.append({
            "id": str(row.id),
            "conversation_id": str(row.conversation_id),
            "sender_id": str(row.sender_id),
            "content": row.content,
            "is_read": row.is_read,
            "created_at": row.created_at,
            "sender": {
                "id": str(row.sender_user_id),
                "name": row.sender_name,
                "avatar_url": row.sender_avatar_url
            } if row.sender_user_id else None
        })
    
    return {
        "success": True,
        "data": messages_data
    }


@router.post("/{conversation_id}/messages", response_model=SuccessResponse[dict], status_code=status.HTTP_201_CREATED)
async def send_message(
    conversation_id: UUID,
    data: SendMessageRequest,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    發送訊息 - 使用 Raw SQL
    
    原始檔案: src/app/api/v1/conversations/[id]/messages/route.ts POST
    對應 Service: ConversationService.sendMessage()
    
    RLS 邏輯: 必須是對話參與者；已解鎖或初始提案
    """
    # 檢查對話
    conv_sql = """
        SELECT id, initiator_id, recipient_id, is_unlocked
        FROM conversations
        WHERE id = :conversation_id
    """
    conv_result = await db.execute(text(conv_sql), {'conversation_id': str(conversation_id)})
    conversation = conv_result.fetchone()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="找不到該對話"
        )
    
    # ========== RLS 邏輯 ==========
    if str(conversation.initiator_id) != str(current_user.id) and str(conversation.recipient_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您沒有權限在此對話發送訊息"
        )
    
    if not conversation.is_unlocked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="對話尚未解鎖，無法發送訊息"
        )
    
    # 建立訊息
    message_id = uuid.uuid4()
    insert_msg_sql = """
        INSERT INTO messages (id, conversation_id, sender_id, content, is_read, created_at)
        VALUES (:id, :conversation_id, :sender_id, :content, FALSE, NOW())
        RETURNING id, conversation_id, content, created_at
    """
    
    result = await db.execute(text(insert_msg_sql), {
        'id': str(message_id),
        'conversation_id': str(conversation_id),
        'sender_id': str(current_user.id),
        'content': data.content
    })
    new_message = result.fetchone()
    
    # 更新對話時間
    update_conv_sql = """
        UPDATE conversations
        SET updated_at = NOW()
        WHERE id = :conversation_id
    """
    await db.execute(text(update_conv_sql), {'conversation_id': str(conversation_id)})
    
    return {
        "success": True,
        "message": "訊息已發送",
        "data": {
            "id": str(new_message.id),
            "conversation_id": str(new_message.conversation_id),
            "content": new_message.content,
            "created_at": new_message.created_at
        }
    }


# ==================== 原: src/app/api/v1/messages/unread-count/route.ts ====================

@router.get("/me/unread-count", response_model=SuccessResponse[dict])
async def get_unread_count(
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    取得未讀訊息數 - 使用 Raw SQL
    
    原始檔案: src/app/api/v1/messages/unread-count/route.ts
    對應 Service: ConversationService.getUnreadCount()
    
    RLS 邏輯: 只能查看自己的未讀數
    """
    # 一次性查詢未讀數（超快）
    sql = """
        SELECT COUNT(*)
        FROM messages m
        INNER JOIN conversations c ON c.id = m.conversation_id
        WHERE (c.initiator_id = :user_id OR c.recipient_id = :user_id)
          AND m.sender_id != :user_id
          AND m.is_read = FALSE
    """
    
    result = await db.execute(text(sql), {'user_id': str(current_user.id)})
    unread_count = result.scalar() or 0
    
    return {
        "success": True,
        "data": {"unread_count": unread_count}
    }
