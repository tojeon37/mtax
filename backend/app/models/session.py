"""
사용자 세션 모델
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from app.db.session import Base


class UserSession(Base):
    """사용자 세션 모델"""

    __tablename__ = "user_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    device_name = Column(String(255), nullable=False)
    ip_address = Column(String(100))
    login_time = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_seen = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, onupdate=func.now())
    user_agent = Column(Text)
    token = Column(String(500), nullable=False, index=True)

