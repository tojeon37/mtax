from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base


class Supplier(Base):
    """공급자 모델"""
    __tablename__ = "suppliers"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    registration_number = Column(String(20), nullable=False)
    branch_number = Column(String(20))
    trade_name = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    business_place = Column(String(255), nullable=False)
    business_type = Column(String(100), nullable=False)
    business_item = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False)
    contact_person = Column(String(255))
    phone = Column(String(50))
    fax = Column(String(50))
    notes = Column(String(1000))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    user = relationship("User", backref="suppliers")

