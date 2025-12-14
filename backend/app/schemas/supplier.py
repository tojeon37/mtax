from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class SupplierBase(BaseModel):
    """공급자 기본 스키마"""
    registration_number: str
    branch_number: Optional[str] = None
    trade_name: str
    name: str
    business_place: str
    business_type: str
    business_item: str
    email: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    fax: Optional[str] = None
    notes: Optional[str] = None


class SupplierCreate(SupplierBase):
    """공급자 생성 스키마"""
    pass


class SupplierUpdate(BaseModel):
    """공급자 업데이트 스키마"""
    branch_number: Optional[str] = None
    trade_name: Optional[str] = None
    name: Optional[str] = None
    business_place: Optional[str] = None
    business_type: Optional[str] = None
    business_item: Optional[str] = None
    email: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    fax: Optional[str] = None
    notes: Optional[str] = None


class SupplierResponse(SupplierBase):
    """공급자 응답 스키마"""
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

