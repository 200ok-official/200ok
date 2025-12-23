"""
Reviews Endpoints
對應原本的 src/app/api/v1/projects/[id]/reviews/route.ts
使用 Raw SQL 優化
"""
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import text
import uuid

from ...db import get_db
from ...models.user import User
from ...models.project import ProjectStatus
from ...models.bid import BidStatus
from ...schemas.common import SuccessResponse
from ...dependencies import get_current_user


router = APIRouter(prefix="/projects", tags=["reviews"])


class CreateReviewRequest(BaseModel):
    rating: int  # 1-5
    comment: str
    tags: list[str] = []


# ==================== 原: src/app/api/v1/projects/[id]/reviews/route.ts ====================

@router.post("/{project_id}/reviews", response_model=SuccessResponse[dict], status_code=status.HTTP_201_CREATED)
async def create_review(
    project_id: UUID,
    data: CreateReviewRequest,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    建立評價 - 使用 Raw SQL
    
    原始檔案: src/app/api/v1/projects/[id]/reviews/route.ts
    
    RLS 邏輯: 必須是專案參與者（發案者或接案者）
    """
    # 驗證評分
    if data.rating < 1 or data.rating > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="評分必須在 1-5 之間"
        )
    
    # 查詢專案
    project_sql = "SELECT id, client_id, status FROM projects WHERE id = :project_id"
    project_result = await db.execute(text(project_sql), {'project_id': str(project_id)})
    project = project_result.fetchone()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="案件不存在"
        )
    
    # 專案必須是已完成狀態
    if project.status != ProjectStatus.COMPLETED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="只有已完成的案件可以評價"
        )
    
    # 確定 reviewee（被評價者）
    reviewee_id = None
    
    # 檢查參與者身份（支援 accepted bid 或透過已解鎖的對話關聯）
    if str(current_user.id) == str(project.client_id):
        # 發案者評價接案者
        # 優先檢查 accepted bid
        bid_sql = """
            SELECT freelancer_id
            FROM bids
            WHERE project_id = :project_id AND status = :status
            LIMIT 1
        """
        bid_result = await db.execute(text(bid_sql), {
            'project_id': str(project_id),
            'status': BidStatus.ACCEPTED.value
        })
        accepted_bid = bid_result.fetchone()
        if accepted_bid:
            reviewee_id = accepted_bid.freelancer_id
        else:
            # 如果沒有 accepted bid，檢查是否有已解鎖的對話（表示雙方已有合作意向）
            conv_sql = """
                SELECT b.freelancer_id
                FROM conversations c
                INNER JOIN bids b ON b.id = c.bid_id
                WHERE c.project_id = :project_id 
                  AND c.is_unlocked = TRUE
                  AND c.bid_id IS NOT NULL
                LIMIT 1
            """
            conv_result = await db.execute(text(conv_sql), {'project_id': str(project_id)})
            conv_bid = conv_result.fetchone()
            if conv_bid:
                reviewee_id = conv_bid.freelancer_id
    else:
        # 接案者評價發案者
        # 優先檢查 accepted bid
        bid_sql = """
            SELECT id
            FROM bids
            WHERE project_id = :project_id 
              AND freelancer_id = :freelancer_id
              AND status = :status
            LIMIT 1
        """
        bid_result = await db.execute(text(bid_sql), {
            'project_id': str(project_id),
            'freelancer_id': str(current_user.id),
            'status': BidStatus.ACCEPTED.value
        })
        if bid_result.fetchone():
            reviewee_id = project.client_id
        else:
            # 如果沒有 accepted bid，檢查是否有已解鎖的對話（表示雙方已有合作意向）
            conv_sql = """
                SELECT c.id
                FROM conversations c
                INNER JOIN bids b ON b.id = c.bid_id
                WHERE c.project_id = :project_id 
                  AND c.is_unlocked = TRUE
                  AND b.freelancer_id = :freelancer_id
                LIMIT 1
            """
            conv_result = await db.execute(text(conv_sql), {
                'project_id': str(project_id),
                'freelancer_id': str(current_user.id)
            })
            if conv_result.fetchone():
                reviewee_id = project.client_id
    
    if not reviewee_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您沒有權限評價此案件"
        )
    
    # 檢查是否已評價過
    check_sql = """
        SELECT id
        FROM reviews
        WHERE reviewer_id = :reviewer_id
          AND reviewee_id = :reviewee_id
          AND project_id = :project_id
    """
    existing_result = await db.execute(text(check_sql), {
        'reviewer_id': str(current_user.id),
        'reviewee_id': str(reviewee_id),
        'project_id': str(project_id)
    })
    if existing_result.fetchone():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="您已經評價過此案件"
        )
    
    # 建立評價
    review_id = uuid.uuid4()
    insert_sql = """
        INSERT INTO reviews (id, reviewer_id, reviewee_id, project_id, rating, comment, tags, created_at)
        VALUES (:id, :reviewer_id, :reviewee_id, :project_id, :rating, :comment, :tags, NOW())
        RETURNING id, rating, comment, created_at
    """
    
    result = await db.execute(text(insert_sql), {
        'id': str(review_id),
        'reviewer_id': str(current_user.id),
        'reviewee_id': str(reviewee_id),
        'project_id': str(project_id),
        'rating': data.rating,
        'comment': data.comment,
        'tags': data.tags
    })
    new_review = result.fetchone()
    
    # 更新使用者的平均評分
    update_rating_sql = """
        UPDATE users
        SET rating = (
            SELECT AVG(rating)::numeric(3,2)
            FROM reviews
            WHERE reviewee_id = :reviewee_id
        )
        WHERE id = :reviewee_id
    """
    await db.execute(text(update_rating_sql), {'reviewee_id': str(reviewee_id)})
    
    return {
        "success": True,
        "message": "評價已提交",
        "data": {
            "id": str(new_review.id),
            "rating": new_review.rating,
            "comment": new_review.comment,
            "created_at": new_review.created_at
        }
    }


# ==================== 原: src/app/api/v1/projects/[id]/can-review/route.ts ====================

@router.get("/{project_id}/can-review", response_model=SuccessResponse[dict])
async def can_review_project(
    project_id: UUID,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    檢查是否可以評價此案件 - 使用 Raw SQL
    
    原始檔案: src/app/api/v1/projects/[id]/can-review/route.ts
    
    RLS 邏輯: 必須登入
    """
    # 查詢專案
    project_sql = "SELECT id, client_id, status FROM projects WHERE id = :project_id"
    project_result = await db.execute(text(project_sql), {'project_id': str(project_id)})
    project = project_result.fetchone()
    
    if not project:
        return {
            "success": True,
            "data": {"can_review": False, "reason": "案件不存在"}
        }
    
    # 記錄項目狀態用於調試
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"Project {project_id} status: {project.status}, checking against: {ProjectStatus.COMPLETED.value}")
    logger.info(f"Status check: project.status={project.status}, COMPLETED.value={ProjectStatus.COMPLETED.value}")
    logger.info(f"Status matches: {project.status == ProjectStatus.COMPLETED.value}")
    
    # 專案必須是已完成狀態
    if project.status != ProjectStatus.COMPLETED.value:
        logger.info(f"Status check FAILED: returning reason with status_text")
        status_map = {
            ProjectStatus.DRAFT.value: "草稿",
            ProjectStatus.OPEN.value: "開放中",
            ProjectStatus.IN_PROGRESS.value: "進行中",
            ProjectStatus.CLOSED.value: "已關閉",
            ProjectStatus.CANCELLED.value: "已取消"
        }
        status_text = status_map.get(project.status, project.status)
        return {
            "success": True,
            "data": {"can_review": False, "reason": f"案件狀態為「{status_text}」，只有已完成的案件可以評價"}
        }
    
    # 確定是否為參與者（支援 accepted bid 或透過已解鎖的對話關聯）
    is_participant = False
    reviewee_id = None
    
    if str(current_user.id) == str(project.client_id):
        # 是發案者，評價接案者
        is_participant = True
        # 優先檢查 accepted bid
        bid_sql = """
            SELECT freelancer_id
            FROM bids
            WHERE project_id = :project_id AND status = :status
            LIMIT 1
        """
        bid_result = await db.execute(text(bid_sql), {
            'project_id': str(project_id),
            'status': BidStatus.ACCEPTED.value
        })
        accepted_bid = bid_result.fetchone()
        if accepted_bid:
            reviewee_id = accepted_bid.freelancer_id
        else:
            # 如果沒有 accepted bid，檢查是否有已解鎖的對話（表示雙方已有合作意向）
            conv_sql = """
                SELECT b.freelancer_id
                FROM conversations c
                INNER JOIN bids b ON b.id = c.bid_id
                WHERE c.project_id = :project_id 
                  AND c.is_unlocked = TRUE
                  AND c.bid_id IS NOT NULL
                LIMIT 1
            """
            conv_result = await db.execute(text(conv_sql), {'project_id': str(project_id)})
            conv_bid = conv_result.fetchone()
            if conv_bid:
                reviewee_id = conv_bid.freelancer_id
    else:
        # 檢查是否為接案者
        # 優先檢查 accepted bid
        bid_sql = """
            SELECT id
            FROM bids
            WHERE project_id = :project_id 
              AND freelancer_id = :freelancer_id
              AND status = :status
            LIMIT 1
        """
        bid_result = await db.execute(text(bid_sql), {
            'project_id': str(project_id),
            'freelancer_id': str(current_user.id),
            'status': BidStatus.ACCEPTED.value
        })
        if bid_result.fetchone():
            is_participant = True
            reviewee_id = project.client_id
        else:
            # 如果沒有 accepted bid，檢查是否有已解鎖的對話（表示雙方已有合作意向）
            conv_sql = """
                SELECT c.id
                FROM conversations c
                INNER JOIN bids b ON b.id = c.bid_id
                WHERE c.project_id = :project_id 
                  AND c.is_unlocked = TRUE
                  AND b.freelancer_id = :freelancer_id
                LIMIT 1
            """
            conv_result = await db.execute(text(conv_sql), {
                'project_id': str(project_id),
                'freelancer_id': str(current_user.id)
            })
            if conv_result.fetchone():
                is_participant = True
                reviewee_id = project.client_id
    
    if not is_participant or not reviewee_id:
        return {
            "success": True,
            "data": {"can_review": False, "reason": "您不是此案件的參與者"}
        }
    
    # 檢查是否已評價
    check_sql = """
        SELECT id
        FROM reviews
        WHERE reviewer_id = :reviewer_id
          AND reviewee_id = :reviewee_id
          AND project_id = :project_id
    """
    existing_result = await db.execute(text(check_sql), {
        'reviewer_id': str(current_user.id),
        'reviewee_id': str(reviewee_id),
        'project_id': str(project_id)
    })
    if existing_result.fetchone():
        return {
            "success": True,
            "data": {"can_review": False, "reason": "您已經評價過此案件"}
        }
    
    return {
        "success": True,
        "data": {"can_review": True, "reviewee_id": str(reviewee_id)}
    }
