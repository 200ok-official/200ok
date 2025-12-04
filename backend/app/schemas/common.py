"""
通用 Response Schemas
"""
from typing import Generic, TypeVar, Optional, Dict, Any
from pydantic import BaseModel


T = TypeVar('T')


class SuccessResponse(BaseModel, Generic[T]):
    """成功回應"""
    success: bool = True
    message: Optional[str] = None
    data: T
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "操作成功",
                "data": {}
            }
        }


class PaginationMeta(BaseModel):
    """分頁元資料"""
    page: int
    limit: int
    total: int
    total_pages: int


class PaginationResponse(BaseModel, Generic[T]):
    """分頁回應"""
    success: bool = True
    data: list[T]
    pagination: PaginationMeta
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "data": [],
                "pagination": {
                    "page": 1,
                    "limit": 10,
                    "total": 100,
                    "total_pages": 10
                }
            }
        }


class ErrorResponse(BaseModel):
    """錯誤回應"""
    success: bool = False
    message: str
    detail: Optional[Dict[str, Any]] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": False,
                "message": "發生錯誤",
                "detail": {}
            }
        }



# Generic success response wrapper
from typing import TypeVar, Generic

T = TypeVar('T')

class SuccessResponse(BaseModel, Generic[T]):
    success: bool = True
    data: T
    message: Optional[str] = None
