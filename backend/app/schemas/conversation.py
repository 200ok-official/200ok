"""
Conversation related schemas
"""
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel


class MessageResponse(BaseModel):
    """訊息回應"""
    id: UUID
    conversation_id: UUID
    sender_id: UUID
    content: str
    is_read: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    """對話回應"""
    id: UUID
    type: str
    project_id: Optional[UUID] = None
    is_unlocked: bool
    initiator_id: UUID
    recipient_id: UUID
    created_at: datetime
    updated_at: datetime
    
    # 最後一則訊息（可選）
    last_message: Optional[MessageResponse] = None
    unread_count: int = 0
    
    class Config:
        from_attributes = True

