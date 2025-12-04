"""
Review model
"""
from sqlalchemy import Column, SmallInteger, ARRAY, TIMESTAMP, ForeignKey, Text, CheckConstraint, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from ..db import Base


class Review(Base):
    """評價表"""
    __tablename__ = "reviews"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reviewer_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reviewee_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    
    rating = Column(SmallInteger, nullable=False)
    comment = Column(Text, nullable=True)
    tags = Column(ARRAY(Text), nullable=True)
    
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    
    # Relationships
    reviewer = relationship("User", foreign_keys=[reviewer_id])
    reviewee = relationship("User", foreign_keys=[reviewee_id])
    project = relationship("Project")
    
    # Constraints
    __table_args__ = (
        CheckConstraint('rating >= 1 AND rating <= 5', name='check_rating_range'),
        UniqueConstraint('reviewer_id', 'reviewee_id', 'project_id', name='uq_review'),
    )
    
    def __repr__(self):
        return f"<Review(id={self.id}, rating={self.rating}, project_id={self.project_id})>"

