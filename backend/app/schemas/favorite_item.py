from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal


class FavoriteItemBase(BaseModel):
    """품목 기본 스키마"""
    name: str
    specification: Optional[str] = None
    unit_price: Decimal = Decimal("0")


class FavoriteItemCreate(FavoriteItemBase):
    """품목 생성 스키마"""
    pass


class FavoriteItemUpdate(BaseModel):
    """품목 수정 스키마"""
    name: Optional[str] = None
    specification: Optional[str] = None
    unit_price: Optional[Decimal] = None


class FavoriteItemResponse(FavoriteItemBase):
    """품목 응답 스키마"""
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

