"""
SQLAlchemy Models
對應 Supabase 資料庫 schema
"""
from .user import User, UserRole, RefreshToken, EmailVerificationToken
from .project import Project, ProjectStatus, ProjectMode, SavedProject
from .bid import Bid, BidStatus
from .conversation import Conversation, ConversationType, Message, UserConnection, ConnectionStatus
from .token import UserToken, TokenTransaction, TransactionType
from .tag import Tag, TagCategory, ProjectTag, UserTag
from .review import Review
from .payment import Payment, PaymentStatus
from .notification import Notification, NotificationType

__all__ = [
    # User models
    "User",
    "UserRole",
    "RefreshToken",
    "EmailVerificationToken",
    
    # Project models
    "Project",
    "ProjectStatus",
    "ProjectMode",
    "SavedProject",
    
    # Bid models
    "Bid",
    "BidStatus",
    
    # Conversation models
    "Conversation",
    "ConversationType",
    "Message",
    "UserConnection",
    "ConnectionStatus",
    
    # Token models
    "UserToken",
    "TokenTransaction",
    "TransactionType",
    
    # Tag models
    "Tag",
    "TagCategory",
    "ProjectTag",
    "UserTag",
    
    # Review & Payment
    "Review",
    "Payment",
    "PaymentStatus",
    
    # Notification
    "Notification",
    "NotificationType",
]

