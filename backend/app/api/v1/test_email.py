"""
Email Testing Endpoints
用於測試 Resend email 功能
"""
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr

from ...services.email_service import send_test_email
from ...schemas.common import SuccessResponse
from ...config import settings
from ...dependencies import require_admin
from ...models.user import User


router = APIRouter(prefix="/test-email", tags=["test-email"])


class TestEmailRequest(BaseModel):
    """測試 email 請求"""
    email: EmailStr
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "test@example.com"
            }
        }


@router.post("", response_model=SuccessResponse[dict])
async def send_test_email_endpoint(
    data: TestEmailRequest,
    current_user: User = Depends(require_admin)
):
    """
    發送測試 email（管理員專用）
    
    用於測試 Resend 設定是否正確
    僅限管理員使用，防止郵件濫用
    """
    # 額外檢查：僅在開發環境或管理員可用
    if not settings.DEBUG:
        # 生產環境必須是管理員
        pass  # require_admin 已處理
    
    try:
        result = await send_test_email(data.email)
        
        return {
            "success": True,
            "message": f"測試郵件已發送到 {data.email}",
            "data": {
                "email": data.email,
                "resend_response": result
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"發送測試郵件失敗: {str(e)}"
        )

