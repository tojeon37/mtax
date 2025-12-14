"""
청구 주기 스키마
"""
from pydantic import BaseModel
from datetime import datetime, date
from decimal import Decimal
from app.models.billing_cycle import BillingCycleStatus


class BillingCycleResponse(BaseModel):
    """청구 주기 응답"""
    id: int
    user_id: int
    year_month: str
    total_usage_amount: Decimal
    monthly_fee: Decimal
    total_bill_amount: Decimal
    status: str
    due_date: date | None
    created_at: datetime
    
    class Config:
        from_attributes = True


class BillingCycleDetailResponse(BillingCycleResponse):
    """청구 주기 상세 응답 (사용 내역 포함)"""
    usage_count: int = 0
    usage_logs: list = []

