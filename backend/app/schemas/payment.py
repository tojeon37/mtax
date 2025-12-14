"""
결제 스키마
"""
from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal
from app.models.payment import PaymentMethod, PaymentStatus


class PaymentResponse(BaseModel):
    """결제 응답"""
    id: int
    billing_cycle_id: int
    user_id: int
    amount: Decimal
    payment_method: str
    transaction_id: str | None
    paid_at: datetime | None
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class PaymentCreate(BaseModel):
    """결제 생성"""
    billing_cycle_id: int
    amount: Decimal
    payment_method: PaymentMethod
    transaction_id: str | None = None

