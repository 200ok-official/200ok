"""
Avatar Upload Endpoint
處理使用者頭像上傳（使用 Base64 編碼存儲在資料庫）
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from PIL import Image
import io
import base64

from ...db import get_db
from ...models.user import User
from ...schemas.avatar import AvatarUploadRequest, AvatarUploadResponse
from ...schemas.common import SuccessResponse
from ...dependencies import get_current_user


router = APIRouter(prefix="/avatar", tags=["avatar"])


def compress_and_resize_image(base64_data: str, max_size: tuple = (400, 400), quality: int = 85) -> str:
    """
    壓縮並調整圖片大小
    
    Args:
        base64_data: Base64 編碼的圖片數據（含 data:image/... 前綴）
        max_size: 最大尺寸 (寬, 高)
        quality: JPEG/WebP 品質 (1-100)
    
    Returns:
        壓縮後的 Base64 數據
    """
    try:
        # 解析 data URI
        header, encoded = base64_data.split(',', 1)
        image_data = base64.b64decode(encoded)
        
        # 取得原始格式
        mime_type = header.split(';')[0].split(':')[1]
        
        # 開啟圖片
        image = Image.open(io.BytesIO(image_data))
        
        # 如果有 EXIF 旋轉資訊，自動校正
        try:
            from PIL import ImageOps
            image = ImageOps.exif_transpose(image)
        except Exception:
            pass
        
        # 轉換 RGBA 到 RGB（如果需要）
        if image.mode in ('RGBA', 'LA', 'P'):
            # 創建白色背景
            background = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'P':
                image = image.convert('RGBA')
            background.paste(image, mask=image.split()[-1] if image.mode in ('RGBA', 'LA') else None)
            image = background
        elif image.mode != 'RGB':
            image = image.convert('RGB')
        
        # 調整大小（保持長寬比）
        image.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        # 壓縮並轉換為 Base64
        output = io.BytesIO()
        
        # 根據原始格式選擇輸出格式
        if 'png' in mime_type.lower():
            image.save(output, format='PNG', optimize=True)
            output_mime = 'image/png'
        elif 'webp' in mime_type.lower():
            image.save(output, format='WEBP', quality=quality)
            output_mime = 'image/webp'
        else:
            # 預設使用 JPEG
            image.save(output, format='JPEG', quality=quality, optimize=True)
            output_mime = 'image/jpeg'
        
        output.seek(0)
        compressed_data = base64.b64encode(output.read()).decode('utf-8')
        
        return f"data:{output_mime};base64,{compressed_data}"
        
    except Exception as e:
        raise ValueError(f"圖片處理失敗: {str(e)}")


@router.post("/upload", response_model=SuccessResponse[AvatarUploadResponse])
async def upload_avatar(
    data: AvatarUploadRequest,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    上傳使用者頭像
    
    - 支援的格式: JPEG, PNG, GIF, WebP
    - 最大大小: 5MB（上傳前）
    - 自動壓縮並調整為 400x400（保持長寬比）
    - 使用 Base64 編碼存儲在資料庫中
    """
    try:
        # 壓縮並調整圖片大小
        compressed_avatar = compress_and_resize_image(data.avatar_data, max_size=(400, 400), quality=85)
        
        # 更新資料庫
        sql = """
            UPDATE users
            SET avatar_url = :avatar_url, updated_at = NOW()
            WHERE id = :user_id
            RETURNING id, avatar_url
        """
        
        result = await db.execute(text(sql), {
            'avatar_url': compressed_avatar,
            'user_id': str(current_user.id)
        })
        row = result.fetchone()
        
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="使用者不存在"
            )
        
        return {
            "success": True,
            "message": "頭像上傳成功",
            "data": {
                "avatar_url": row.avatar_url,
                "message": "頭像上傳成功"
            }
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"頭像上傳失敗: {str(e)}"
        )


@router.delete("/delete", response_model=SuccessResponse[dict])
async def delete_avatar(
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    刪除使用者頭像（設為 NULL）
    """
    sql = """
        UPDATE users
        SET avatar_url = NULL, updated_at = NOW()
        WHERE id = :user_id
        RETURNING id
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
        "message": "頭像已刪除",
        "data": {}
    }

