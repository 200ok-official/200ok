"""
Bid related schemas
"""
from typing import Optional
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field


class BidCreate(BaseModel):
    """建立投標請求"""
    project_id: UUID
    proposal: str = Field(..., min_length=20)
    bid_amount: Decimal = Field(..., gt=0)
    estimated_days: Optional[int] = Field(None, gt=0)
    
    class Config:
        json_schema_extra = {
            "example": {
                "project_id": "123e4567-e89b-12d3-a456-426614174000",
                "proposal": "我有 5 年的相關經驗...",
                "bid_amount": 50000,
                "estimated_days": 30
            }
        }


class BidResponse(BaseModel):
    """投標回應"""
    id: UUID
    project_id: UUID
    freelancer_id: UUID
    proposal: str
    bid_amount: Decimal
    estimated_days: Optional[int] = None
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True



# Additional bid schemas

class BidCreate(BaseModel):
    proposal: str = Field(..., min_length=50)
    bid_amount: float = Field(..., gt=0)
    estimated_days: Optional[int] = Field(None, gt=0)
