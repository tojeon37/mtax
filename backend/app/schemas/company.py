from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class CompanyBase(BaseModel):
    """회사 기본 스키마"""
    business_number: str  # 사업자등록번호
    name: str  # 회사명
    ceo_name: str  # 대표자명
    biz_type: str  # 업태
    biz_class: str  # 종목
    address: str  # 주소 (주소 + 상세주소 통합)
    email: str  # 이메일
    tel: Optional[str] = None  # 전화번호
    hp: Optional[str] = None  # 휴대폰번호
    memo: Optional[str] = None  # 비고


class CompanyCreate(CompanyBase):
    """회사 생성 스키마"""
    pass


class CompanyUpdate(BaseModel):
    """회사 업데이트 스키마"""
    business_number: Optional[str] = None
    name: Optional[str] = None
    ceo_name: Optional[str] = None
    biz_type: Optional[str] = None
    biz_class: Optional[str] = None
    address: Optional[str] = None
    email: Optional[str] = None
    tel: Optional[str] = None
    hp: Optional[str] = None
    memo: Optional[str] = None


class CompanyResponse(CompanyBase):
    """회사 응답 스키마"""
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

