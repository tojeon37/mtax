from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base


class CorpStateHistory(Base):
    """사업자 상태 조회 이력 모델"""
    __tablename__ = "corp_state_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    corp_num = Column(String(20), nullable=False, index=True)  # 사업자번호 (하이픈 제거)
    state = Column(Integer, nullable=False)  # 상태 코드 (0=미등록, 1=정상, 2=휴업, 3=폐업 등)
    state_name = Column(String(50), nullable=False)  # 상태명 (정상, 휴업, 폐업 등)
    corp_name = Column(String(255))  # 회사명
    ceo_name = Column(String(100))  # 대표자명
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # 관계 설정
    user = relationship("User", backref="corp_state_history")

