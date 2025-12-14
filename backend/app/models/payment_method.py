from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base
import enum


class PaymentMethodType(str, enum.Enum):
    """결제수단 유형"""
    CARD = "card"  # 카드
    BANK = "bank"  # 계좌


class PaymentMethod(Base):
    """결제수단 모델"""
    __tablename__ = "payment_methods"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    method_type = Column(SQLEnum(PaymentMethodType), nullable=False)  # 결제수단 유형
    masked_number = Column(String(50), nullable=False)  # 마스킹된 번호 (예: ****1234)
    provider = Column(String(50), nullable=False, default="toss")  # 제공자 (toss 등)
    toss_billing_key = Column(String(255), nullable=True)  # 토스 billing_key (향후 연동용)
    is_default = Column(Boolean, nullable=False, default=False)  # 기본결제수단 여부
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # 관계
    user = relationship("User", backref="payment_methods")

