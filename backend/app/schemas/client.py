from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ClientBase(BaseModel):
    """거래처 기본 스키마"""
    business_number: str  # 사업자등록번호
    company_name: str  # 회사명
    ceo_name: str  # 대표자명
    business_type: str  # 업태
    business_item: str  # 종목
    address: str  # 주소 (주소 + 상세주소 통합)
    email: str  # 이메일
    tel: Optional[str] = None  # 전화번호
    hp: Optional[str] = None  # 휴대폰번호
    memo: Optional[str] = None  # 비고


class ClientCreate(ClientBase):
    """거래처 생성 스키마"""
    pass


class ClientUpdate(BaseModel):
    """거래처 업데이트 스키마"""
    business_number: Optional[str] = None
    company_name: Optional[str] = None
    ceo_name: Optional[str] = None
    business_type: Optional[str] = None
    business_item: Optional[str] = None
    address: Optional[str] = None
    email: Optional[str] = None
    tel: Optional[str] = None
    hp: Optional[str] = None
    memo: Optional[str] = None


class ClientResponse(ClientBase):
    """거래처 응답 스키마"""
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

