"""
Tokens (代幣系統) Endpoints
對應原本的 src/app/api/v1/tokens/*/route.ts
使用 Raw SQL 優化
"""
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import text
import uuid

from ...db import get_db
from ...models.user import User
from ...models.token import TransactionType
from ...schemas.token import TokenBalanceResponse, TokenTransactionResponse, TokenPurchaseRequest, DiscountCodeValidationResponse
from ...schemas.common import SuccessResponse
from ...dependencies import get_current_user, PaginationParams
import os


router = APIRouter(prefix="/tokens", tags=["tokens"])


# 從環境變數讀取折扣碼設定
# 格式: DISCOUNT_CODES=CODE1:100,CODE2:500
def get_discount_codes():
    """從環境變數解析折扣碼"""
    codes_str = os.getenv("DISCOUNT_CODES", "")
    if not codes_str:
        return {}
    
    codes_dict = {}
    for code_pair in codes_str.split(","):
        if ":" in code_pair:
            code, amount = code_pair.strip().split(":")
            codes_dict[code.strip().upper()] = int(amount)
    return codes_dict


# ==================== 原: src/app/api/v1/tokens/balance/route.ts ====================

@router.get("/balance", response_model=SuccessResponse[dict])
async def get_token_balance(
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    取得使用者代幣餘額 - 使用 Raw SQL
    
    原始檔案: src/app/api/v1/tokens/balance/route.ts
    對應 Service: TokenService.getBalance()
    
    RLS 邏輯: 只能查看自己的餘額
    """
    # 查詢使用者代幣帳戶
    balance_sql = """
        SELECT id, balance, total_earned, total_spent
        FROM user_tokens
        WHERE user_id = :user_id
    """
    result = await db.execute(text(balance_sql), {'user_id': str(current_user.id)})
    user_token = result.fetchone()
    
    # 如果不存在，創建新帳戶
    if not user_token:
        token_id = uuid.uuid4()
        insert_token_sql = """
            INSERT INTO user_tokens (id, user_id, balance, total_earned, total_spent, created_at, updated_at)
            VALUES (:id, :user_id, 1000, 1000, 0, NOW(), NOW())
            RETURNING id, balance, total_earned, total_spent
        """
        result = await db.execute(text(insert_token_sql), {
            'id': str(token_id),
            'user_id': str(current_user.id)
        })
        user_token = result.fetchone()
        
        # 記錄初始贈送
        insert_transaction_sql = """
            INSERT INTO token_transactions (id, user_id, amount, balance_after, transaction_type, description, created_at)
            VALUES (:id, :user_id, 1000, 1000, :transaction_type, :description, NOW())
        """
        await db.execute(text(insert_transaction_sql), {
            'id': str(uuid.uuid4()),
            'user_id': str(current_user.id),
            'transaction_type': TransactionType.PLATFORM_FEE.value,
            'description': "新用戶註冊贈送"
        })
    
    return {
        "success": True,
        "data": {
            "balance": user_token.balance,
            "total_earned": user_token.total_earned,
            "total_spent": user_token.total_spent
        }
    }


# ==================== 原: src/app/api/v1/tokens/transactions/route.ts ====================

@router.get("/transactions", response_model=SuccessResponse[dict])
async def get_token_transactions(
    pagination: PaginationParams = Depends(),
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    取得代幣交易記錄 - 使用 Raw SQL
    
    原始檔案: src/app/api/v1/tokens/transactions/route.ts
    對應 Service: TokenService.getTransactions()
    
    RLS 邏輯: 只能查看自己的交易記錄
    """
    params = {
        'user_id': str(current_user.id),
        'limit': pagination.limit,
        'offset': pagination.offset
    }
    
    # 計算總數
    count_sql = """
        SELECT COUNT(*)
        FROM token_transactions
        WHERE user_id = :user_id
    """
    count_result = await db.execute(text(count_sql), params)
    total = count_result.scalar() or 0
    
    # 查詢交易記錄
    sql = """
        SELECT 
            id, user_id, amount, balance_after, transaction_type, 
            reference_id, description, created_at
        FROM token_transactions
        WHERE user_id = :user_id
        ORDER BY created_at DESC
        LIMIT :limit OFFSET :offset
    """
    
    result = await db.execute(text(sql), params)
    rows = result.fetchall()
    
    transactions_data = []
    for row in rows:
        transactions_data.append({
            "id": str(row.id),
            "user_id": str(row.user_id),
            "amount": row.amount,
            "balance_after": row.balance_after,
            "transaction_type": row.transaction_type,
            "reference_id": str(row.reference_id) if row.reference_id else None,
            "description": row.description,
            "created_at": row.created_at
        })
    
    return {
        "success": True,
        "data": {
            "transactions": transactions_data,
            "pagination": pagination.get_response_metadata(total)
        }
    }


# ==================== 新增: 驗證折扣碼 ====================

@router.post("/validate-discount", response_model=SuccessResponse[DiscountCodeValidationResponse])
async def validate_discount_code(
    discount_code: str,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    驗證折扣碼是否有效
    """
    if not discount_code or not discount_code.strip():
        return {
            "success": True,
            "data": {
                "valid": False,
                "discount_amount": 0,
                "message": "請輸入折扣碼"
            }
        }
    
    discount_code = discount_code.strip().upper()
    
    # 檢查折扣碼是否存在
    available_codes = get_discount_codes()
    if discount_code not in available_codes:
        return {
            "success": True,
            "data": {
                "valid": False,
                "discount_amount": 0,
                "message": "無效的折扣碼"
            }
        }
    
    # 檢查用戶是否已使用過該折扣碼
    check_usage_sql = """
        SELECT COUNT(*) as count
        FROM discount_code_usage
        WHERE user_id = :user_id AND discount_code = :discount_code
    """
    result = await db.execute(text(check_usage_sql), {
        'user_id': str(current_user.id),
        'discount_code': discount_code
    })
    usage_count = result.scalar() or 0
    
    if usage_count > 0:
        return {
            "success": True,
            "data": {
                "valid": False,
                "discount_amount": 0,
                "message": "此折扣碼已使用過"
            }
        }
    
    discount_amount = available_codes[discount_code]
    return {
        "success": True,
        "data": {
            "valid": True,
            "discount_amount": discount_amount,
            "message": f"可折抵 NT$ {discount_amount}"
        }
    }


# ==================== 原: src/app/api/v1/tokens/purchase/route.ts ====================

@router.post("/purchase", response_model=SuccessResponse[dict], status_code=status.HTTP_201_CREATED)
async def purchase_tokens(
    data: TokenPurchaseRequest,
    db = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    購買代幣 - 使用 Raw SQL
    
    原始檔案: src/app/api/v1/tokens/purchase/route.ts
    
    RLS 邏輯: 只能為自己購買代幣
    
    注意：目前不支援實際金流付款，僅支援折扣碼全額折抵
    如果折扣後金額不為 0，將提示暫未開通金流
    
    買多少送多少優惠：
    - 100: +0 (無贈送)
    - 500: +50
    - 1000: +150
    - 2000: +400
    - 自訂金額: 無贈送
    """
    if data.amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="購買數量必須大於 0"
        )
    
    # 處理折扣碼
    discount_amount = 0
    discount_code = None
    
    if data.discount_code:
        discount_code = data.discount_code.strip().upper()
        available_codes = get_discount_codes()
        
        # 檢查折扣碼是否有效
        if discount_code not in available_codes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="無效的折扣碼"
            )
        
        # 檢查是否已使用
        check_usage_sql = """
            SELECT COUNT(*) as count
            FROM discount_code_usage
            WHERE user_id = :user_id AND discount_code = :discount_code
        """
        result = await db.execute(text(check_usage_sql), {
            'user_id': str(current_user.id),
            'discount_code': discount_code
        })
        usage_count = result.scalar() or 0
        
        if usage_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="此折扣碼已使用過"
            )
        
        discount_amount = available_codes[discount_code]
    
    # 計算實際需支付金額
    final_price = max(0, data.amount - discount_amount)
    
    # 如果折扣後金額不為 0，不允許購買（因為暫未開通金流）
    if final_price > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="暫時未開通金流加值，如需更多代幣請聯絡開發者"
        )
    
    # 計算贈送代幣（買多少送多少優惠）
    bonus_mapping = {
        100: 0,
        500: 50,
        1000: 150,
        2000: 400
    }
    bonus_amount = bonus_mapping.get(data.amount, 0)  # 自訂金額無贈送
    total_tokens = data.amount + bonus_amount
    
    # 取得使用者代幣帳戶
    balance_sql = """
        SELECT id, balance, total_earned
        FROM user_tokens
        WHERE user_id = :user_id
    """
    result = await db.execute(text(balance_sql), {'user_id': str(current_user.id)})
    user_token = result.fetchone()
    
    if not user_token:
        # 創建新帳戶
        token_id = uuid.uuid4()
        insert_sql = """
            INSERT INTO user_tokens (id, user_id, balance, total_earned, total_spent, created_at, updated_at)
            VALUES (:id, :user_id, :balance, :total_earned, 0, NOW(), NOW())
            RETURNING id, balance
        """
        result = await db.execute(text(insert_sql), {
            'id': str(token_id),
            'user_id': str(current_user.id),
            'balance': total_tokens,
            'total_earned': total_tokens
        })
        user_token = result.fetchone()
        new_balance = total_tokens
    else:
        # 增加代幣（包含贈送）
        update_sql = """
            UPDATE user_tokens
            SET balance = balance + :amount,
                total_earned = total_earned + :amount,
                updated_at = NOW()
            WHERE user_id = :user_id
            RETURNING balance
        """
        result = await db.execute(text(update_sql), {
            'amount': total_tokens,
            'user_id': str(current_user.id)
        })
        updated = result.fetchone()
        new_balance = updated.balance
    
    # 記錄折扣碼使用
    if discount_code:
        insert_discount_usage_sql = """
            INSERT INTO discount_code_usage (id, user_id, discount_code, discount_amount, created_at)
            VALUES (:id, :user_id, :discount_code, :discount_amount, NOW())
        """
        await db.execute(text(insert_discount_usage_sql), {
            'id': str(uuid.uuid4()),
            'user_id': str(current_user.id),
            'discount_code': discount_code,
            'discount_amount': discount_amount
        })
    
    # 記錄購買交易（只記錄購買的部分）
    description = f"使用折扣碼 {discount_code} 兌換 {data.amount} 代幣" if discount_code else f"購買 {data.amount} 代幣（{data.payment_method}）"
    insert_transaction_sql = """
        INSERT INTO token_transactions (id, user_id, amount, balance_after, transaction_type, description, created_at)
        VALUES (:id, :user_id, :amount, :balance_after, :transaction_type, :description, NOW())
    """
    await db.execute(text(insert_transaction_sql), {
        'id': str(uuid.uuid4()),
        'user_id': str(current_user.id),
        'amount': data.amount,
        'balance_after': new_balance,
        'transaction_type': TransactionType.PLATFORM_FEE.value,
        'description': description
    })
    
    # 如果有贈送，記錄贈送交易
    if bonus_amount > 0:
        insert_bonus_transaction_sql = """
            INSERT INTO token_transactions (id, user_id, amount, balance_after, transaction_type, description, created_at)
            VALUES (:id, :user_id, :amount, :balance_after, :transaction_type, :description, NOW())
        """
        await db.execute(text(insert_bonus_transaction_sql), {
            'id': str(uuid.uuid4()),
            'user_id': str(current_user.id),
            'amount': bonus_amount,
            'balance_after': new_balance,
            'transaction_type': TransactionType.PLATFORM_FEE.value,
            'description': f"購買 {data.amount} 代幣贈送"
    })
    
    message = f"成功兌換 {data.amount} 代幣"
    if discount_amount > 0:
        message += f"（使用折扣碼折抵 NT$ {discount_amount}）"
    if bonus_amount > 0:
        message += f"，贈送 {bonus_amount} 代幣"
    
    return {
        "success": True,
        "message": message,
        "data": {
            "new_balance": new_balance,
            "purchased_amount": data.amount,
            "bonus_amount": bonus_amount,
            "total_received": total_tokens,
            "discount_amount": discount_amount,
            "final_price": final_price
        }
    }
