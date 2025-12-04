"""
Tags Endpoints
對應原本的 src/app/api/v1/tags/route.ts
使用 Raw SQL 優化
"""
from fastapi import APIRouter, Depends
from sqlalchemy import text

from ...db import get_db
from ...schemas.common import SuccessResponse


router = APIRouter(prefix="/tags", tags=["tags"])


# ==================== 原: src/app/api/v1/tags/route.ts ====================

@router.get("", response_model=SuccessResponse[list])
async def get_tags(
    db = Depends(get_db)
):
    """
    取得所有標籤 - 使用 Raw SQL
    
    原始檔案: src/app/api/v1/tags/route.ts
    
    RLS 邏輯: 任何人都可查看
    """
    # 查詢所有啟用的標籤
    sql = """
        SELECT id, name, slug, category, description, icon, color, usage_count, is_system
        FROM tags
        WHERE is_active = TRUE
        ORDER BY usage_count DESC
    """
    
    result = await db.execute(text(sql))
    rows = result.fetchall()
    
    tags_data = []
    for row in rows:
        tags_data.append({
            "id": str(row.id),
            "name": row.name,
            "slug": row.slug,
            "category": row.category,
            "description": row.description,
            "icon": row.icon,
            "color": row.color,
            "usage_count": row.usage_count,
            "is_system": row.is_system
        })
    
    return {
        "success": True,
        "data": tags_data
    }
