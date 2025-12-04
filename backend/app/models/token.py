"""
Token (代幣) system models
"""
from sqlalchemy import Column, Integer, TIMESTAMP, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from ..db import Base, EnumTypeDecorator


class TransactionType(str, enum.Enum):
    """交易類型"""
    UNLOCK_DIRECT_CONTACT = "unlock_direct_contact"
    SUBMIT_PROPOSAL = "submit_proposal"
    VIEW_PROPOSAL = "view_proposal"
    REFUND = "refund"
    PLATFORM_FEE = "platform_fee"


class UserToken(Base):
    """使用者代幣帳戶"""
    __tablename__ = "user_tokens"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    balance = Column(Integer, nullable=False, default=0)
    total_earned = Column(Integer, default=0)
    total_spent = Column(Integer, default=0)
    
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="user_tokens")
    transactions = relationship(
        "TokenTransaction",
        back_populates="user_token",
        cascade="all, delete-orphan",
        primaryjoin="UserToken.user_id == TokenTransaction.user_id",
        foreign_keys="[TokenTransaction.user_id]"
    )
    
    def __repr__(self):
        return f"<UserToken(user_id={self.user_id}, balance={self.balance})>"


class TokenTransaction(Base):
    """代幣交易記錄"""
    __tablename__ = "token_transactions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    amount = Column(Integer, nullable=False)  # 正數為增加，負數為減少
    balance_after = Column(Integer, nullable=False)
    transaction_type = Column(EnumTypeDecorator(TransactionType, name="transaction_type", create_type=False), nullable=False, index=True)
    reference_id = Column(UUID(as_uuid=True), nullable=True)  # 關聯 ID（對話、提案等）
    description = Column(Text, nullable=True)
    
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    user = relationship("User")
    user_token = relationship(
        "UserToken",
        back_populates="transactions",
        primaryjoin="TokenTransaction.user_id == UserToken.user_id",
        foreign_keys="[TokenTransaction.user_id]"
    )
    
    def __repr__(self):
        return f"<TokenTransaction(id={self.id}, user_id={self.user_id}, amount={self.amount}, type={self.transaction_type})>"

