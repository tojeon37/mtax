"""
결제수단 스키마
"""
from pydantic import BaseModel
from datetime import datetime
from app.models.payment_method import PaymentMethodType


class PaymentMethodResponse(BaseModel):
    """결제수단 응답"""
    id: int
    user_id: int
    method_type: str
    masked_number: str
    provider: str
    toss_billing_key: str | None
    is_default: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class PaymentMethodCreate(BaseModel):
    """결제수단 생성"""
    method_type: PaymentMethodType
    number: str  # 카드번호 또는 계좌번호 (마스킹 전)


class PaymentMethodUpdate(BaseModel):
    """결제수단 업데이트"""
    is_default: bool | None = None

