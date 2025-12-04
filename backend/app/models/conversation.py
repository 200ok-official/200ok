"""
Conversation and Message models
"""
from sqlalchemy import Column, String, Boolean, ARRAY, TIMESTAMP, ForeignKey, Text, CheckConstraint, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from ..db import Base, EnumTypeDecorator


class ConversationType(str, enum.Enum):
    """對話類型"""
    DIRECT = "direct"
    PROJECT_PROPOSAL = "project_proposal"


class ConnectionStatus(str, enum.Enum):
    """連接狀態"""
    PENDING = "pending"
    CONNECTED = "connected"
    EXPIRED = "expired"


class Conversation(Base):
    """對話表"""
    __tablename__ = "conversations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type = Column(EnumTypeDecorator(ConversationType, name="conversation_type", create_type=False), nullable=False, index=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=True, index=True)
    bid_id = Column(UUID(as_uuid=True), ForeignKey("bids.id", ondelete="CASCADE"), nullable=True, index=True)
    
    is_unlocked = Column(Boolean, default=False)
    
    initiator_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    recipient_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    initiator_paid = Column(Boolean, default=False)
    recipient_paid = Column(Boolean, default=False)
    initiator_unlocked_at = Column(TIMESTAMP(timezone=True), nullable=True)
    recipient_unlocked_at = Column(TIMESTAMP(timezone=True), nullable=True)
    
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    initiator = relationship("User", foreign_keys=[initiator_id])
    recipient = relationship("User", foreign_keys=[recipient_id])
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")
    project = relationship("Project")
    bid = relationship("Bid")
    
    # Constraints
    __table_args__ = (
        CheckConstraint('initiator_id != recipient_id', name='check_participants'),
    )
    
    def __repr__(self):
        return f"<Conversation(id={self.id}, type={self.type}, is_unlocked={self.is_unlocked})>"


class Message(Base):
    """訊息表"""
    __tablename__ = "messages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    content = Column(Text, nullable=False)
    attachment_urls = Column(ARRAY(Text), nullable=True)
    is_read = Column(Boolean, default=False)
    
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User", foreign_keys=[sender_id])
    
    def __repr__(self):
        return f"<Message(id={self.id}, conversation_id={self.conversation_id}, is_read={self.is_read})>"


class UserConnection(Base):
    """使用者連接關係表"""
    __tablename__ = "user_connections"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    initiator_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    recipient_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    connection_type = Column(EnumTypeDecorator(ConversationType, name="conversation_type", create_type=False), nullable=False)
    status = Column(EnumTypeDecorator(ConnectionStatus, name="connection_status", create_type=False), nullable=False, default=ConnectionStatus.PENDING, index=True)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="SET NULL"), nullable=True, index=True)
    
    initiator_unlocked_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    recipient_unlocked_at = Column(TIMESTAMP(timezone=True), nullable=True)
    expires_at = Column(TIMESTAMP(timezone=True), nullable=True, index=True)
    
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    initiator = relationship("User", foreign_keys=[initiator_id])
    recipient = relationship("User", foreign_keys=[recipient_id])
    conversation = relationship("Conversation")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('initiator_id', 'recipient_id', 'connection_type', name='unique_connection'),
        CheckConstraint('initiator_id != recipient_id', name='no_self_connection'),
    )
    
    def __repr__(self):
        return f"<UserConnection(id={self.id}, status={self.status})>"

