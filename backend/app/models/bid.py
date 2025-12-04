"""
Bid related models
"""
from sqlalchemy import Column, String, Numeric, TIMESTAMP, ForeignKey, Text, Integer, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from ..db import Base, EnumTypeDecorator


class BidStatus(str, enum.Enum):
    """投標狀態"""
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


class Bid(Base):
    """投標表"""
    __tablename__ = "bids"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    freelancer_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    proposal = Column(Text, nullable=False)
    bid_amount = Column(Numeric(10, 2), nullable=False)
    estimated_days = Column(Integer, nullable=True)
    status = Column(EnumTypeDecorator(BidStatus, name="bid_status", create_type=False), nullable=False, default=BidStatus.PENDING, index=True)
    
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="bids")
    freelancer = relationship("User", back_populates="bids")
    
    # 唯一約束：一個接案者對同一個專案只能投標一次
    __table_args__ = (
        UniqueConstraint('project_id', 'freelancer_id', name='uq_project_freelancer'),
    )
    
    def __repr__(self):
        return f"<Bid(id={self.id}, project_id={self.project_id}, status={self.status})>"

