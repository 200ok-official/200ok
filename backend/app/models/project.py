"""
Project related models
"""
from sqlalchemy import Column, String, Boolean, ARRAY, Numeric, TIMESTAMP, ForeignKey, Text, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from ..db import Base, EnumTypeDecorator


class ProjectStatus(str, enum.Enum):
    """專案狀態"""
    DRAFT = "draft"
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CLOSED = "closed"
    CANCELLED = "cancelled"


class ProjectMode(str, enum.Enum):
    """專案模式"""
    NEW_DEVELOPMENT = "new_development"
    MAINTENANCE_MODIFICATION = "maintenance_modification"


class Project(Base):
    """專案表"""
    __tablename__ = "projects"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # 基本資訊
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    project_mode = Column(EnumTypeDecorator(ProjectMode, name="project_mode", create_type=False), nullable=False, default=ProjectMode.NEW_DEVELOPMENT)
    project_type = Column(String(50), nullable=True)
    ai_summary = Column(Text, nullable=True)
    
    # 預算與時程
    budget_min = Column(Numeric(10, 2), nullable=False)
    budget_max = Column(Numeric(10, 2), nullable=False)
    budget_estimate_only = Column(Boolean, default=False)
    start_date = Column(TIMESTAMP(timezone=True), nullable=True)
    deadline = Column(TIMESTAMP(timezone=True), nullable=True)
    deadline_flexible = Column(Boolean, default=False)
    payment_method = Column(String(50), nullable=True)
    payment_schedule = Column(JSONB, nullable=True)
    
    # 技能需求
    required_skills = Column(ARRAY(Text), nullable=True)
    
    # 全新開發專案欄位
    new_usage_scenario = Column(Text, nullable=True)
    new_goals = Column(Text, nullable=True)
    new_features = Column(ARRAY(Text), nullable=True)
    new_outputs = Column(ARRAY(Text), nullable=True)
    new_outputs_other = Column(Text, nullable=True)
    new_design_style = Column(ARRAY(Text), nullable=True)
    new_integrations = Column(ARRAY(Text), nullable=True)
    new_integrations_other = Column(Text, nullable=True)
    new_deliverables = Column(ARRAY(Text), nullable=True)
    new_communication_preference = Column(ARRAY(Text), nullable=True)
    new_special_requirements = Column(Text, nullable=True)
    new_concerns = Column(ARRAY(Text), nullable=True)
    
    # 修改維護專案欄位
    maint_system_name = Column(Text, nullable=True)
    maint_system_purpose = Column(Text, nullable=True)
    maint_current_users_count = Column(String(50), nullable=True)
    maint_system_age = Column(String(50), nullable=True)
    maint_current_problems = Column(Text, nullable=True)
    maint_desired_improvements = Column(Text, nullable=True)
    maint_new_features = Column(Text, nullable=True)
    maint_known_tech_stack = Column(ARRAY(Text), nullable=True)
    maint_has_source_code = Column(Boolean, nullable=True)
    maint_has_documentation = Column(Boolean, nullable=True)
    maint_can_provide_access = Column(Boolean, nullable=True)
    maint_technical_contact = Column(Text, nullable=True)
    maint_expected_outcomes = Column(Text, nullable=True)
    maint_success_criteria = Column(Text, nullable=True)
    maint_additional_notes = Column(Text, nullable=True)
    
    # 共用欄位
    reference_links = Column(ARRAY(Text), nullable=True)
    special_requirements = Column(Text, nullable=True)
    
    # 狀態
    status = Column(EnumTypeDecorator(ProjectStatus, name="project_status", create_type=False), nullable=False, default=ProjectStatus.DRAFT, index=True)
    accepted_bid_id = Column(UUID(as_uuid=True), unique=True, nullable=True)
    
    # 時間戳記
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    client = relationship("User", back_populates="projects", foreign_keys=[client_id])
    bids = relationship("Bid", back_populates="project", cascade="all, delete-orphan")
    saved_by = relationship("SavedProject", back_populates="project", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Project(id={self.id}, title={self.title}, status={self.status})>"


class SavedProject(Base):
    """收藏的專案"""
    __tablename__ = "saved_projects"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User")
    project = relationship("Project", back_populates="saved_by")
    
    __table_args__ = (
        {'schema': None}  # 使用預設 schema
    )
    
    def __repr__(self):
        return f"<SavedProject(user_id={self.user_id}, project_id={self.project_id})>"

