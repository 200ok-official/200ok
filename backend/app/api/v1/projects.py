"""
Projects Endpoints
對應原本的 src/app/api/v1/projects/*/route.ts
使用 Raw SQL 來優化性能
"""
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from ...db import get_db, parse_pg_array
from ...models.user import User
from ...models.project import ProjectStatus
from ...schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse, ClientBasic
from ...schemas.common import SuccessResponse
from ...dependencies import get_current_user, get_current_user_optional, PaginationParams
from ...security import check_is_admin
from ...services.gemini_service import gemini_service


router = APIRouter(prefix="/projects", tags=["projects"])


# ==================== 原: src/app/api/v1/projects/route.ts GET ====================

@router.get("", response_model=SuccessResponse[dict])
async def list_projects(
    status_filter: Optional[str] = Query(None, alias="status"),
    project_mode: Optional[str] = Query(None),
    skills: Optional[str] = Query(None),
    budget_min: Optional[float] = Query(None),
    budget_max: Optional[float] = Query(None),
    project_type: Optional[str] = Query(None),
    keyword: Optional[str] = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    pagination: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    取得案件列表（支援搜尋與篩選）- 使用 Raw SQL 優化
    
    RLS 邏輯:
    - 任何人可以查看 open 和 in_progress 狀態的案件
    - 使用者可以查看自己的所有案件
    - 管理員可以查看所有案件
    """
    # 建立 WHERE 條件和參數
    where_conditions = []
    params = {
        'limit': pagination.limit,
        'offset': pagination.offset
    }
    
    # ========== RLS 邏輯實作 ==========
    if not current_user:
        # 未登入只能看 open 和 in_progress
        # 如果有狀態篩選，需要取交集
        if status_filter:
            statuses = [s.strip() for s in status_filter.split(',')]
            # 只保留在 RLS 允許範圍內的狀態
            allowed_statuses = ['open', 'in_progress']
            filtered_statuses = [s for s in statuses if s in allowed_statuses]
            if filtered_statuses:
                status_placeholders = ','.join([f"'{s}'" for s in filtered_statuses])
                where_conditions.append(f"p.status IN ({status_placeholders})")
            else:
                # 如果篩選的狀態都不在允許範圍內，返回空結果
                where_conditions.append("1=0")
        else:
            where_conditions.append("p.status IN ('open', 'in_progress')")
    else:
        # 已登入使用者
        params['user_id'] = str(current_user.id)
        if check_is_admin(current_user.roles):
            # 管理員：只應用狀態篩選（如果有的話）
            if status_filter:
                statuses = [s.strip() for s in status_filter.split(',')]
                status_placeholders = ','.join([f"'{s}'" for s in statuses])
                where_conditions.append(f"p.status IN ({status_placeholders})")
        else:
            # 一般使用者：可以看 open/in_progress 或自己的所有案件
            # 如果有狀態篩選，需要結合 RLS 條件
            if status_filter:
                statuses = [s.strip() for s in status_filter.split(',')]
                status_placeholders = ','.join([f"'{s}'" for s in statuses])
                # 狀態篩選 AND (RLS 條件)
                # 修改：即使是自己的案件，在探索頁面也只顯示 open/in_progress
                where_conditions.append(
                    f"(p.status IN ({status_placeholders}) AND p.status IN ('open', 'in_progress'))"
                )
            else:
                # 修改：即使是自己的案件，在探索頁面也只顯示 open/in_progress
                where_conditions.append("p.status IN ('open', 'in_progress')")
    
    # ========== 其他篩選條件 ==========
    
    # 專案模式
    if project_mode:
        where_conditions.append("p.project_mode = :project_mode")
        params['project_mode'] = project_mode
    
    # 技能篩選（PostgreSQL array overlap）
    if skills:
        skill_list = [s.strip() for s in skills.split(',')]
        where_conditions.append("p.required_skills && :skills")
        params['skills'] = skill_list
    
    # 預算篩選
    if budget_min is not None:
        where_conditions.append("p.budget_max >= :budget_min")
        params['budget_min'] = budget_min
    if budget_max is not None:
        where_conditions.append("p.budget_min <= :budget_max")
        params['budget_max'] = budget_max
    
    # 專案類型
    if project_type:
        where_conditions.append("p.project_type = :project_type")
        params['project_type'] = project_type
    
    # 關鍵字搜尋
    if keyword:
        where_conditions.append(
            "(p.title ILIKE :keyword OR p.description ILIKE :keyword OR p.ai_summary ILIKE :keyword)"
        )
        params['keyword'] = f"%{keyword}%"
    
    # 組合 WHERE 子句
    where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"
    
    # 排序
    order_column = {
        'budget': 'p.budget_max',
        'deadline': 'p.deadline',
        'created_at': 'p.created_at'
    }.get(sort_by, 'p.created_at')
    
    order_direction = 'ASC' if sort_order == 'asc' else 'DESC'
    
    # ========== 計算總數 ==========
    count_sql = f"""
        SELECT COUNT(*)
        FROM projects p
        WHERE {where_clause}
    """
    
    count_result = await db.execute(text(count_sql), params)
    total = count_result.scalar() or 0
    
    # ========== 主查詢 ==========
    # 一次性取得所有資料：projects + client + bids_count + is_saved
    saved_join = ""
    saved_select = "FALSE as is_saved"
    
    if current_user:
        saved_join = f"""
        LEFT JOIN saved_projects sp ON sp.project_id = p.id AND sp.user_id = :user_id
        """
        saved_select = "(sp.project_id IS NOT NULL) as is_saved"
    
    main_sql = f"""
        SELECT 
            p.id,
            p.client_id,
            p.title,
            p.description,
            p.ai_summary,
            p.project_mode,
            p.project_type,
            p.budget_min,
            p.budget_max,
            p.status,
            p.required_skills,
            p.created_at,
            p.updated_at,
            u.id as client_user_id,
            u.name as client_name,
            u.avatar_url as client_avatar_url,
            u.rating as client_rating,
            COALESCE(bc.bids_count, 0) as bids_count,
            {saved_select}
        FROM projects p
        LEFT JOIN users u ON u.id = p.client_id
        LEFT JOIN (
            SELECT project_id, COUNT(*) as bids_count
            FROM bids
            GROUP BY project_id
        ) bc ON bc.project_id = p.id
        {saved_join}
        WHERE {where_clause}
        ORDER BY {order_column} {order_direction}
        LIMIT :limit OFFSET :offset
    """
    
    result = await db.execute(text(main_sql), params)
    rows = result.fetchall()
    
    # 處理結果
    projects_data = []
    for row in rows:
        project_dict = {
            "id": str(row.id),
            "client_id": str(row.client_id),
            "title": row.title,
            "description": row.description,
            "ai_summary": row.ai_summary,
            "project_mode": row.project_mode,
            "project_type": row.project_type,
            "budget_min": float(row.budget_min) if row.budget_min else None,
            "budget_max": float(row.budget_max) if row.budget_max else None,
            "status": row.status,
            "required_skills": parse_pg_array(row.required_skills),
            "created_at": row.created_at,
            "updated_at": row.updated_at,
            "client": ClientBasic(
                id=str(row.client_user_id),
                name=row.client_name,
                avatar_url=row.client_avatar_url,
                rating=float(row.client_rating) if row.client_rating else None
            ) if row.client_user_id else None,
            "bids_count": int(row.bids_count),
            "is_saved": bool(row.is_saved)
        }
        projects_data.append(project_dict)
    
    return {
        "success": True,
        "data": {
            "projects": projects_data,
            "pagination": pagination.get_response_metadata(total)
        }
    }


# ==================== 原: src/app/api/v1/projects/route.ts POST ====================

@router.post("", response_model=SuccessResponse[ProjectResponse], status_code=status.HTTP_201_CREATED)
async def create_project(
    data: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    建立新案件 - 使用 Raw SQL
    
    RLS 邏輯:
    - client_id 必須是當前使用者
    """
    # 驗證預算範圍
    if data.budget_min > data.budget_max:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="最低預算不能大於最高預算"
        )
    
    # 建立專案資料
    project_data = data.model_dump()
    
    # ⚠️ 重要：在進入資料庫事務前，先完成所有外部 API 調用
    # 使用 AI 生成專案標題（如果有設定 Gemini API key）
    ai_generated_title = None
    ai_generated_summary = None
    
    try:
        ai_generated_title = await gemini_service.generate_project_title(project_data)
        if ai_generated_title:
            project_data['title'] = ai_generated_title
    except Exception as e:
        # AI 生成失敗不影響主流程，使用原本的標題
        print(f"AI 生成標題失敗: {str(e)}")
    
    # 生成專案摘要（如果有標題）
    if project_data.get('title'):
        try:
            ai_generated_summary = await gemini_service.generate_project_summary(project_data)
            if ai_generated_summary:
                project_data['ai_summary'] = ai_generated_summary
                # 如果有 ai_summary，就把它寫進 description，不要複製 scenario
                project_data['description'] = ai_generated_summary
        except Exception as e:
            print(f"AI 生成摘要失敗: {str(e)}")
    
    # 補全缺失的欄位為 None，避免 SQLAlchemy 報錯
    all_fields = [
        # 共用
        'client_id', 'title', 'description', 'project_mode', 'project_type',
        'budget_min', 'budget_max', 'budget_estimate_only',
        'start_date', 'deadline', 'deadline_flexible',
        'payment_method', 'payment_schedule', 'required_skills',
        'reference_links', 'special_requirements', 'status', 'ai_summary',
        # New Dev
        'new_usage_scenario', 'new_goals', 'new_features', 'new_outputs',
        'new_outputs_other', 'new_design_style', 'new_integrations',
        'new_integrations_other', 'new_deliverables',
        'new_communication_preference', 'new_special_requirements', 'new_concerns',
        # Maint
        'maint_system_name', 'maint_system_purpose', 'maint_current_users_count',
        'maint_system_age', 'maint_current_problems', 'maint_desired_improvements',
        'maint_new_features', 'maint_known_tech_stack', 'maint_has_source_code',
        'maint_has_documentation', 'maint_can_provide_access', 'maint_technical_contact',
        'maint_expected_outcomes', 'maint_success_criteria', 'maint_additional_notes'
    ]
    
    params = {field: None for field in all_fields}
    params.update(project_data)
    params['client_id'] = str(current_user.id)
    params['status'] = 'open'  # 直接發布
    
    # INSERT SQL
    insert_sql = """
        INSERT INTO projects (
            client_id, title, description, project_mode, project_type,
            budget_min, budget_max, budget_estimate_only,
            start_date, deadline, deadline_flexible,
            payment_method, payment_schedule, required_skills,
            new_usage_scenario, new_goals, new_features, new_outputs,
            new_outputs_other, new_design_style, new_integrations,
            new_integrations_other, new_deliverables,
            new_communication_preference, new_special_requirements, new_concerns,
            maint_system_name, maint_system_purpose, maint_current_users_count,
            maint_system_age, maint_current_problems, maint_desired_improvements,
            maint_new_features, maint_known_tech_stack, maint_has_source_code,
            maint_has_documentation, maint_can_provide_access, maint_technical_contact,
            maint_expected_outcomes, maint_success_criteria, maint_additional_notes,
            reference_links, special_requirements, status, ai_summary
        ) VALUES (
            :client_id, :title, :description, :project_mode, :project_type,
            :budget_min, :budget_max, :budget_estimate_only,
            :start_date, :deadline, :deadline_flexible,
            :payment_method, :payment_schedule, :required_skills,
            :new_usage_scenario, :new_goals, :new_features, :new_outputs,
            :new_outputs_other, :new_design_style, :new_integrations,
            :new_integrations_other, :new_deliverables,
            :new_communication_preference, :new_special_requirements, :new_concerns,
            :maint_system_name, :maint_system_purpose, :maint_current_users_count,
            :maint_system_age, :maint_current_problems, :maint_desired_improvements,
            :maint_new_features, :maint_known_tech_stack, :maint_has_source_code,
            :maint_has_documentation, :maint_can_provide_access, :maint_technical_contact,
            :maint_expected_outcomes, :maint_success_criteria, :maint_additional_notes,
            :reference_links, :special_requirements, :status, :ai_summary
        )
        RETURNING id, created_at, updated_at
    """
    
    result = await db.execute(text(insert_sql), params)
    row = result.fetchone()
    project_id = row.id
    
    # 在 commit 之前取得完整資料（包含 client）
    get_sql = """
        SELECT 
            p.*,
            u.id as client_user_id,
            u.name as client_name,
            u.avatar_url as client_avatar_url,
            u.rating as client_rating
        FROM projects p
        LEFT JOIN users u ON u.id = p.client_id
        WHERE p.id = :project_id
    """
    
    result = await db.execute(text(get_sql), {'project_id': str(project_id)})
    project = result.fetchone()
    
    # 最後再 commit
    await db.commit()
    
    return {
        "success": True,
        "message": "案件建立成功",
        "data": ProjectResponse(
            id=str(project.id),
            client_id=str(project.client_id),
            title=project.title,
            description=project.description,
            project_mode=project.project_mode,
            project_type=project.project_type,
            budget_min=float(project.budget_min) if project.budget_min else None,
            budget_max=float(project.budget_max) if project.budget_max else None,
            status=project.status,
            required_skills=project.required_skills,
            created_at=project.created_at,
            updated_at=project.updated_at,
            client=ClientBasic(
                id=str(project.client_user_id),
                name=project.client_name,
                avatar_url=project.client_avatar_url,
                rating=float(project.client_rating) if project.client_rating else None
            ) if project.client_user_id else None,
            bids_count=0,
            is_saved=False
        )
    }


# ==================== 原: src/app/api/v1/projects/[id]/route.ts GET ====================

@router.get("/{project_id}", response_model=SuccessResponse[dict])
async def get_project(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    取得案件詳情 - 使用 Raw SQL
    """
    # 建立查詢
    saved_join = ""
    saved_select = "FALSE as is_saved"
    params = {'project_id': str(project_id)}
    
    if current_user:
        saved_join = """
        LEFT JOIN saved_projects sp ON sp.project_id = p.id AND sp.user_id = :user_id
        """
        saved_select = "(sp.project_id IS NOT NULL) as is_saved"
        params['user_id'] = str(current_user.id)
    
    sql = f"""
        SELECT 
            p.*,
            u.id as client_user_id,
            u.name as client_name,
            u.avatar_url as client_avatar_url,
            u.rating as client_rating,
            COALESCE(bc.bids_count, 0) as bids_count,
            {saved_select}
        FROM projects p
        LEFT JOIN users u ON u.id = p.client_id
        LEFT JOIN (
            SELECT project_id, COUNT(*) as bids_count
            FROM bids
            WHERE project_id = :project_id
            GROUP BY project_id
        ) bc ON bc.project_id = p.id
        {saved_join}
        WHERE p.id = :project_id
    """
    
    result = await db.execute(text(sql), params)
    row = result.fetchone()
    
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="案件不存在"
        )
    
    # ========== RLS 邏輯實作 ==========
    can_view = False
    
    # 1. 案件是 open 或 in_progress
    if row.status in ['open', 'in_progress']:
        can_view = True
    
    # 2. 是案件擁有者
    if current_user and str(row.client_id) == str(current_user.id):
        can_view = True
    
    # 3. 是管理員
    if current_user and check_is_admin(current_user.roles):
        can_view = True
    
    if not can_view:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您沒有權限查看此案件"
        )
    
    # 建構完整的回傳資料（包含所有欄位）
    project_data = {
            "id": str(row.id),
            "client_id": str(row.client_id),
            "title": row.title,
            "description": row.description,
            "ai_summary": row.ai_summary,
            "project_mode": row.project_mode,
        "project_type": row.project_type,
            "budget_min": float(row.budget_min) if row.budget_min else None,
            "budget_max": float(row.budget_max) if row.budget_max else None,
        "budget_estimate_only": row.budget_estimate_only,
        "payment_method": row.payment_method,
        "start_date": row.start_date,
        "deadline": row.deadline,
            "status": row.status,
            "required_skills": parse_pg_array(row.required_skills),
        "reference_links": parse_pg_array(row.reference_links),
            "created_at": row.created_at,
            "updated_at": row.updated_at,
            "client": ClientBasic(
                id=str(row.client_user_id),
                name=row.client_name,
                avatar_url=row.client_avatar_url,
                rating=float(row.client_rating) if row.client_rating else None
            ) if row.client_user_id else None,
            "bids_count": int(row.bids_count),
        "is_saved": bool(row.is_saved),
        "_count": {
            "bids": int(row.bids_count)
        }
    }
    
    # 根據 project_mode 加入相應的欄位
    if row.project_mode == "new_development":
        project_data.update({
            "new_usage_scenario": row.new_usage_scenario,
            "new_goals": row.new_goals,
            "new_features": parse_pg_array(row.new_features),
            "new_outputs": parse_pg_array(row.new_outputs),
            "new_deliverables": parse_pg_array(row.new_deliverables),
            "new_design_style": parse_pg_array(row.new_design_style),
            "new_integrations": parse_pg_array(row.new_integrations),
            "new_special_requirements": row.new_special_requirements,
            "new_concerns": parse_pg_array(row.new_concerns),
        })
    elif row.project_mode == "maintenance":
        project_data.update({
            "maint_system_name": row.maint_system_name,
            "maint_system_purpose": row.maint_system_purpose,
            "maint_current_problems": row.maint_current_problems,
            "maint_desired_improvements": row.maint_desired_improvements,
            "maint_new_features": row.maint_new_features,
            "maint_current_users_count": row.maint_current_users_count,
            "maint_has_source_code": row.maint_has_source_code,
            "maint_has_documentation": row.maint_has_documentation,
            "maint_can_provide_access": row.maint_can_provide_access,
            "maint_known_tech_stack": parse_pg_array(row.maint_known_tech_stack),
            "maint_expected_outcomes": row.maint_expected_outcomes,
            "maint_success_criteria": row.maint_success_criteria,
        })
    
    return {
        "success": True,
        "data": project_data
    }


# ==================== 原: src/app/api/v1/projects/[id]/route.ts DELETE ====================

@router.delete("/{project_id}", response_model=SuccessResponse[dict])
async def delete_project(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    刪除案件 - 使用 Raw SQL
    擁有者可以刪除自己的任何案件
    """
    # 查詢專案
    sql = """
        SELECT id, client_id, status
        FROM projects
        WHERE id = :project_id
    """
    
    result = await db.execute(text(sql), {'project_id': str(project_id)})
    project = result.fetchone()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="案件不存在"
        )
    
    # ========== RLS 邏輯實作 ==========
    if str(project.client_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您沒有權限刪除此案件"
        )
    
    # 刪除專案（直接刪除，不限制狀態）
    delete_sql = """
        DELETE FROM projects
        WHERE id = :project_id
    """
    
    await db.execute(text(delete_sql), {'project_id': str(project_id)})
    await db.commit()
    
    return {
        "success": True,
        "message": "案件已刪除",
        "data": {}
    }


# ==================== 原: src/app/api/v1/projects/me/route.ts ====================

@router.get("/me/list", response_model=SuccessResponse[dict])
async def get_my_projects(
    pagination: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    取得我的案件 - 使用 Raw SQL
    """
    params = {
        'user_id': str(current_user.id),
        'limit': pagination.limit,
        'offset': pagination.offset
    }
    
    # 計算總數
    count_sql = """
        SELECT COUNT(*)
        FROM projects
        WHERE client_id = :user_id
    """
    
    count_result = await db.execute(text(count_sql), params)
    total = count_result.scalar() or 0
    
    # 主查詢
    sql = """
        SELECT 
            p.id,
            p.title,
            p.status,
            p.budget_min,
            p.budget_max,
            p.created_at,
            COALESCE(bc.bids_count, 0) as bids_count
        FROM projects p
        LEFT JOIN (
            SELECT project_id, COUNT(*) as bids_count
            FROM bids
            GROUP BY project_id
        ) bc ON bc.project_id = p.id
        WHERE p.client_id = :user_id
        ORDER BY p.created_at DESC
        LIMIT :limit OFFSET :offset
    """
    
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
            "bids_count": int(row.bids_count)
        })
    
    return {
        "success": True,
        "data": {
            "projects": projects_data,
            "pagination": pagination.get_response_metadata(total)
        }
    }


# ==================== 原: src/app/api/v1/projects/[id]/route.ts PUT ====================

@router.put("/{project_id}", response_model=SuccessResponse[dict])
async def update_project(
    project_id: UUID,
    data: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    更新專案 - 使用 Raw SQL
    擁有者可以更新自己的任何案件
    """
    # 查詢專案
    check_sql = """
        SELECT id, client_id, status
        FROM projects
        WHERE id = :project_id
    """
    
    result = await db.execute(text(check_sql), {'project_id': str(project_id)})
    project = result.fetchone()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="案件不存在"
        )
    
    # ========== RLS 邏輯 ==========
    if str(project.client_id) != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您沒有權限修改此案件"
        )
    
    # 更新資料（不限制狀態）
    update_dict = data.model_dump(exclude_unset=True)
    
    if not update_dict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="沒有要更新的欄位"
        )
    
    # 建立 UPDATE SQL
    set_clauses = []
    params = {'project_id': str(project_id)}
    
    for key, value in update_dict.items():
        set_clauses.append(f"{key} = :{key}")
        params[key] = value
    
    set_clauses.append("updated_at = NOW()")
    
    update_sql = f"""
        UPDATE projects
        SET {', '.join(set_clauses)}
        WHERE id = :project_id
        RETURNING id, title, status, updated_at
    """
    
    result = await db.execute(text(update_sql), params)
    updated_project = result.fetchone()
    
    # 如果狀態改為 completed，自動將對話關聯的 bid 設為 accepted
    # 這樣雙方都可以給評價
    if update_dict.get('status') == 'completed':
        # 找到該專案的所有對話關聯的 bid，將狀態改為 accepted（如果還是 pending）
        accept_bids_sql = """
            UPDATE bids
            SET status = 'accepted'
            WHERE project_id = :project_id
              AND status = 'pending'
              AND id IN (
                  SELECT bid_id FROM conversations 
                  WHERE project_id = :project_id 
                    AND bid_id IS NOT NULL
                    AND is_unlocked = TRUE
              )
        """
        await db.execute(text(accept_bids_sql), {'project_id': str(project_id)})
    
    await db.commit()
    
    return {
        "success": True,
        "message": "案件已更新",
        "data": {
            "id": str(updated_project.id),
            "title": updated_project.title,
            "status": updated_project.status,
            "updated_at": updated_project.updated_at
        }
    }


# ==================== 原: src/app/api/v1/projects/[id]/publish/route.ts ====================

@router.post("/{project_id}/publish", response_model=SuccessResponse[dict])
async def publish_project(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    發布案件（draft → open） - 使用 Raw SQL
    """
    # 查詢專案
    check_sql = """
        SELECT id, client_id, status
        FROM projects
        WHERE id = :project_id
    """
    
    result = await db.execute(text(check_sql), {'project_id': str(project_id)})
    project = result.fetchone()
    
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="案件不存在")
    
    if str(project.client_id) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="您沒有權限發布此案件")
    
    if project.status != 'draft':
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="只有草稿狀態的案件可以發布")
    
    # 更新狀態
    update_sql = """
        UPDATE projects
        SET status = 'open', updated_at = NOW()
        WHERE id = :project_id
        RETURNING id, status
    """
    
    result = await db.execute(text(update_sql), {'project_id': str(project_id)})
    updated = result.fetchone()
    await db.commit()
    
    return {
        "success": True,
        "message": "案件已發布",
        "data": {
            "id": str(updated.id),
            "status": updated.status
        }
    }


# ==================== 原: src/app/api/v1/projects/[id]/cancel/route.ts ====================

@router.post("/{project_id}/cancel", response_model=SuccessResponse[dict])
async def cancel_project(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """取消案件 - 使用 Raw SQL"""
    # 查詢專案
    check_sql = """
        SELECT id, client_id, status
        FROM projects
        WHERE id = :project_id
    """
    
    result = await db.execute(text(check_sql), {'project_id': str(project_id)})
    project = result.fetchone()
    
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="案件不存在")
    
    if str(project.client_id) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="您沒有權限取消此案件")
    
    if project.status in ['completed', 'closed']:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="無法取消已完成或已關閉的案件")
    
    # 更新狀態
    update_sql = """
        UPDATE projects
        SET status = 'cancelled', updated_at = NOW()
        WHERE id = :project_id
        RETURNING id, status
    """
    
    result = await db.execute(text(update_sql), {'project_id': str(project_id)})
    updated = result.fetchone()
    await db.commit()
    
    return {
        "success": True,
        "message": "案件已取消",
        "data": {
            "id": str(updated.id),
            "status": updated.status
        }
    }
