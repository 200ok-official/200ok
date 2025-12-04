"""
User related models
"""
from sqlalchemy import Column, String, Boolean, ARRAY, Numeric, TIMESTAMP, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from ..db import Base, EnumTypeDecorator


class UserRole(str, enum.Enum):
    """使用者角色"""
    FREELANCER = "freelancer"
    CLIENT = "client"
    ADMIN = "admin"


class User(Base):
    """使用者表"""
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True)
    
    # 角色（PostgreSQL ARRAY）
    roles = Column(ARRAY(EnumTypeDecorator(UserRole, name="user_role", create_type=False)), nullable=False, default=["client"])
    
    # 個人資料
    bio = Column(Text, nullable=True)
    skills = Column(ARRAY(Text), nullable=True)
    avatar_url = Column(String(255), nullable=True)
    rating = Column(Numeric(3, 2), default=0.0)
    portfolio_links = Column(ARRAY(Text), nullable=True)
    
    # OAuth & 驗證
    google_id = Column(String(255), unique=True, nullable=True, index=True)
    phone = Column(String(20), nullable=True)
    phone_verified = Column(Boolean, default=False)
    email_verified = Column(Boolean, default=False)
    
    # 時間戳記
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    projects = relationship("Project", back_populates="client", foreign_keys="Project.client_id")
    bids = relationship("Bid", back_populates="freelancer")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    email_verification_tokens = relationship("EmailVerificationToken", back_populates="user", cascade="all, delete-orphan")
    user_tokens = relationship("UserToken", back_populates="user", uselist=False)
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, roles={self.roles})>"


class RefreshToken(Base):
    """Refresh Token 表"""
    __tablename__ = "refresh_tokens"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token = Column(String(500), unique=True, nullable=False, index=True)
    expires_at = Column(TIMESTAMP(timezone=True), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="refresh_tokens")
    
    def __repr__(self):
        return f"<RefreshToken(user_id={self.user_id}, expires_at={self.expires_at})>"


class EmailVerificationToken(Base):
    """Email 驗證 Token 表"""
    __tablename__ = "email_verification_tokens"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token = Column(String(500), unique=True, nullable=False)
    expires_at = Column(TIMESTAMP(timezone=True), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="email_verification_tokens")
    
    def __repr__(self):
        return f"<EmailVerificationToken(user_id={self.user_id}, expires_at={self.expires_at})>"

