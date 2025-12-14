from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base


class Recipient(Base):
    """거래처 모델"""
    __tablename__ = "recipients"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    registration_number = Column(String(20), nullable=False)
    branch_number = Column(String(20))
    trade_name = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    business_place = Column(String(255))
    business_type = Column(String(100))
    business_item = Column(String(100))
    email1 = Column(String(255))
    email2 = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    user = relationship("User", backref="recipients")

