"""
무료 제공 쿼터 이력 모델
이메일 또는 사업자등록번호로 무료 제공 이력을 추적하여 재지급 방지
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.db.session import Base


class FreeQuotaHistory(Base):
    __tablename__ = "free_quota_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_identifier = Column(String(255), nullable=False, index=True)  # 이메일 또는 사업자등록번호
    free_invoice_total = Column(Integer, nullable=False, default=5)  # 지급된 총 무료 세금계산서 건수
    free_status_total = Column(Integer, nullable=False, default=5)  # 지급된 총 무료 상태조회 건수
    free_invoice_used = Column(Integer, nullable=False, default=0)  # 사용한 무료 세금계산서 건수
    free_status_used = Column(Integer, nullable=False, default=0)  # 사용한 무료 상태조회 건수
    is_consumed = Column(Boolean, nullable=False, default=False)  # 무료 제공분 모두 소진 여부
    consumed_at = Column(DateTime(timezone=True), nullable=True)  # 무료 제공분 소진 시점
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

