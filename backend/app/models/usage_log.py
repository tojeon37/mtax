from sqlalchemy import Column, Integer, String, DateTime, Numeric, ForeignKey, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base
import enum


class UsageType(str, enum.Enum):
    """사용 유형"""
    INVOICE_ISSUE = "invoice_issue"  # 세금계산서 발행
    STATUS_CHECK = "status_check"     # 사업자 상태조회


class UsageLog(Base):
    """사용 내역 로그 모델"""
    __tablename__ = "usage_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    usage_type = Column(SQLEnum(UsageType), nullable=False, index=True)  # 사용 유형
    unit_price = Column(Numeric(10, 0), nullable=False)  # 당시 단가 (snapshot)
    quantity = Column(Integer, nullable=False, default=1)  # 수량
    total_price = Column(Numeric(10, 0), nullable=False)  # 총 금액 (unit_price * quantity)
    billing_cycle_id = Column(Integer, ForeignKey("billing_cycles.id"), nullable=True, index=True)  # 청구 주기 ID
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    # 관계
    user = relationship("User", backref="usage_logs")
    billing_cycle = relationship("BillingCycle", backref="usage_logs")

