from sqlalchemy import Column, Integer, String, DateTime, Boolean, Numeric
from sqlalchemy.sql import func
from app.db.session import Base


class User(Base):
    """사용자 모델"""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    barobill_id = Column(
        String(50), unique=True, index=True, nullable=False
    )  # 바로빌 아이디 (로그인 식별자)
    password_hash = Column(String(255), nullable=False)  # 바로빌 비밀번호 해시
    email = Column(String(255), nullable=True)  # 이메일 (선택)
    biz_name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)

    # 바로빌 연동 정보
    barobill_corp_num = Column(String(20), nullable=True, index=True)  # 사업자번호
    barobill_cert_key = Column(String(255), nullable=True)  # 인증키 (암호화 저장 권장)
    barobill_linked = Column(Boolean, default=False)  # 바로빌 연동 여부
    barobill_linked_at = Column(DateTime(timezone=True), nullable=True)  # 연동 일시

    # 비밀번호 재설정 토큰
    reset_token = Column(String(255), nullable=True, index=True)  # 재설정 토큰
    reset_token_expires = Column(
        DateTime(timezone=True), nullable=True
    )  # 토큰 만료 시간

    # Refresh token (해시된 값 저장)
    refresh_token_hash = Column(String(255), nullable=True, index=True)  # Refresh token 해시
    refresh_token_expires = Column(
        DateTime(timezone=True), nullable=True
    )  # Refresh token 만료 시간

    # 참고: 무료 제공 건수는 free_quota 테이블에서 관리됨
    # 참고: 결제수단 정보는 payment_methods 테이블에서 관리됨

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
