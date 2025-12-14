"""
사용자 프로필 모델 (Supabase Auth 연동)
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base


class UserProfile(Base):
    """사용자 프로필 모델 (Supabase Auth와 연동)"""

    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    supabase_user_id = Column(String(255), unique=True, index=True, nullable=False)  # Supabase User ID
    username = Column(String(50), unique=True, index=True, nullable=False)  # 바로빌용 아이디 (영문/숫자)
    email = Column(String(255), nullable=False, index=True)
    
    # 기존 User 모델과의 관계 (선택적)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    
    # 바로빌 연동 정보 (기존 User 모델과 유사)
    barobill_corp_num = Column(String(20), nullable=True, index=True)
    barobill_cert_key = Column(String(255), nullable=True)
    barobill_linked = Column(Boolean, default=False)
    barobill_linked_at = Column(DateTime(timezone=True), nullable=True)
    
    # 이메일 인증 상태
    email_confirmed = Column(Boolean, default=False)
    email_confirmed_at = Column(DateTime(timezone=True), nullable=True)
    
    # 활성화 상태
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 관계 설정 (선택적)
    user = relationship("User", foreign_keys=[user_id], backref="profile")





