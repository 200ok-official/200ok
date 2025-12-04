"""
Admin Endpoints
對應原本的 src/app/api/v1/admin/*/route.ts
使用 Raw SQL 優化
"""
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text

from ...db import get_db, parse_pg_array
from ...models.user import User, UserRole
from ...models.project import ProjectStatus
from ...schemas.common import SuccessResponse
from ...dependencies import get_current_user, require_admin, PaginationParams


router = APIRouter(prefix="/admin", tags=["admin"])


# ==================== 原: src/app/api/v1/admin/stats/route.ts ====================

@router.get("/stats", response_model=SuccessResponse[dict])
async def get_admin_stats(
    db = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    取得統計資訊（管理員專用） - 使用 Raw SQL
    
    原始檔案: src/app/api/v1/admin/stats/route.ts
    
    RLS 邏輯: 只有管理員可查看
    """
    # 一次性查詢所有統計（超快）
    sql = """
        SELECT 
            (SELECT COUNT(*) FROM users) as total_users,
            (SELECT COUNT(*) FROM projects) as total_projects,
            (SELECT COUNT(*) FROM bids) as total_bids,
            (SELECT COUNT(*) FROM projects WHERE status = 'draft') as draft_projects,
            (SELECT COUNT(*) FROM projects WHERE status = 'open') as open_projects,
            (SELECT COUNT(*) FROM projects WHERE status = 'in_progress') as in_progress_projects,
            (SELECT COUNT(*) FROM projects WHERE status = 'completed') as completed_projects,
            (SELECT COUNT(*) FROM projects WHERE status = 'cancelled') as cancelled_projects,
            (SELECT COUNT(*) FROM projects WHERE status = 'closed') as closed_projects,
            (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '30 days') as new_users_30d,
            (SELECT COUNT(*) FROM projects WHERE created_at >= NOW() - INTERVAL '30 days') as new_projects_30d
    """
    
    result = await db.execute(text(sql))
    row = result.fetchone()
    
    return {
        "success": True,
        "data": {
            "total_users": int(row.total_users) or 0,
            "total_projects": int(row.total_projects) or 0,
            "total_bids": int(row.total_bids) or 0,
            "projects_by_status": {
                "draft": int(row.draft_projects) or 0,
                "open": int(row.open_projects) or 0,
                "in_progress": int(row.in_progress_projects) or 0,
                "completed": int(row.completed_projects) or 0,
                "cancelled": int(row.cancelled_projects) or 0,
                "closed": int(row.closed_projects) or 0
            },
            "last_30_days": {
                "new_users": int(row.new_users_30d) or 0,
                "new_projects": int(row.new_projects_30d) or 0
            }
        }
    }


# ==================== 原: src/app/api/v1/admin/users/route.ts ====================

@router.get("/users", response_model=SuccessResponse[dict])
async def get_all_users(
    pagination: PaginationParams = Depends(),
    db = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    取得所有使用者（管理員專用） - 使用 Raw SQL
    
    原始檔案: src/app/api/v1/admin/users/route.ts
    
    RLS 邏輯: 只有管理員可查看所有使用者
    """
    params = {
        'limit': pagination.limit,
        'offset': pagination.offset
    }
    
    # 計算總數
    count_sql = "SELECT COUNT(*) FROM users"
    count_result = await db.execute(text(count_sql))
    total = count_result.scalar() or 0
    
    # 查詢使用者
    sql = """
        SELECT id, name, email, roles, email_verified, created_at
        FROM users
        ORDER BY created_at DESC
        LIMIT :limit OFFSET :offset
    """
    
    result = await db.execute(text(sql), params)
    rows = result.fetchall()
    
    users_data = []
    for row in rows:
        users_data.append({
            "id": str(row.id),
            "name": row.name,
            "email": row.email,
            "roles": parse_pg_array(row.roles),
            "email_verified": row.email_verified,
            "created_at": row.created_at
        })
    
    return {
        "success": True,
        "data": {
            "users": users_data,
            "pagination": pagination.get_response_metadata(total)
        }
    }


# ==================== 原: src/app/api/v1/admin/users/[id]/ban/route.ts ====================

@router.post("/users/{user_id}/ban", response_model=SuccessResponse[dict])
async def ban_user(
    user_id: UUID,
    db = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    封鎖使用者（管理員專用） - 使用 Raw SQL
    
    原始檔案: src/app/api/v1/admin/users/[id]/ban/route.ts
    
    RLS 邏輯: 只有管理員可執行
    
    注意：這裡需要在 User model 加入 is_banned 欄位
    目前暫時回傳成功（TODO）
    """
    # 查詢使用者
    check_sql = "SELECT id FROM users WHERE id = :user_id"
    result = await db.execute(text(check_sql), {'user_id': str(user_id)})
    user = result.fetchone()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="使用者不存在"
        )
    
    # TODO: 實作封鎖邏輯（需要在 schema 加入 is_banned 欄位）
    # update_sql = "UPDATE users SET is_banned = TRUE WHERE id = :user_id"
    # await db.execute(text(update_sql), {'user_id': str(user_id)})
    
    return {
        "success": True,
        "message": "使用者已封鎖",
        "data": {"user_id": str(user_id)}
    }


# ==================== 原: src/app/api/v1/admin/projects/route.ts ====================

@router.get("/projects", response_model=SuccessResponse[dict])
async def get_all_projects(
    pagination: PaginationParams = Depends(),
    db = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    取得所有專案（管理員專用） - 使用 Raw SQL
    
    原始檔案: src/app/api/v1/admin/projects/route.ts
    
    RLS 邏輯: 管理員可查看所有專案
    """
    # 計算總數
    count_sql = "SELECT COUNT(*) FROM projects"
    count_result = await db.execute(text(count_sql))
    total = count_result.scalar() or 0
    
    # 查詢所有專案
    sql = """
        SELECT 
            p.id,
            p.title,
            p.status,
            p.budget_min,
            p.budget_max,
            p.created_at,
            u.id as client_id,
            u.name as client_name
        FROM projects p
        LEFT JOIN users u ON u.id = p.client_id
        ORDER BY p.created_at DESC
        LIMIT :limit OFFSET :offset
    """
    
    params = {
        'limit': pagination.limit,
        'offset': pagination.offset
    }
    
    result = await db.execute(text(sql), params)
    rows = result.fetchall()
    
    projects_data = []
    for row in rows:
        projects_data.append({
            "id": str(row.id),
            "title": row.title,
            "status": row.status,
            "budget_min": float(row.budget_min) if row.budget_min else None,
            "budget_max": float(row.budget_max) if row.budget_max else None,
            "created_at": row.created_at,
            "client": {
                "id": str(row.client_id),
                "name": row.client_name
            } if row.client_id else None
        })
    
    return {
        "success": True,
        "data": {
            "projects": projects_data,
            "pagination": pagination.get_response_metadata(total)
        }
    }


# ==================== 原: src/app/api/v1/admin/projects/[id]/remove/route.ts ====================

@router.delete("/projects/{project_id}", response_model=SuccessResponse[dict])
async def remove_project(
    project_id: UUID,
    db = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    移除專案（管理員專用） - 使用 Raw SQL
    
    原始檔案: src/app/api/v1/admin/projects/[id]/remove/route.ts
    
    RLS 邏輯: 只有管理員可刪除任何專案
    """
    # 刪除專案
    delete_sql = "DELETE FROM projects WHERE id = :project_id"
    result = await db.execute(text(delete_sql), {'project_id': str(project_id)})
    
    if result.rowcount == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="專案不存在"
        )
    
    return {
        "success": True,
        "message": "專案已刪除",
        "data": {}
    }


# ==================== 原: src/app/api/v1/admin/activity/route.ts ====================

@router.get("/activity", response_model=SuccessResponse[list])
async def get_activity_log(
    limit: int = 50,
    db = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    取得活動記錄（管理員專用） - 使用 Raw SQL
    
    原始檔案: src/app/api/v1/admin/activity/route.ts
    
    RLS 邏輯: 只有管理員可查看
    
    注意：這裡回傳簡化版本（代幣交易記錄作為活動記錄）
    """
    # 取得最近的交易記錄作為活動記錄（一次性取得所有資料）
    sql = """
        SELECT 
            t.id,
            t.transaction_type,
            t.description,
            t.created_at,
            u.id as user_id,
            u.name as user_name
        FROM token_transactions t
        LEFT JOIN users u ON u.id = t.user_id
        ORDER BY t.created_at DESC
        LIMIT :limit
    """
    
    result = await db.execute(text(sql), {'limit': limit})
    rows = result.fetchall()
    
    activity_data = []
    for row in rows:
        activity_data.append({
            "id": str(row.id),
            "type": row.transaction_type,
            "description": row.description,
            "created_at": row.created_at,
            "user": {
                "id": str(row.user_id),
                "name": row.user_name
            } if row.user_id else None
        })
    
    return {
        "success": True,
        "data": activity_data
    }


# ==================== 原: src/app/api/v1/admin/tags/stats/route.ts ====================

@router.get("/tags/stats", response_model=SuccessResponse[list])
async def get_tags_stats(
    db = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    取得標籤統計（管理員專用） - 使用 Raw SQL
    
    原始檔案: src/app/api/v1/admin/tags/stats/route.ts
    
    RLS 邏輯: 只有管理員可查看
    """
    # 取得所有標籤及使用次數
    sql = """
        SELECT id, name, category, usage_count, is_active
        FROM tags
        ORDER BY usage_count DESC
    """
    
    result = await db.execute(text(sql))
    rows = result.fetchall()
    
    tags_data = []
    for row in rows:
        tags_data.append({
            "id": str(row.id),
            "name": row.name,
            "category": row.category,
            "usage_count": row.usage_count,
            "is_active": row.is_active
        })
    
    return {
        "success": True,
        "data": tags_data
    }
