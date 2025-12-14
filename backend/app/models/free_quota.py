from sqlalchemy import Column, Integer, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base


class FreeQuota(Base):
    """무료 제공 쿼터 모델"""
    __tablename__ = "free_quota"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True, index=True)
    free_invoice_left = Column(Integer, nullable=False, default=5)  # 남은 무료 세금계산서 발행 횟수
    free_status_left = Column(Integer, nullable=False, default=5)  # 남은 무료 상태조회 횟수
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # 관계
    user = relationship("User", backref="free_quota")

