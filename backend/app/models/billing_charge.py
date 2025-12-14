"""
과금 기록 모델
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base
import enum


class ChargeType(str, enum.Enum):
    """과금 유형"""
    INVOICE = "invoice"  # 계산서 발행
    STATUS_CHECK = "statuscheck"  # 상태조회


class BillingCharge(Base):
    """과금 기록 모델"""
    
    __tablename__ = "billing_charges"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    charge_type = Column(Enum(ChargeType), nullable=False)  # "invoice" or "statuscheck"
    amount = Column(Integer, nullable=False)  # 과금 금액 (원 단위)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # 관계
    user = relationship("User", backref="billing_charges")

