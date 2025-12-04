"""
Payment model
"""
from sqlalchemy import Column, String, Numeric, TIMESTAMP, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from ..db import Base, EnumTypeDecorator


class PaymentStatus(str, enum.Enum):
    """付款狀態"""
    PENDING = "pending"
    COMPLETED = "completed"
    REFUNDED = "refunded"
    DISPUTED = "disputed"


class Payment(Base):
    """付款表"""
    __tablename__ = "payments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    payer_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    payee_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    amount = Column(Numeric(10, 2), nullable=False)
    payment_method = Column(String(50), nullable=False)
    payment_stage = Column(String(50), nullable=False)
    status = Column(EnumTypeDecorator(PaymentStatus, name="payment_status", create_type=False), nullable=False, default=PaymentStatus.PENDING, index=True)
    transaction_id = Column(String(255), nullable=True)
    
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    completed_at = Column(TIMESTAMP(timezone=True), nullable=True)
    
    # Relationships
    project = relationship("Project")
    payer = relationship("User", foreign_keys=[payer_id])
    payee = relationship("User", foreign_keys=[payee_id])
    
    def __repr__(self):
        return f"<Payment(id={self.id}, amount={self.amount}, status={self.status})>"

