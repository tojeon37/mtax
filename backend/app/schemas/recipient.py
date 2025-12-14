from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class RecipientBase(BaseModel):
    """거래처 기본 스키마"""
    registration_number: str
    branch_number: Optional[str] = None
    trade_name: str
    name: str
    business_place: Optional[str] = None
    business_type: Optional[str] = None
    business_item: Optional[str] = None
    email1: Optional[str] = None
    email2: Optional[str] = None


class RecipientCreate(RecipientBase):
    """거래처 생성 스키마"""
    pass


class RecipientUpdate(BaseModel):
    """거래처 업데이트 스키마"""
    branch_number: Optional[str] = None
    trade_name: Optional[str] = None
    name: Optional[str] = None
    business_place: Optional[str] = None
    business_type: Optional[str] = None
    business_item: Optional[str] = None
    email1: Optional[str] = None
    email2: Optional[str] = None


class RecipientResponse(RecipientBase):
    """거래처 응답 스키마"""
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

