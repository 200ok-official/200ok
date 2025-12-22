"""
Project related schemas
"""
from typing import List, Optional, Any
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field, field_validator
from ..models.project import ProjectStatus, ProjectMode


class ProjectBase(BaseModel):
    """專案基礎欄位"""
    title: str = Field(..., min_length=3, max_length=150)
    description: str = Field(..., min_length=10)
    project_mode: ProjectMode = ProjectMode.NEW_DEVELOPMENT
    project_type: Optional[str] = None
    budget_min: Decimal = Field(..., ge=0)
    budget_max: Decimal = Field(..., ge=0)
    budget_estimate_only: Optional[bool] = False
    start_date: Optional[datetime] = None
    deadline: Optional[datetime] = None
    deadline_flexible: Optional[bool] = False
    payment_method: Optional[str] = None
    payment_schedule: Optional[Any] = None
    required_skills: Optional[List[str]] = None
    reference_links: Optional[List[str]] = None
    special_requirements: Optional[str] = None


class ProjectCreateNewDev(ProjectBase):
    """建立全新開發專案"""
    project_mode: ProjectMode = Field(ProjectMode.NEW_DEVELOPMENT, frozen=True)
    
    # 全新開發專案特有欄位
    new_usage_scenario: Optional[str] = None
    new_goals: Optional[str] = None
    new_features: Optional[List[str]] = None
    new_outputs: Optional[List[str]] = None
    new_outputs_other: Optional[str] = None
    new_design_style: Optional[List[str]] = None
    new_integrations: Optional[List[str]] = None
    new_integrations_other: Optional[str] = None
    new_deliverables: Optional[List[str]] = None
    new_communication_preference: Optional[List[str]] = None
    new_special_requirements: Optional[str] = None
    new_concerns: Optional[List[str]] = None


class ProjectCreateMaintenance(ProjectBase):
    """建立修改維護專案"""
    project_mode: ProjectMode = Field(ProjectMode.MAINTENANCE_MODIFICATION, frozen=True)
    
    # 修改維護專案特有欄位
    maint_system_name: str
    maint_system_purpose: str
    maint_current_users_count: Optional[str] = None
    maint_system_age: Optional[str] = None
    maint_current_problems: str
    maint_desired_improvements: str
    maint_new_features: Optional[str] = None
    maint_known_tech_stack: Optional[List[str]] = None
    maint_has_source_code: Optional[bool] = None
    maint_has_documentation: Optional[bool] = None
    maint_can_provide_access: Optional[bool] = None
    maint_technical_contact: Optional[str] = None
    maint_expected_outcomes: str
    maint_success_criteria: Optional[str] = None
    maint_additional_notes: Optional[str] = None


# Union type for create
ProjectCreate = ProjectCreateNewDev | ProjectCreateMaintenance


class ProjectUpdate(BaseModel):
    """更新專案"""
    title: Optional[str] = Field(None, min_length=3, max_length=150)
    description: Optional[str] = Field(None, min_length=10)
    project_type: Optional[str] = None
    budget_min: Optional[Decimal] = Field(None, ge=0)
    budget_max: Optional[Decimal] = Field(None, ge=0)
    budget_estimate_only: Optional[bool] = None
    start_date: Optional[datetime] = None
    deadline: Optional[datetime] = None
    deadline_flexible: Optional[bool] = None
    required_skills: Optional[List[str]] = None
    status: Optional[ProjectStatus] = None
    # ... 其他可更新欄位


class ClientBasic(BaseModel):
    """發案者基本資訊"""
    id: UUID
    name: str
    avatar_url: Optional[str] = None
    rating: Optional[float] = None
    
    class Config:
        from_attributes = True


class ProjectResponse(BaseModel):
    """專案回應"""
    id: UUID
    client_id: UUID
    title: str
    description: str
    ai_summary: Optional[str] = None
    project_mode: str
    project_type: Optional[str] = None
    budget_min: Decimal
    budget_max: Decimal
    status: str
    required_skills: Optional[List[str]] = None
    created_at: datetime
    updated_at: datetime
    
    # 關聯資料
    client: Optional[ClientBasic] = None
    bids_count: int = 0
    is_saved: bool = False
    
    class Config:
        from_attributes = True


class ProjectList(BaseModel):
    """專案列表（含分頁）"""
    projects: List[ProjectResponse]
    page: int
    limit: int
    total: int
    total_pages: int

