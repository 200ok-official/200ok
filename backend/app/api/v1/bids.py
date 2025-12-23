"""
Bids Endpoints
對應原本的 src/app/api/v1/bids/*/route.ts 和 src/app/api/v1/projects/[id]/bids/route.ts
使用 Raw SQL 優化
"""
from typing import Optional
from uuid import UUID
from decimal import Decimal
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import text
import uuid

from ...db import get_db, parse_pg_array
from ...models.user import User
from ...models.project import ProjectStatus
from ...models.bid import BidStatus
from ...models.conversation import ConversationType
from ...models.notification import NotificationType
from ...models.token import TransactionType
from ...schemas.bid import BidCreate, BidResponse
from ...schemas.common import SuccessResponse
from ...dependencies import get_current_user, PaginationParams
from ...security import check_is_admin


router = APIRouter(prefix="/bids", tags=["bids"])


# ==================== 原: src/app/api/v1/bids/me/route.ts ====================

@router.get("/me", response_model=SuccessResponse[dict])
async def get_my_bids(
    status_filter: Optional[str] = Query(None, alias="status"),
    pagination: PaginationParams = Depends(),
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    取得我的投標
    
    原始檔案: src/app/api/v1/bids/me/route.ts
    對應 Service: BidService.getMyBids()
    
    RLS 邏輯: 只能查看自己的投標
    """
    # 建立 WHERE 條件
    where_conditions = ["b.freelancer_id = :user_id"]
    params = {
        'user_id': str(current_user.id),
        'limit': pagination.limit,
        'offset': pagination.offset
    }
    
    # 狀態篩選
    if status_filter:
        where_conditions.append("b.status = :status_filter")
        params['status_filter'] = status_filter
    
    where_clause = " AND ".join(where_conditions)
    
    # 計算總數
    count_sql = f"""
        SELECT COUNT(*)
        FROM bids b
        WHERE {where_clause}
    """
    count_result = await db.execute(text(count_sql), params)
    total = count_result.scalar() or 0
    
    # 主查詢（使用 raw SQL）
    sql = f"""
        SELECT 
            b.id,
            b.project_id,
            b.proposal,
            b.bid_amount,
            b.estimated_days,
            b.status,
            b.created_at,
            p.id as project_id_full,
            p.title as project_title,
            p.status as project_status,
            p.budget_min,
            p.budget_max,
            u.id as client_id,
            u.name as client_name,
            u.avatar_url as client_avatar_url,
            u.rating as client_rating
        FROM bids b
        INNER JOIN projects p ON p.id = b.project_id
        LEFT JOIN users u ON u.id = p.client_id
        WHERE {where_clause}
        ORDER BY b.created_at DESC
        LIMIT :limit OFFSET :offset
    """
    
    result = await db.execute(text(sql), params)
    rows = result.fetchall()
    
    # 組裝回應
    bids_data = []
    for row in rows:
        bid_dict = {
            "id": str(row.id),
            "project_id": str(row.project_id),
            "proposal": row.proposal,
            "bid_amount": float(row.bid_amount) if row.bid_amount else None,
            "estimated_days": row.estimated_days,
            "status": row.status,
            "created_at": row.created_at,
            "project": {
                "id": str(row.project_id_full),
                "title": row.project_title,
                "status": row.project_status,
                "budget_min": float(row.budget_min) if row.budget_min else None,
                "budget_max": float(row.budget_max) if row.budget_max else None,
                "client": {
                    "id": str(row.client_id),
                    "name": row.client_name,
                    "avatar_url": row.client_avatar_url,
                    "rating": float(row.client_rating) if row.client_rating else None
                } if row.client_id else None
            } if row.project_id_full else None
        }
        bids_data.append(bid_dict)
    
    return {
        "success": True,
        "data": {
            "bids": bids_data,
            "pagination": pagination.get_response_metadata(total)
        }
    }


# ==================== 原: src/app/api/v1/bids/[id]/route.ts GET ====================

@router.get("/{bid_id}", response_model=SuccessResponse[dict])
async def get_bid_detail(
    bid_id: UUID,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    取得投標詳情
    
    原始檔案: src/app/api/v1/bids/[id]/route.ts
    對應 Service: BidService.getBidById()
    
    RLS 邏輯: 只有投標者或專案擁有者可查看
    """
    # 查詢投標（使用 raw SQL）
    sql = """
        SELECT 
            b.id,
            b.project_id,
            b.freelancer_id,
            b.proposal,
            b.bid_amount,
            b.estimated_days,
            b.status,
            b.created_at,
            f.id as freelancer_id_full,
            f.name as freelancer_name,
            f.avatar_url as freelancer_avatar_url,
            f.rating as freelancer_rating,
            f.skills as freelancer_skills,
            f.bio as freelancer_bio,
            f.portfolio_links as freelancer_portfolio_links,
            p.id as project_id_full,
            p.title as project_title,
            p.client_id as project_client_id,
            p.status as project_status
        FROM bids b
        LEFT JOIN users f ON f.id = b.freelancer_id
        LEFT JOIN projects p ON p.id = b.project_id
        WHERE b.id = :bid_id
    """
    
    result = await db.execute(text(sql), {'bid_id': str(bid_id)})
    row = result.fetchone()
    
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="投標不存在"
        )
    
    # ========== RLS 邏輯 ==========
    # 只有投標者或專案擁有者可查看
    can_view = (
        str(row.freelancer_id) == str(current_user.id) or
        (row.project_client_id and str(row.project_client_id) == str(current_user.id)) or
        check_is_admin(current_user.roles)
    )
    
    if not can_view:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您沒有權限查看此投標"
        )
    
    return {
        "success": True,
        "data": {
            "id": str(row.id),
            "project_id": str(row.project_id),
            "freelancer_id": str(row.freelancer_id),
            "proposal": row.proposal,
            "bid_amount": float(row.bid_amount) if row.bid_amount else None,
            "estimated_days": row.estimated_days,
            "status": row.status,
            "created_at": row.created_at,
            "freelancer": {
                "id": str(row.freelancer_id_full),
                "name": row.freelancer_name,
                "avatar_url": row.freelancer_avatar_url,
                "rating": float(row.freelancer_rating) if row.freelancer_rating else None,
                "skills": parse_pg_array(row.freelancer_skills),
                "bio": row.freelancer_bio,
                "portfolio_links": row.freelancer_portfolio_links
            } if row.freelancer_id_full else None,
            "project": {
                "id": str(row.project_id_full),
                "title": row.project_title,
                "client_id": str(row.project_client_id) if row.project_client_id else None,
                "status": row.project_status
            } if row.project_id_full else None
        }
    }


# ==================== 原: src/app/api/v1/bids/[id]/accept/route.ts ====================

@router.post("/{bid_id}/accept", response_model=SuccessResponse[dict])
async def accept_bid(
    bid_id: UUID,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    接受投標
    
    原始檔案: src/app/api/v1/bids/[id]/accept/route.ts
    對應 Service: BidService.acceptBid()
    
    RLS 邏輯: 只有專案擁有者可接受
    """
    # 查詢投標（使用 raw SQL）
    sql = """
        SELECT 
            b.id,
            b.project_id,
            b.freelancer_id,
            b.status,
            p.id as project_id_full,
            p.client_id,
            p.status as project_status
        FROM bids b
        INNER JOIN projects p ON p.id = b.project_id
        WHERE b.id = :bid_id
    """
    
    result = await db.execute(text(sql), {'bid_id': str(bid_id)})
    row = result.fetchone()
    
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="投標不存在"
        )
    
    # ========== RLS 邏輯 ==========
    # 只有專案擁有者可接受
    if str(row.client_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您沒有權限接受此投標"
        )
    
    # 專案必須是 open 狀態
    if row.project_status != ProjectStatus.OPEN.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="此案件目前不接受投標"
        )
    
    # 投標必須是 pending 狀態
    if row.status != BidStatus.PENDING.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="此投標狀態不允許接受"
        )
    
    # 更新投標狀態
    update_bid_sql = """
        UPDATE bids
        SET status = :status
        WHERE id = :bid_id
    """
    await db.execute(text(update_bid_sql), {
        'status': BidStatus.ACCEPTED.value,
        'bid_id': str(bid_id)
    })
    
    # 更新專案狀態
    update_project_sql = """
        UPDATE projects
        SET status = :status, accepted_bid_id = :bid_id
        WHERE id = :project_id
    """
    await db.execute(text(update_project_sql), {
        'status': ProjectStatus.IN_PROGRESS.value,
        'bid_id': str(bid_id),
        'project_id': str(row.project_id)
    })
    
    # 取得專案標題（用於通知）
    project_title_sql = """
        SELECT title FROM projects WHERE id = :project_id
    """
    project_title_result = await db.execute(text(project_title_sql), {'project_id': str(row.project_id)})
    project_title_row = project_title_result.fetchone()
    project_title = project_title_row.title if project_title_row else "案件"
    
    # 更新其他投標狀態為 rejected
    update_other_bids_sql = """
        UPDATE bids
        SET status = :status
        WHERE project_id = :project_id
          AND id != :bid_id
          AND status = :pending_status
        RETURNING id, freelancer_id
    """
    other_bids_result = await db.execute(text(update_other_bids_sql), {
        'status': BidStatus.REJECTED.value,
        'project_id': str(row.project_id),
        'bid_id': str(bid_id),
        'pending_status': BidStatus.PENDING.value
    })
    other_bids = other_bids_result.fetchall()
    
    # 建立通知（批次）
    notification_sql = """
        INSERT INTO notifications (id, user_id, type, title, content, related_project_id, related_bid_id, is_read, created_at)
        VALUES (:id, :user_id, :type, :title, :content, :related_project_id, :related_bid_id, FALSE, NOW())
    """
    
    # 為其他被拒絕的接案者建立通知
    for other_bid_row in other_bids:
        await db.execute(text(notification_sql), {
            'id': str(uuid.uuid4()),
            'user_id': str(other_bid_row.freelancer_id),
            'type': NotificationType.BID_REJECTED.value,
            'title': "投標未被接受",
            'content': f"您對案件「{project_title}」的投標未被接受",
            'related_project_id': str(row.project_id),
            'related_bid_id': str(other_bid_row.id)
        })
    
    # 為接案者建立通知
    await db.execute(text(notification_sql), {
        'id': str(uuid.uuid4()),
        'user_id': str(row.freelancer_id),
        'type': NotificationType.BID_ACCEPTED.value,
        'title': "投標已接受",
        'content': f"恭喜！您對案件「{project_title}」的投標已被接受",
        'related_project_id': str(row.project_id),
        'related_bid_id': str(bid_id)
    })
    
    return {
        "success": True,
        "message": "投標已接受",
        "data": {
            "id": str(bid_id),
            "status": BidStatus.ACCEPTED.value,
            "project_status": ProjectStatus.IN_PROGRESS.value
        }
    }


# ==================== 原: src/app/api/v1/bids/[id]/reject/route.ts ====================

@router.post("/{bid_id}/reject", response_model=SuccessResponse[dict])
async def reject_bid(
    bid_id: UUID,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    拒絕投標
    
    原始檔案: src/app/api/v1/bids/[id]/reject/route.ts
    對應 Service: BidService.rejectBid()
    
    RLS 邏輯: 只有專案擁有者可拒絕
    """
    # 查詢投標（使用 raw SQL）
    sql = """
        SELECT 
            b.id,
            b.project_id,
            b.freelancer_id,
            b.status,
            p.client_id,
            p.title as project_title
        FROM bids b
        INNER JOIN projects p ON p.id = b.project_id
        WHERE b.id = :bid_id
    """
    
    result = await db.execute(text(sql), {'bid_id': str(bid_id)})
    row = result.fetchone()
    
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="投標不存在"
        )
    
    # ========== RLS 邏輯 ==========
    if str(row.client_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您沒有權限拒絕此投標"
        )
    
    # 投標必須是 pending 狀態
    if row.status != BidStatus.PENDING.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="此投標狀態不允許拒絕"
        )
    
    # 更新狀態
    update_sql = """
        UPDATE bids
        SET status = :status
        WHERE id = :bid_id
    """
    await db.execute(text(update_sql), {
        'status': BidStatus.REJECTED.value,
        'bid_id': str(bid_id)
    })
    
    # 建立通知
    notification_sql = """
        INSERT INTO notifications (id, user_id, type, title, content, related_project_id, related_bid_id, is_read, created_at)
        VALUES (:id, :user_id, :type, :title, :content, :related_project_id, :related_bid_id, FALSE, NOW())
    """
    await db.execute(text(notification_sql), {
        'id': str(uuid.uuid4()),
        'user_id': str(row.freelancer_id),
        'type': NotificationType.BID_REJECTED.value,
        'title': "投標未被接受",
        'content': f"您對案件「{row.project_title}」的投標未被接受",
        'related_project_id': str(row.project_id),
        'related_bid_id': str(bid_id)
    })
    
    return {
        "success": True,
        "message": "投標已拒絕",
        "data": {
            "id": str(bid_id),
            "status": BidStatus.REJECTED.value
        }
    }


# ==================== 撤回提案（7天後未接受可撤回並退款） ====================

@router.post("/{bid_id}/withdraw", response_model=SuccessResponse[dict])
async def withdraw_bid(
    bid_id: UUID,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    撤回提案（7天後未被接受的提案可撤回，退還 100 代幣）
    
    邏輯：
    1. 檢查提案是否存在且屬於當前使用者
    2. 檢查提案狀態為 pending
    3. 檢查提案是否超過 7 天
    4. 刪除相關的 bid、conversation、messages、user_connection
    5. 退還 100 代幣給提案者
    """
    # 查詢提案及相關資訊
    bid_sql = """
        SELECT 
            b.id,
            b.freelancer_id,
            b.status,
            b.created_at,
            b.project_id,
            p.title as project_title
        FROM bids b
        LEFT JOIN projects p ON p.id = b.project_id
        WHERE b.id = :bid_id
    """
    result = await db.execute(text(bid_sql), {'bid_id': str(bid_id)})
    bid = result.fetchone()
    
    if not bid:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="找不到該提案"
        )
    
    # 檢查權限：只有提案者本人可撤回
    if str(bid.freelancer_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您沒有權限撤回此提案"
        )
    
    # 檢查狀態：只有 pending 狀態可撤回
    if bid.status != BidStatus.PENDING.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="只能撤回待審核的提案"
        )
    
    # 檢查時間：必須超過 7 天
    created_at = bid.created_at
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
    
    days_passed = (datetime.utcnow() - created_at).days
    if days_passed < 7:
        remaining_days = 7 - days_passed
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"提案需等待 7 天後才能撤回，還剩 {remaining_days} 天"
        )
    
    # 查詢相關的對話 ID
    conv_sql = """
        SELECT id FROM conversations
        WHERE bid_id = :bid_id
    """
    conv_result = await db.execute(text(conv_sql), {'bid_id': str(bid_id)})
    conversation = conv_result.fetchone()
    conversation_id = str(conversation.id) if conversation else None
    
    # 開始刪除流程
    
    # 1. 刪除相關訊息（如果有對話）
    if conversation_id:
        delete_messages_sql = """
            DELETE FROM messages
            WHERE conversation_id = :conversation_id
        """
        await db.execute(text(delete_messages_sql), {'conversation_id': conversation_id})
        
        # 2. 刪除 user_connection
        delete_connection_sql = """
            DELETE FROM user_connections
            WHERE conversation_id = :conversation_id
        """
        await db.execute(text(delete_connection_sql), {'conversation_id': conversation_id})
        
        # 3. 刪除對話
        delete_conv_sql = """
            DELETE FROM conversations
            WHERE id = :conversation_id
        """
        await db.execute(text(delete_conv_sql), {'conversation_id': conversation_id})
    
    # 4. 刪除提案
    delete_bid_sql = """
        DELETE FROM bids
        WHERE id = :bid_id
    """
    await db.execute(text(delete_bid_sql), {'bid_id': str(bid_id)})
    
    # 5. 退還 100 代幣
    update_token_sql = """
        UPDATE user_tokens
        SET balance = balance + 100,
            updated_at = NOW()
        WHERE user_id = :user_id
        RETURNING balance
    """
    token_result = await db.execute(text(update_token_sql), {'user_id': str(current_user.id)})
    new_balance_row = token_result.fetchone()
    
    # 6. 記錄代幣交易
    insert_transaction_sql = """
        INSERT INTO token_transactions (
            id, user_id, amount, balance_after, transaction_type, 
            reference_id, description, created_at
        )
        VALUES (
            :id, :user_id, :amount, :balance_after, :transaction_type,
            :reference_id, :description, NOW()
        )
    """
    await db.execute(text(insert_transaction_sql), {
        'id': str(uuid.uuid4()),
        'user_id': str(current_user.id),
        'amount': 100,
        'balance_after': new_balance_row.balance if new_balance_row else 100,
        'transaction_type': TransactionType.REFUND.value,
        'reference_id': str(bid_id),
        'description': f"撤回提案「{bid.project_title}」，退還代幣"
    })
    
    return {
        "success": True,
        "message": "提案已撤回，已退還 100 代幣",
        "data": {
            "bid_id": str(bid_id),
            "refunded_amount": 100,
            "new_balance": new_balance_row.balance if new_balance_row else 100
        }
    }


# ==================== 原: src/app/api/v1/projects/[id]/bids/route.ts POST ====================

@router.post("/projects/{project_id}/bids", response_model=SuccessResponse[dict], status_code=status.HTTP_201_CREATED)
async def create_bid(
    project_id: UUID,
    data: BidCreate,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    建立投標 - 使用 Raw SQL
    
    原始檔案: src/app/api/v1/projects/[id]/bids/route.ts POST
    對應 Service: BidService.createBid()
    
    RLS 邏輯: 必須登入；freelancer_id = 當前使用者；專案必須是 open
    """
    # 查詢專案
    project_sql = """
        SELECT id, client_id, status, title
        FROM projects
        WHERE id = :project_id
    """
    result = await db.execute(text(project_sql), {'project_id': str(project_id)})
    project = result.fetchone()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="案件不存在"
        )
    
    # 專案必須是 open 狀態
    if project.status != ProjectStatus.OPEN.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="此案件目前不接受投標"
        )
    
    # 不能投標自己的案件
    if str(project.client_id) == str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="不能投標自己的案件"
        )
    
    # 檢查是否已投標過
    check_bid_sql = """
        SELECT id FROM bids
        WHERE project_id = :project_id AND freelancer_id = :freelancer_id
    """
    existing_bid_result = await db.execute(text(check_bid_sql), {
        'project_id': str(project_id),
        'freelancer_id': str(current_user.id)
    })
    if existing_bid_result.fetchone():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="您已經投標過此案件"
        )
    
    # 檢查代幣餘額（需要 100 代幣提交提案）
    balance_sql = "SELECT id, balance FROM user_tokens WHERE user_id = :user_id"
    balance_result = await db.execute(text(balance_sql), {'user_id': str(current_user.id)})
    user_token = balance_result.fetchone()
    
    if not user_token or user_token.balance < 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="代幣餘額不足，提交提案需要 100 代幣"
        )
    
    # 建立投標
    bid_id = uuid.uuid4()
    insert_bid_sql = """
        INSERT INTO bids (id, project_id, freelancer_id, proposal, bid_amount, estimated_days, status, created_at, updated_at)
        VALUES (:id, :project_id, :freelancer_id, :proposal, :bid_amount, :estimated_days, :status, NOW(), NOW())
        RETURNING id, project_id, proposal, bid_amount, estimated_days, status, created_at
    """
    
    result = await db.execute(text(insert_bid_sql), {
        'id': str(bid_id),
        'project_id': str(project_id),
        'freelancer_id': str(current_user.id),
        'proposal': data.proposal,
        'bid_amount': float(data.bid_amount) if data.bid_amount else None,
        'estimated_days': data.estimated_days,
        'status': BidStatus.PENDING.value
    })
    new_bid = result.fetchone()
    
    # 建立提案對話（project_proposal 類型）
    conversation_id = uuid.uuid4()
    insert_conv_sql = """
        INSERT INTO conversations (
            id, type, project_id, bid_id, initiator_id, recipient_id, 
            initiator_paid, recipient_paid, is_unlocked, 
            created_at, updated_at
        )
        VALUES (
            :id, :type, :project_id, :bid_id, :initiator_id, :recipient_id,
            TRUE, FALSE, FALSE, NOW(), NOW()
        )
    """
    await db.execute(text(insert_conv_sql), {
        'id': str(conversation_id),
        'type': ConversationType.PROJECT_PROPOSAL.value,
        'project_id': str(project_id),
        'bid_id': str(bid_id),
        'initiator_id': str(current_user.id),
        'recipient_id': str(project.client_id)
    })
    
    # 建立 user_connection 記錄（initiator 已付費，recipient 未付費，7 天後過期）
    # 使用 ON CONFLICT 處理可能的重複記錄（例如之前撤回投標但 connection 未正確刪除的情況）
    connection_id = uuid.uuid4()
    expires_at = datetime.utcnow() + timedelta(days=7)
    insert_connection_sql = """
        INSERT INTO user_connections (
            id, initiator_id, recipient_id, connection_type,
            status, conversation_id, initiator_unlocked_at, recipient_unlocked_at,
            expires_at, created_at, updated_at
        )
        VALUES (
            :id, :initiator_id, :recipient_id, :connection_type,
            'pending', :conversation_id, NOW(), NULL, :expires_at, NOW(), NOW()
        )
        ON CONFLICT (initiator_id, recipient_id, connection_type)
        DO UPDATE SET
            status = 'pending',
            conversation_id = :conversation_id,
            initiator_unlocked_at = NOW(),
            recipient_unlocked_at = NULL,
            expires_at = :expires_at,
            updated_at = NOW()
    """
    await db.execute(text(insert_connection_sql), {
        'id': str(connection_id),
        'initiator_id': str(current_user.id),
        'recipient_id': str(project.client_id),
        'connection_type': ConversationType.PROJECT_PROPOSAL.value,
        'conversation_id': str(conversation_id),
        'expires_at': expires_at
    })
    
    # 建立初始提案訊息（接案者發送提案內容）
    initial_message_id = uuid.uuid4()
    insert_message_sql = """
        INSERT INTO messages (id, conversation_id, sender_id, content, is_read, created_at)
        VALUES (:id, :conversation_id, :sender_id, :content, FALSE, NOW())
    """
    await db.execute(text(insert_message_sql), {
        'id': str(initial_message_id),
        'conversation_id': str(conversation_id),
        'sender_id': str(current_user.id),
        'content': data.proposal
    })
    
    # 扣除代幣（100 代幣）
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
    
    # 記錄代幣交易
    insert_transaction_sql = """
        INSERT INTO token_transactions (
            id, user_id, amount, balance_after, transaction_type, 
            reference_id, description, created_at
        )
        VALUES (
            :id, :user_id, :amount, :balance_after, :transaction_type,
            :reference_id, :description, NOW()
        )
    """
    await db.execute(text(insert_transaction_sql), {
        'id': str(uuid.uuid4()),
        'user_id': str(current_user.id),
        'amount': -100,
        'balance_after': new_balance_row.balance,
        'transaction_type': TransactionType.SUBMIT_PROPOSAL.value,
        'reference_id': str(conversation_id),
        'description': f"提交提案至「{project.title}」"
    })
    
    # 建立通知給發案者
    notification_sql = """
        INSERT INTO notifications (id, user_id, type, title, content, related_project_id, related_bid_id, is_read, created_at)
        VALUES (:id, :user_id, :type, :title, :content, :related_project_id, :related_bid_id, FALSE, NOW())
    """
    await db.execute(text(notification_sql), {
        'id': str(uuid.uuid4()),
        'user_id': str(project.client_id),
        'type': NotificationType.BID_RECEIVED.value,
        'title': "收到新提案",
        'content': f"{current_user.name} 對您的案件「{project.title}」提交了提案",
        'related_project_id': str(project_id),
        'related_bid_id': str(bid_id)
    })
    
    return {
        "success": True,
        "message": "提案已提交，扣除 100 代幣",
        "data": {
            "id": str(new_bid.id),
            "project_id": str(new_bid.project_id),
            "proposal": new_bid.proposal,
            "bid_amount": float(new_bid.bid_amount) if new_bid.bid_amount else None,
            "estimated_days": new_bid.estimated_days,
            "status": new_bid.status,
            "created_at": new_bid.created_at,
            "conversation_id": str(conversation_id),
            "expires_at": expires_at.isoformat()
        }
    }


# ==================== 原: src/app/api/v1/projects/[id]/bids/route.ts GET ====================

@router.get("/projects/{project_id}/bids", response_model=SuccessResponse[list])
async def get_project_bids(
    project_id: UUID,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    取得專案的所有投標（發案者專用） - 使用 Raw SQL
    
    原始檔案: src/app/api/v1/projects/[id]/bids/route.ts GET
    對應 Service: BidService.getProjectBids()
    
    RLS 邏輯: 只有專案擁有者可查看所有投標
    """
    # 查詢專案
    project_sql = """
        SELECT id, client_id
        FROM projects
        WHERE id = :project_id
    """
    result = await db.execute(text(project_sql), {'project_id': str(project_id)})
    project = result.fetchone()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="案件不存在"
        )
    
    # ========== RLS 邏輯 ==========
    # 只有專案擁有者可查看
    if str(project.client_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您沒有權限查看此案件的投標"
        )
    
    # 查詢投標（使用 raw SQL）
    sql = """
        SELECT 
            b.id,
            b.proposal,
            b.bid_amount,
            b.estimated_days,
            b.status,
            b.created_at,
            u.id as freelancer_id,
            u.name as freelancer_name,
            u.avatar_url as freelancer_avatar_url,
            u.rating as freelancer_rating,
            u.skills as freelancer_skills,
            u.bio as freelancer_bio,
            u.portfolio_links as freelancer_portfolio_links
        FROM bids b
        LEFT JOIN users u ON u.id = b.freelancer_id
        WHERE b.project_id = :project_id
        ORDER BY b.created_at DESC
    """
    
    bids_result = await db.execute(text(sql), {'project_id': str(project_id)})
    rows = bids_result.fetchall()
    
    bids_data = []
    for row in rows:
        bids_data.append({
            "id": str(row.id),
            "proposal": row.proposal,
            "bid_amount": float(row.bid_amount) if row.bid_amount else None,
            "estimated_days": row.estimated_days,
            "status": row.status,
            "created_at": row.created_at,
            "freelancer": {
                "id": str(row.freelancer_id),
                "name": row.freelancer_name,
                "avatar_url": row.freelancer_avatar_url,
                "rating": float(row.freelancer_rating) if row.freelancer_rating else None,
                "skills": parse_pg_array(row.freelancer_skills),
                "bio": row.freelancer_bio,
                "portfolio_links": row.freelancer_portfolio_links
            } if row.freelancer_id else None
        })
    
    return {
        "success": True,
        "data": bids_data
    }

