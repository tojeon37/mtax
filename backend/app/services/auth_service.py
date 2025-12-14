"""
인증 관련 비즈니스 로직 서비스
"""
from datetime import timedelta, datetime
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from app.models.user import User
from app.models.session import UserSession
from app.models.device_session import UserDeviceSession
from app.utils.device import generate_device_hash
from app.core.security import (
    get_password_hash,
    create_access_token,
    create_refresh_token,
)
from app.core.config import settings
from app.crud.free_quota import create_free_quota
from app.crud.free_quota_history import get_history_by_identifier, create_history


class AuthService:
    """인증 관련 비즈니스 로직"""

    @staticmethod
    def create_user_with_quota(
        db: Session,
        user_data: dict,
        barobill_registered: bool = False
    ) -> User:
        """
        사용자 생성 및 무료 쿼터 지급
        
        Args:
            db: 데이터베이스 세션
            user_data: 사용자 생성 데이터
            barobill_registered: 바로빌 연동 여부
            
        Returns:
            생성된 User 객체
        """
        password_hash = get_password_hash(user_data["password"])
        
        # 회사명 설정
        biz_name = (
            user_data.get("company_name") or 
            user_data.get("biz_name") or 
            (f"회사_{user_data.get('email', '').split('@')[0]}" if user_data.get("email") else f"회사_{user_data.get('barobill_id')}")
        )

        db_user = User(
            barobill_id=user_data["barobill_id"],
            password_hash=password_hash,
            email=user_data.get("email"),
            biz_name=biz_name,
            barobill_corp_num=user_data.get("business_no", "").replace("-", "") if user_data.get("business_no") else None,
            barobill_linked=barobill_registered,
        )
        db.add(db_user)
        db.flush()  # ID를 얻기 위해 flush

        # 무료 제공 쿼터 지급 로직 (재지급 방지)
        user_identifier = user_data.get("email") if user_data.get("email") else (
            user_data.get("business_no", "").replace("-", "") if user_data.get("business_no") else None
        )
        
        free_invoice_left = 5
        free_status_left = 5
        
        if user_identifier:
            # 이전 무료 제공 이력 조회
            history = get_history_by_identifier(db, user_identifier)
            
            if history is None:
                # 이력이 없으면 새로 5건씩 제공
                free_invoice_left = 5
                free_status_left = 5
                # 이력 생성
                create_history(
                    db=db,
                    user_identifier=user_identifier,
                    free_invoice_total=5,
                    free_status_total=5,
                    free_invoice_used=0,
                    free_status_used=0,
                    is_consumed=False
                )
            elif not history.is_consumed:
                # 이력이 있고 아직 소진 안됨: 잔여량 계산
                free_invoice_left = max(0, history.free_invoice_total - history.free_invoice_used)
                free_status_left = max(0, history.free_status_total - history.free_status_used)
            else:
                # 이력이 있고 이미 소진됨: 0건 제공
                free_invoice_left = 0
                free_status_left = 0
        
        # 무료 제공 쿼터 생성
        create_free_quota(
            db=db,
            user_id=db_user.id,
            free_invoice_left=free_invoice_left,
            free_status_left=free_status_left
        )

        db.commit()
        db.refresh(db_user)
        
        return db_user

    @staticmethod
    def create_tokens(user: User) -> dict:
        """
        JWT 토큰 생성
        
        Args:
            user: User 객체
            
        Returns:
            토큰 딕셔너리 (access_token, refresh_token, token_type)
        """
        # 액세스 토큰 생성
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.barobill_id}, expires_delta=access_token_expires
        )

        # Refresh 토큰 생성
        refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        refresh_token = create_refresh_token(
            data={"sub": user.barobill_id, "user_id": user.id},
            expires_delta=refresh_token_expires
        )

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }

    @staticmethod
    def save_refresh_token(db: Session, user: User, refresh_token: str, expires_delta: timedelta):
        """
        Refresh 토큰을 DB에 저장
        
        Args:
            db: 데이터베이스 세션
            user: User 객체
            refresh_token: Refresh 토큰
            expires_delta: 만료 시간
        """
        refresh_token_hash = get_password_hash(refresh_token)
        user.refresh_token_hash = refresh_token_hash
        user.refresh_token_expires = datetime.utcnow() + expires_delta
        db.commit()

    @staticmethod
    def save_user_session(
        db: Session,
        user: User,
        access_token: str,
        user_agent: str,
        ip_address: str
    ):
        """
        사용자 세션 정보 저장
        
        Args:
            db: 데이터베이스 세션
            user: User 객체
            access_token: 액세스 토큰
            user_agent: User-Agent 문자열
            ip_address: IP 주소
        """
        try:
            device_name = user_agent
            if len(device_name) > 255:
                device_name = device_name[:255]
            
            session = UserSession(
                user_id=user.id,
                device_name=device_name,
                ip_address=ip_address,
                login_time=datetime.utcnow(),
                last_seen=datetime.utcnow(),
                user_agent=user_agent,
                token=access_token
            )
            db.add(session)
            db.commit()
            db.refresh(session)
        except Exception:
            db.rollback()

    @staticmethod
    def save_device_session(
        db: Session,
        user: User,
        user_agent: str,
        client_ip: str
    ):
        """
        기기 세션 정보 저장 (중복 제거)
        
        Args:
            db: 데이터베이스 세션
            user: User 객체
            user_agent: User-Agent 문자열
            client_ip: 클라이언트 IP 주소
        """
        try:
            device_hash = generate_device_hash(user_agent, client_ip)
            
            existing = db.query(UserDeviceSession).filter_by(
                user_id=str(user.id),
                device_hash=device_hash
            ).first()
            
            if existing:
                existing.last_login = datetime.utcnow()
            else:
                new_session = UserDeviceSession(
                    user_id=str(user.id),
                    device_hash=device_hash,
                    user_agent=user_agent,
                    ip=client_ip,
                    last_login=datetime.utcnow()
                )
                db.add(new_session)
            
            db.commit()
        except Exception:
            db.rollback()

