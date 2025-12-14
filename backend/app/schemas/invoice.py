from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from decimal import Decimal


class InvoiceBase(BaseModel):
    """세금계산서 기본 스키마"""
    customer_name: str
    amount: Decimal
    tax_type: str
    memo: Optional[str] = None


class InvoiceCreate(InvoiceBase):
    """세금계산서 생성 스키마"""
    pass  # user_id는 JWT에서 자동으로 가져옴


class InvoiceUpdate(BaseModel):
    """세금계산서 업데이트 스키마"""
    customer_name: Optional[str] = None
    amount: Optional[Decimal] = None
    tax_type: Optional[str] = None
    memo: Optional[str] = None
    status: Optional[str] = None


class InvoiceResponse(InvoiceBase):
    """세금계산서 응답 스키마"""
    id: int
    user_id: int
    status: str
    mgt_key: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

