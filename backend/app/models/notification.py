"""
Notification model
"""
from sqlalchemy import Column, String, Boolean, TIMESTAMP, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from ..db import Base, EnumTypeDecorator


class NotificationType(str, enum.Enum):
    """通知類型"""
    BID_RECEIVED = "bid_received"
    BID_ACCEPTED = "bid_accepted"
    BID_REJECTED = "bid_rejected"
    MESSAGE = "message"
    PROJECT_STATUS_CHANGE = "project_status_change"
    REVIEW_REMINDER = "review_reminder"
    PAYMENT_RECEIVED = "payment_received"
    TAG_NOTIFICATION = "tag_notification"


class Notification(Base):
    """通知表"""
    __tablename__ = "notifications"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(EnumTypeDecorator(NotificationType, name="notification_type", create_type=False), nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    
    related_project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=True)
    related_bid_id = Column(UUID(as_uuid=True), ForeignKey("bids.id", ondelete="CASCADE"), nullable=True)
    
    is_read = Column(Boolean, default=False, index=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    user = relationship("User")
    related_project = relationship("Project")
    related_bid = relationship("Bid")
    
    def __repr__(self):
        return f"<Notification(id={self.id}, type={self.type}, is_read={self.is_read})>"

