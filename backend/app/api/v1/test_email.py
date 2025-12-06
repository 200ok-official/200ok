"""
Email Testing Endpoints
用於測試 Resend email 功能
"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr

from ...services.email_service import send_test_email
from ...schemas.common import SuccessResponse


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
async def send_test_email_endpoint(data: TestEmailRequest):
    """
    發送測試 email
    
    用於測試 Resend 設定是否正確
    不需要認證，任何人都可以測試
    """
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

