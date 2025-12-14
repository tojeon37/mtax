"""
사용 내역 스키마
"""
from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal
from app.models.usage_log import UsageType


class UsageLogResponse(BaseModel):
    """사용 내역 응답"""
    id: int
    user_id: int
    usage_type: str
    unit_price: Decimal
    quantity: int
    total_price: Decimal
    billing_cycle_id: int | None
    created_at: datetime
    
    class Config:
        from_attributes = True


class UsageLogCreate(BaseModel):
    """사용 내역 생성"""
    usage_type: UsageType
    quantity: int = 1

