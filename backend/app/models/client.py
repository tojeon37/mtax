from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base


class Client(Base):
    """거래처 모델"""
    __tablename__ = "clients"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    business_number = Column(String(20), nullable=False)  # 사업자등록번호
    company_name = Column(String(255), nullable=False)  # 회사명
    ceo_name = Column(String(100), nullable=False)  # 대표자명
    business_type = Column(String(100), nullable=False)  # 업태
    business_item = Column(String(100), nullable=False)  # 종목
    address = Column(String(500), nullable=False)  # 주소 (주소 + 상세주소 통합)
    email = Column(String(255), nullable=False)  # 이메일
    tel = Column(String(50))  # 전화번호
    hp = Column(String(50))  # 휴대폰번호
    memo = Column(String(1000))  # 비고
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    user = relationship("User", backref="clients")

