from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base


class Company(Base):
    """회사 모델"""
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    business_number = Column(String(20), nullable=False)  # 사업자등록번호
    name = Column(String(255), nullable=False)  # 회사명
    ceo_name = Column(String(100), nullable=False)  # 대표자명
    biz_type = Column(String(100), nullable=False)  # 업태
    biz_class = Column(String(100), nullable=False)  # 종목
    address = Column(String(500), nullable=False)  # 주소 (주소 + 상세주소 통합)
    email = Column(String(255), nullable=False)  # 이메일
    tel = Column(String(50))  # 전화번호
    hp = Column(String(50))  # 휴대폰번호
    memo = Column(String(1000))  # 비고
    
    # 바로빌 연동 정보
    barobill_linked = Column(Boolean, default=False)  # 바로빌 연동 여부
    barobill_linked_at = Column(DateTime(timezone=True), nullable=True)  # 연동 일시
    barobill_linked_reason = Column(String(500), nullable=True)  # 연동 성공/실패 사유
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    user = relationship("User", backref="companies")

