"""
Users Endpoints
對應原本的 src/app/api/v1/users/*/route.ts
使用 Raw SQL 優化
"""
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import text

from ...db import get_db, parse_pg_array
from ...models.user import User
from ...schemas.user import UserPublic, UserProfile, UpdateUserRequest, UpdatePasswordRequest
from ...schemas.common import SuccessResponse
from ...dependencies import get_current_user, get_current_user_optional, PaginationParams
from ...security import hash_password, verify_password


router = APIRouter(prefix="/users", tags=["users"])


# ==================== 原: src/app/api/v1/users/search/route.ts ====================
# 注意：搜尋路由必須在 /{user_id} 之前定義，避免 FastAPI 將 'search' 解析為 UUID

@router.get("/search")
async def search_users(
    skills: Optional[list[str]] = Query(None, alias="skills[]"),
    min_rating: Optional[float] = Query(None, alias="minRating"),
    pagination: PaginationParams = Depends(),
    db = Depends(get_db)
):
    """
    搜尋使用者（預設搜尋接案者） - 使用 Raw SQL
    
    原始檔案: src/app/api/v1/users/search/route.ts
    對應 Service: UserService.searchFreelancers()
    
    RLS 邏輯: 任何人都可搜尋
    """
    from ...models.user import UserRole
    
    # 建立 WHERE 條件
    where_conditions = ["'freelancer' = ANY(roles)"]
    params = {
        'limit': pagination.limit,
        'offset': pagination.offset
    }
    
    # 技能篩選（PostgreSQL array overlap）
    if skills:
        where_conditions.append("skills && :skills")
        params['skills'] = skills
    
    # 評分篩選
    if min_rating is not None:
        where_conditions.append("rating >= :min_rating")
        params['min_rating'] = min_rating
    
    where_clause = " AND ".join(where_conditions)
    
    # 計算總數
    count_sql = f"""
        SELECT COUNT(*)
        FROM users
        WHERE {where_clause}
    """
    count_result = await db.execute(text(count_sql), params)
    total = count_result.scalar() or 0
    
    # 主查詢 - 包含統計資訊
    sql = f"""
        SELECT 
            u.id, 
            u.name, 
            u.bio, 
            u.skills, 
            u.avatar_url, 
            u.rating, 
            u.portfolio_links, 
            u.created_at,
            (SELECT COUNT(*) FROM bids WHERE freelancer_id = u.id) as bids_count,
            (
                SELECT COUNT(*)
                FROM projects p
                WHERE p.status = 'completed'
                  AND p.id IN (SELECT project_id FROM bids WHERE freelancer_id = u.id)
            ) as completed_projects_count
        FROM users u
        WHERE {where_clause}
        ORDER BY u.rating DESC NULLS LAST
        LIMIT :limit OFFSET :offset
    """
    
    result = await db.execute(text(sql), params)
    rows = result.fetchall()
    
    users_data = [
        {
            "id": str(row.id),
            "name": row.name,
            "bio": row.bio,
            "skills": parse_pg_array(row.skills),
            "avatar_url": row.avatar_url,
            "rating": float(row.rating) if row.rating else None,
            "portfolio_links": parse_pg_array(row.portfolio_links),
            "created_at": row.created_at,
            "bids_count": int(row.bids_count) or 0,
            "completed_projects_count": int(row.completed_projects_count) or 0
        }
        for row in rows
    ]
    
    return {
        "success": True,
        "data": users_data,
        "pagination": pagination.get_response_metadata(total)
    }


@router.get("/search/freelancers")
async def search_freelancers(
    skills: Optional[list[str]] = Query(None, alias="skills[]"),
    min_rating: Optional[float] = Query(None, alias="minRating"),
    pagination: PaginationParams = Depends(),
    db = Depends(get_db)
):
    """
    搜尋接案者 - 使用 Raw SQL
    
    原始檔案: src/app/api/v1/users/search/route.ts
    對應 Service: UserService.searchFreelancers()
    
    RLS 邏輯: 任何人都可搜尋
    """
    # 建立 WHERE 條件
    where_conditions = ["'freelancer' = ANY(roles)"]
    params = {
        'limit': pagination.limit,
        'offset': pagination.offset
    }
    
    # 技能篩選（PostgreSQL array overlap）
    if skills:
        where_conditions.append("skills && :skills")
        params['skills'] = skills
    
    # 評分篩選
    if min_rating is not None:
        where_conditions.append("rating >= :min_rating")
        params['min_rating'] = min_rating
    
    where_clause = " AND ".join(where_conditions)
    
    # 計算總數
    count_sql = f"""
        SELECT COUNT(*)
        FROM users
        WHERE {where_clause}
    """
    count_result = await db.execute(text(count_sql), params)
    total = count_result.scalar() or 0
    
    # 主查詢
    sql = f"""
        SELECT 
            id, name, bio, skills, avatar_url, 
            rating, portfolio_links, created_at
        FROM users
        WHERE {where_clause}
        ORDER BY rating DESC NULLS LAST
        LIMIT :limit OFFSET :offset
    """
    
    result = await db.execute(text(sql), params)
    rows = result.fetchall()
    
    users_data = [
        {
            "id": str(row.id),
            "name": row.name,
            "bio": row.bio,
            "skills": parse_pg_array(row.skills),
            "avatar_url": row.avatar_url,
            "rating": float(row.rating) if row.rating else None,
            "portfolio_links": parse_pg_array(row.portfolio_links),
            "created_at": row.created_at
        }
        for row in rows
    ]
    
    return {
        "success": True,
        "data": {
            "users": users_data,
            "pagination": pagination.get_response_metadata(total)
        }
    }


# ==================== 原: src/app/api/v1/users/me/route.ts ====================

@router.get("/me/profile", response_model=SuccessResponse[dict])
async def get_my_profile(
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    取得自己的完整資料 - 使用 Raw SQL
    
    原始檔案: src/app/api/v1/users/me/route.ts GET
    對應 Service: UserService.getUserProfile()
    
    RLS 邏輯: 只能查看自己的完整資料（包含 email, phone）
    """
    # 一次性查詢所有資料（user + 統計）
    sql = """
        SELECT 
            u.*,
            (SELECT COUNT(*) FROM projects WHERE client_id = u.id) as projects_count,
            (SELECT COUNT(*) FROM bids WHERE freelancer_id = u.id) as bids_count,
            (SELECT COUNT(*) FROM reviews WHERE reviewee_id = u.id) as reviews_count
        FROM users u
        WHERE u.id = :user_id
    """
    
    result = await db.execute(text(sql), {'user_id': str(current_user.id)})
    row = result.fetchone()
    
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="使用者不存在"
        )
    
    return {
        "success": True,
        "data": {
            "id": str(row.id),
            "name": row.name,
            "email": row.email,
            "phone": row.phone,
            "roles": parse_pg_array(row.roles),
            "bio": row.bio,
            "skills": parse_pg_array(row.skills),
            "avatar_url": row.avatar_url,
            "rating": float(row.rating) if row.rating else None,
            "portfolio_links": parse_pg_array(row.portfolio_links),
            "email_verified": row.email_verified,
            "phone_verified": row.phone_verified,
            "created_at": row.created_at,
            "updated_at": row.updated_at,
            "projects_count": int(row.projects_count) or 0,
            "bids_count": int(row.bids_count) or 0,
            "reviews_count": int(row.reviews_count) or 0
        }
    }


@router.put("/me/profile", response_model=SuccessResponse[dict])
async def update_my_profile(
    data: UpdateUserRequest,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    更新自己的資料 - 使用 Raw SQL
    
    原始檔案: src/app/api/v1/users/me/route.ts PUT
    對應 Service: UserService.updateUser()
    
    RLS 邏輯: 只能更新自己的資料
    """
    # 建立更新字典
    update_dict = data.model_dump(exclude_unset=True)
    
    if not update_dict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="沒有要更新的欄位"
        )
    
    # 驗證 roles（如果有的話）
    if 'roles' in update_dict:
        roles = update_dict['roles']
        if not roles or len(roles) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="至少需要保留一個身份"
            )
        # 確保 roles 是 list 格式（psycopg 需要）
        if not isinstance(roles, list):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="roles 必須是陣列格式"
            )
    
    # 建立 UPDATE SQL
    set_clauses = []
    params = {'user_id': str(current_user.id)}
    
    for key, value in update_dict.items():
        # 對於數組字段，確保格式正確
        if key in ['roles', 'skills', 'portfolio_links'] and isinstance(value, list):
            # psycopg 會自動處理 Python list 到 PostgreSQL array 的轉換
            set_clauses.append(f"{key} = :{key}")
            params[key] = value
        else:
            set_clauses.append(f"{key} = :{key}")
            params[key] = value
    
    set_clauses.append("updated_at = NOW()")
    
    sql = f"""
        UPDATE users
        SET {', '.join(set_clauses)}
        WHERE id = :user_id
        RETURNING id, name, email, phone, bio, skills, avatar_url, portfolio_links, roles, updated_at
    """
    
    try:
        result = await db.execute(text(sql), params)
        row = result.fetchone()
    except Exception as e:
        # 記錄詳細錯誤以便除錯
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Update profile error: {str(e)}")
        logger.error(f"SQL: {sql}")
        logger.error(f"Params: {params}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"更新失敗：{str(e)}"
        )
    
    return {
        "success": True,
        "message": "個人資料更新成功",
        "data": {
            "id": str(row.id),
            "name": row.name,
            "email": row.email,
            "phone": row.phone,
            "bio": row.bio,
            "skills": parse_pg_array(row.skills),
            "avatar_url": row.avatar_url,
            "portfolio_links": parse_pg_array(row.portfolio_links),
            "roles": parse_pg_array(row.roles),
            "updated_at": row.updated_at
        }
    }


# ==================== 原: src/app/api/v1/users/me/password/route.ts ====================

@router.put("/me/password", response_model=SuccessResponse[dict])
async def update_password(
    data: UpdatePasswordRequest,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    更新密碼 - 使用 Raw SQL
    
    原始檔案: src/app/api/v1/users/me/password/route.ts
    對應 Service: UserService.updatePassword()
    
    RLS 邏輯: 只能更新自己的密碼
    """
    # 查詢取得 password_hash
    sql = "SELECT id, password_hash FROM users WHERE id = :user_id"
    result = await db.execute(text(sql), {'user_id': str(current_user.id)})
    row = result.fetchone()
    
    if not row or not row.password_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="此帳號使用社群登入，無法修改密碼"
        )
    
    # 驗證目前密碼
    if not verify_password(data.current_password, row.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="目前密碼錯誤"
        )
    
    # 雜湊新密碼
    new_password_hash = hash_password(data.new_password)
    
    # 更新密碼
    update_sql = """
        UPDATE users
        SET password_hash = :password_hash, updated_at = NOW()
        WHERE id = :user_id
    """
    await db.execute(text(update_sql), {
        'password_hash': new_password_hash,
        'user_id': str(current_user.id)
    })
    
    # 刪除所有 refresh tokens（強制重新登入）
    delete_tokens_sql = "DELETE FROM refresh_tokens WHERE user_id = :user_id"
    await db.execute(text(delete_tokens_sql), {'user_id': str(current_user.id)})
    
    return {
        "success": True,
        "message": "密碼更新成功，請重新登入",
        "data": {}
    }


# ==================== 原: src/app/api/v1/users/me/skills/route.ts ====================

@router.put("/me/skills", response_model=SuccessResponse[dict])
async def update_skills(
    skills: list[str],
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    更新技能標籤 - 使用 Raw SQL
    
    原始檔案: src/app/api/v1/users/me/skills/route.ts
    對應 Service: UserService.updateSkills()
    
    RLS 邏輯: 只能更新自己的技能
    """
    sql = """
        UPDATE users
        SET skills = :skills, updated_at = NOW()
        WHERE id = :user_id
        RETURNING id, skills
    """
    
    result = await db.execute(text(sql), {
        'skills': skills,
        'user_id': str(current_user.id)
    })
    row = result.fetchone()
    
    return {
        "success": True,
        "message": "技能已更新",
        "data": {
            "id": str(row.id),
            "skills": row.skills
        }
    }


# ==================== 原: src/app/api/v1/users/[id]/reviews/route.ts ====================

@router.get("/{user_id}/reviews", response_model=SuccessResponse[dict])
async def get_user_reviews(
    user_id: UUID,
    pagination: PaginationParams = Depends(),
    db = Depends(get_db)
):
    """
    取得使用者的評價 - 使用 Raw SQL
    
    原始檔案: src/app/api/v1/users/[id]/reviews/route.ts
    對應 Service: UserService.getUserReviews()
    
    RLS 邏輯: 任何人都可查看
    """
    params = {
        'user_id': str(user_id),
        'limit': pagination.limit,
        'offset': pagination.offset
    }
    
    # 計算總數
    count_sql = """
        SELECT COUNT(*)
        FROM reviews
        WHERE reviewee_id = :user_id
    """
    count_result = await db.execute(text(count_sql), params)
    total = count_result.scalar() or 0
    
    # 查詢評價（一次性取得所有資料）
    sql = """
        SELECT 
            r.id,
            r.rating,
            r.comment,
            r.tags,
            r.created_at,
            reviewer.id as reviewer_id,
            reviewer.name as reviewer_name,
            reviewer.avatar_url as reviewer_avatar_url,
            p.id as project_id,
            p.title as project_title
        FROM reviews r
        LEFT JOIN users reviewer ON reviewer.id = r.reviewer_id
        LEFT JOIN projects p ON p.id = r.project_id
        WHERE r.reviewee_id = :user_id
        ORDER BY r.created_at DESC
        LIMIT :limit OFFSET :offset
    """
    
    result = await db.execute(text(sql), params)
    rows = result.fetchall()
    
    reviews_data = []
    for row in rows:
        reviews_data.append({
            "id": str(row.id),
            "rating": row.rating,
            "comment": row.comment,
            "tags": parse_pg_array(row.tags),
            "created_at": row.created_at,
            "reviewer": {
                "id": str(row.reviewer_id),
                "name": row.reviewer_name,
                "avatar_url": row.reviewer_avatar_url
            } if row.reviewer_id else None,
            "project": {
                "id": str(row.project_id),
                "title": row.project_title
            } if row.project_id else None
        })
    
    return {
        "success": True,
        "data": {
            "reviews": reviews_data,
            "pagination": pagination.get_response_metadata(total)
        }
    }


# ==================== 原: src/app/api/v1/users/[id]/stats/route.ts ====================

@router.get("/{user_id}/stats", response_model=SuccessResponse[dict])
async def get_user_stats(
    user_id: UUID,
    db = Depends(get_db)
):
    """
    取得使用者統計資訊 - 使用 Raw SQL
    
    原始檔案: src/app/api/v1/users/[id]/stats/route.ts
    對應 Service: UserService.getUserStats()
    
    RLS 邏輯: 任何人都可查看
    """
    from ...models.user import UserRole
    
    # 一次性查詢所有統計（超高效）
    sql = """
        SELECT 
            u.rating,
            u.roles,
            (SELECT COUNT(*) FROM projects WHERE client_id = u.id) as projects_created,
            (SELECT COUNT(*) FROM bids WHERE freelancer_id = u.id) as bids_count,
            (
                SELECT COUNT(*)
                FROM projects p
                WHERE p.status = 'completed'
                  AND (
                    p.client_id = u.id
                    OR p.id IN (SELECT project_id FROM bids WHERE freelancer_id = u.id)
                  )
            ) as completed_projects
        FROM users u
        WHERE u.id = :user_id
    """
    
    result = await db.execute(text(sql), {'user_id': str(user_id)})
    row = result.fetchone()
    
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="使用者不存在"
        )
    
    return {
        "success": True,
        "data": {
            "rating": float(row.rating) if row.rating else 0.0,
            "projects_created": int(row.projects_created) or 0,
            "bids_count": int(row.bids_count) or 0,
            "completed_projects": int(row.completed_projects) or 0,
            "is_freelancer": UserRole.FREELANCER.value in parse_pg_array(row.roles),
            "is_client": UserRole.CLIENT.value in parse_pg_array(row.roles)
        }
    }


# ==================== 原: src/app/api/v1/users/[id]/route.ts ====================
# 注意：此路由必須定義在最後，因為它是最通用的路由

@router.get("/{user_id}", response_model=SuccessResponse[dict])
async def get_user_public_profile(
    user_id: UUID,
    db = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    取得使用者公開資料 - 使用 Raw SQL
    
    原始檔案: src/app/api/v1/users/[id]/route.ts
    對應 Service: UserService.getUserById()
    
    RLS 邏輯: 任何人可查看公開資料
    """
    # 一次性查詢所有資料（user + 統計）
    sql = """
        SELECT 
            u.id,
            u.name,
            u.roles,
            u.bio,
            u.skills,
            u.avatar_url,
            u.rating,
            u.portfolio_links,
            u.created_at,
            (SELECT COUNT(*) FROM projects WHERE client_id = u.id) as projects_count,
            (SELECT COUNT(*) FROM bids WHERE freelancer_id = u.id) as bids_count,
            (SELECT COUNT(*) FROM reviews WHERE reviewee_id = u.id) as reviews_count
        FROM users u
        WHERE u.id = :user_id
    """
    
    result = await db.execute(text(sql), {'user_id': str(user_id)})
    row = result.fetchone()
    
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="使用者不存在"
        )
    
    return {
        "success": True,
        "data": {
            "id": str(row.id),
            "name": row.name,
            "email": None,  # 公開資料不顯示 email
            "roles": parse_pg_array(row.roles),
            "bio": row.bio,
            "skills": parse_pg_array(row.skills),
            "avatar_url": row.avatar_url,
            "rating": float(row.rating) if row.rating else None,
            "portfolio_links": parse_pg_array(row.portfolio_links),
            "created_at": row.created_at,
            "projects_count": int(row.projects_count) or 0,
            "bids_count": int(row.bids_count) or 0,
            "reviews_count": int(row.reviews_count) or 0
        }
    }
