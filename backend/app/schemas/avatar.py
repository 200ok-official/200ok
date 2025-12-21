"""
Avatar upload schemas
"""
from pydantic import BaseModel, Field, validator
import base64
import re


class AvatarUploadRequest(BaseModel):
    """頭像上傳請求"""
    avatar_data: str = Field(..., description="Base64 編碼的圖片數據 (包含 data:image/... 前綴)")
    
    @validator('avatar_data')
    def validate_avatar_data(cls, v):
        """驗證 Base64 圖片數據"""
        # 檢查是否為有效的 data URI
        if not v.startswith('data:image/'):
            raise ValueError('頭像數據必須以 data:image/ 開頭')
        
        # 檢查支援的圖片格式
        supported_formats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        if not any(v.startswith(f'data:{fmt};base64,') for fmt in supported_formats):
            raise ValueError(f'不支援的圖片格式，僅支援: {", ".join(supported_formats)}')
        
        # 提取 Base64 部分
        try:
            base64_data = v.split(',', 1)[1]
            # 嘗試解碼以驗證格式
            decoded = base64.b64decode(base64_data)
            
            # 檢查圖片大小（限制為 5MB）
            max_size = 5 * 1024 * 1024  # 5MB
            if len(decoded) > max_size:
                raise ValueError(f'圖片大小不能超過 5MB，目前大小: {len(decoded) / 1024 / 1024:.2f}MB')
            
        except Exception as e:
            raise ValueError(f'無效的 Base64 編碼: {str(e)}')
        
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "avatar_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
            }
        }


class AvatarUploadResponse(BaseModel):
    """頭像上傳回應"""
    avatar_url: str
    message: str = "頭像上傳成功"

