"""
세션 스키마
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class UserSessionBase(BaseModel):
    """세션 기본 스키마"""
    device_name: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None


class UserSessionResponse(BaseModel):
    """세션 응답 스키마"""
    id: int
    user_id: int
    device_name: str
    ip_address: Optional[str]
    login_time: datetime
    last_seen: datetime
    user_agent: Optional[str]

    class Config:
        from_attributes = True

