"""
Tag system models
"""
from sqlalchemy import Column, String, Boolean, Integer, TIMESTAMP, ForeignKey, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from ..db import Base, EnumTypeDecorator


class TagCategory(str, enum.Enum):
    """標籤分類"""
    TECH = "tech"
    PROJECT_TYPE = "project_type"
    DOMAIN = "domain"
    TOOL = "tool"


class Tag(Base):
    """標籤表"""
    __tablename__ = "tags"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    category = Column(EnumTypeDecorator(TagCategory, name="tag_category", create_type=False), nullable=False, index=True)
    description = Column(Text, nullable=True)
    icon = Column(String(255), nullable=True)
    color = Column(String(20), nullable=True)
    usage_count = Column(Integer, default=0, index=True)
    is_system = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    project_tags = relationship("ProjectTag", back_populates="tag", cascade="all, delete-orphan")
    user_tags = relationship("UserTag", back_populates="tag", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Tag(id={self.id}, name={self.name}, category={self.category})>"


class ProjectTag(Base):
    """專案標籤關聯表"""
    __tablename__ = "project_tags"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    tag_id = Column(UUID(as_uuid=True), ForeignKey("tags.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="project_tags")
    tag = relationship("Tag", back_populates="project_tags")
    
    # 唯一約束
    __table_args__ = (
        UniqueConstraint('project_id', 'tag_id', name='uq_project_tag'),
    )
    
    def __repr__(self):
        return f"<ProjectTag(project_id={self.project_id}, tag_id={self.tag_id})>"


class UserTag(Base):
    """使用者追蹤的標籤"""
    __tablename__ = "user_tags"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    tag_id = Column(UUID(as_uuid=True), ForeignKey("tags.id", ondelete="CASCADE"), nullable=False, index=True)
    notification_enabled = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User")
    tag = relationship("Tag", back_populates="user_tags")
    
    # 唯一約束
    __table_args__ = (
        UniqueConstraint('user_id', 'tag_id', name='uq_user_tag'),
    )
    
    def __repr__(self):
        return f"<UserTag(user_id={self.user_id}, tag_id={self.tag_id})>"

