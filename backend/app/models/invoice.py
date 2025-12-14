from sqlalchemy import Column, Integer, String, DateTime, Numeric, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base


class Invoice(Base):
    """세금계산서 모델"""

    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    customer_name = Column(String(255), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    tax_type = Column(String(50), nullable=False)
    memo = Column(String(1000))
    status = Column(String(50), nullable=False, default="대기", index=True)
    mgt_key = Column(
        String(100), nullable=True, index=True
    )  # 바로빌 관리번호 (바로빌로 발행한 경우)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # 관계 설정
    user = relationship("User", backref="invoices")
