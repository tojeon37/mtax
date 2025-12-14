"""
사용자 프로필 스키마
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class UserProfileCreate(BaseModel):
    """사용자 프로필 생성 스키마"""
    username: str  # 바로빌용 아이디
    email: str  # 이메일 (Supabase에서 검증됨)
    supabase_user_id: str


class UserProfileUpdate(BaseModel):
    """사용자 프로필 업데이트 스키마"""
    username: Optional[str] = None
    email: Optional[str] = None  # 이메일 (Supabase에서 검증됨)
    barobill_corp_num: Optional[str] = None
    barobill_cert_key: Optional[str] = None
    barobill_linked: Optional[bool] = None
    email_confirmed: Optional[bool] = None
    is_active: Optional[bool] = None


class UserProfileResponse(BaseModel):
    """사용자 프로필 응답 스키마"""
    id: int
    supabase_user_id: str
    username: str
    email: str
    barobill_corp_num: Optional[str] = None
    barobill_cert_key: Optional[str] = None
    barobill_linked: Optional[bool] = False
    barobill_linked_at: Optional[datetime] = None
    email_confirmed: bool
    email_confirmed_at: Optional[datetime] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True



