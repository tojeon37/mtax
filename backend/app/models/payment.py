from sqlalchemy import Column, Integer, String, DateTime, Numeric, ForeignKey, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base
import enum


class PaymentMethod(str, enum.Enum):
    """결제 수단"""
    CARD = "card"  # 카드
    BANK = "bank"  # 계좌이체


class PaymentStatus(str, enum.Enum):
    """결제 상태"""
    SUCCESS = "success"  # 성공
    FAILED = "failed"    # 실패


class Payment(Base):
    """결제 기록 모델"""
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    billing_cycle_id = Column(Integer, ForeignKey("billing_cycles.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    amount = Column(Numeric(10, 0), nullable=False)  # 결제 금액
    payment_method = Column(SQLEnum(PaymentMethod), nullable=False)  # 결제 수단
    transaction_id = Column(String(255), nullable=True, index=True)  # 거래 ID
    paid_at = Column(DateTime(timezone=True), nullable=True)  # 결제 일시
    status = Column(SQLEnum(PaymentStatus), nullable=False, default=PaymentStatus.SUCCESS, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # 관계
    user = relationship("User", backref="payments")

