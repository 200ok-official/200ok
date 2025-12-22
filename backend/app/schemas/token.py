"""
Token (代幣) system schemas
"""
from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field


class TokenBalanceResponse(BaseModel):
    """代幣餘額回應"""
    balance: int
    total_earned: int
    total_spent: int
    
    class Config:
        from_attributes = True


class TokenTransactionResponse(BaseModel):
    """代幣交易記錄回應"""
    id: UUID
    user_id: UUID
    amount: int
    balance_after: int
    transaction_type: str
    description: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class TokenPurchaseRequest(BaseModel):
    """購買代幣請求"""
    amount: int = Field(..., gt=0, description="購買的代幣數量，必須大於 0")
    payment_method: str = Field(default="credit_card", description="付款方式")
    discount_code: Optional[str] = Field(None, description="折扣碼")
    
    class Config:
        json_schema_extra = {
            "example": {
                "amount": 1000,
                "payment_method": "credit_card",
                "discount_code": "WELCOME100"
            }
        }


class DiscountCodeValidationResponse(BaseModel):
    """折扣碼驗證回應"""
    valid: bool
    discount_amount: int = 0
    message: str
    
    class Config:
        from_attributes = True
