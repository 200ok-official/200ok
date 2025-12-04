"""
Saved Projects Endpoints
對應原本的 src/app/api/v1/projects/[id]/save/route.ts 和 src/app/api/v1/projects/saved/route.ts
使用 Raw SQL 優化
"""
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
import uuid

from ...db import get_db
from ...models.user import User
from ...schemas.common import SuccessResponse
from ...dependencies import get_current_user, PaginationParams


router = APIRouter(prefix="/projects", tags=["saved-projects"])


# ==================== 原: src/app/api/v1/projects/[id]/save/route.ts ====================

@router.post("/{project_id}/save", response_model=SuccessResponse[dict], status_code=status.HTTP_201_CREATED)
async def save_project(
    project_id: UUID,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    收藏案件 - 使用 Raw SQL
    
    原始檔案: src/app/api/v1/projects/[id]/save/route.ts POST
    
    RLS 邏輯: 必須登入
    """
    # 檢查專案是否存在
    check_project_sql = "SELECT id FROM projects WHERE id = :project_id"
    project_result = await db.execute(text(check_project_sql), {'project_id': str(project_id)})
    project = project_result.fetchone()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="案件不存在"
        )
    
    # 檢查是否已收藏
    check_saved_sql = """
        SELECT id 
        FROM saved_projects 
        WHERE user_id = :user_id AND project_id = :project_id
    """
    existing_result = await db.execute(text(check_saved_sql), {
        'user_id': str(current_user.id),
        'project_id': str(project_id)
    })
    if existing_result.fetchone():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="已經收藏過此案件"
        )
    
    # 建立收藏
    insert_sql = """
        INSERT INTO saved_projects (id, user_id, project_id, created_at)
        VALUES (:id, :user_id, :project_id, NOW())
    """
    await db.execute(text(insert_sql), {
        'id': str(uuid.uuid4()),
        'user_id': str(current_user.id),
        'project_id': str(project_id)
    })
    
    return {
        "success": True,
        "message": "收藏成功",
        "data": {"project_id": str(project_id)}
    }


@router.delete("/{project_id}/save", response_model=SuccessResponse[dict])
async def unsave_project(
    project_id: UUID,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    取消收藏案件 - 使用 Raw SQL
    
    原始檔案: src/app/api/v1/projects/[id]/save/route.ts DELETE
    
    RLS 邏輯: 必須登入；只能取消自己的收藏
    """
    # 刪除收藏
    delete_sql = """
        DELETE FROM saved_projects
        WHERE user_id = :user_id AND project_id = :project_id
    """
    result = await db.execute(text(delete_sql), {
        'user_id': str(current_user.id),
        'project_id': str(project_id)
    })
    
    if result.rowcount == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="尚未收藏此案件"
        )
    
    return {
        "success": True,
        "message": "已取消收藏",
        "data": {}
    }


# ==================== 原: src/app/api/v1/projects/saved/route.ts ====================

@router.get("/saved/list", response_model=SuccessResponse[dict])
async def get_saved_projects(
    pagination: PaginationParams = Depends(),
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    取得我的收藏案件 - 使用 Raw SQL
    
    原始檔案: src/app/api/v1/projects/saved/route.ts
    
    RLS 邏輯: 只能查看自己的收藏
    """
    # 計算總數
    count_sql = """
        SELECT COUNT(*)
        FROM saved_projects
        WHERE user_id = :user_id
    """
    count_result = await db.execute(text(count_sql), {'user_id': str(current_user.id)})
    total = count_result.scalar() or 0
    
    # 查詢收藏（一次性取得所有資料）
    sql = """
        SELECT 
            p.id,
            p.title,
            p.description,
            p.budget_min,
            p.budget_max,
            p.status,
            p.created_at,
            sp.created_at as saved_at,
            u.id as client_id,
            u.name as client_name,
            u.avatar_url as client_avatar_url
        FROM saved_projects sp
        INNER JOIN projects p ON p.id = sp.project_id
        LEFT JOIN users u ON u.id = p.client_id
        WHERE sp.user_id = :user_id
        ORDER BY sp.created_at DESC
        LIMIT :limit OFFSET :offset
    """
    
    params = {
        'user_id': str(current_user.id),
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
            "description": row.description,
            "budget_min": float(row.budget_min) if row.budget_min else None,
            "budget_max": float(row.budget_max) if row.budget_max else None,
            "status": row.status,
            "created_at": row.created_at,
            "saved_at": row.saved_at,
            "client": {
                "id": str(row.client_id),
                "name": row.client_name,
                "avatar_url": row.client_avatar_url
            } if row.client_id else None
        })
    
    return {
        "success": True,
        "data": {
            "projects": projects_data,
            "pagination": pagination.get_response_metadata(total)
        }
    }
