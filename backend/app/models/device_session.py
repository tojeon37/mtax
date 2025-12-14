from sqlalchemy import Column, BigInteger, String, Text, DateTime, UniqueConstraint
from datetime import datetime
from app.db.session import Base


class UserDeviceSession(Base):
    __tablename__ = "user_device_sessions"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(String(255), nullable=False)
    device_hash = Column(String(255), nullable=False)
    user_agent = Column(Text, nullable=False)
    ip = Column(String(255))
    last_login = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('user_id', 'device_hash', name='unique_user_device'),
    )

