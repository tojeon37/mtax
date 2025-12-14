from sqlalchemy import Column, Integer, String, DateTime, Numeric, ForeignKey, Enum as SQLEnum, Date
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base
import enum


class BillingCycleStatus(str, enum.Enum):
    """청구 주기 상태"""
    PENDING = "pending"   # 대기
    PAID = "paid"         # 결제 완료
    OVERDUE = "overdue"   # 연체


class BillingCycle(Base):
    """청구 주기 모델"""
    __tablename__ = "billing_cycles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    year_month = Column(String(6), nullable=False, index=True)  # YYYYMM 형식
    total_usage_amount = Column(Numeric(10, 0), nullable=False, default=0)  # 총 사용 금액
    monthly_fee = Column(Numeric(10, 0), nullable=False, default=0)  # 월 기본료 (현재는 0)
    total_bill_amount = Column(Numeric(10, 0), nullable=False)  # 총 청구 금액 (total_usage_amount + monthly_fee)
    status = Column(SQLEnum(BillingCycleStatus), nullable=False, default=BillingCycleStatus.PENDING, index=True)
    due_date = Column(Date, nullable=True)  # 납부 기한
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # 관계
    user = relationship("User", backref="billing_cycles")
    payments = relationship("Payment", backref="billing_cycle")

