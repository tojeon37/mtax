from datetime import datetime, timedelta
from typing import Optional
import jwt
from jwt.exceptions import InvalidTokenError
from passlib.context import CryptContext
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """비밀번호 검증"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """비밀번호 해시 생성"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    JWT 액세스 토큰 생성

    Args:
        data: 토큰에 포함할 데이터 (예: {"sub": "user_email"})
        expires_delta: 만료 시간 (None이면 설정값 사용)

    Returns:
        JWT 토큰 문자열
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")

    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """
    JWT 토큰 디코딩

    Args:
        token: JWT 토큰 문자열

    Returns:
        디코딩된 페이로드 또는 None (유효하지 않은 경우)
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        return payload
    except InvalidTokenError:
        return None


def create_password_reset_token(user_id: int, barobill_id: str) -> str:
    """
    비밀번호 재설정 토큰 생성

    Args:
        user_id: 사용자 ID
        barobill_id: 바로빌 아이디

    Returns:
        재설정 토큰 문자열
    """
    expire = datetime.utcnow() + timedelta(
        minutes=settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES
    )
    to_encode = {
        "sub": str(user_id),
        "barobill_id": barobill_id,
        "type": "password_reset",
        "exp": expire,
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
    return encoded_jwt


def decode_password_reset_token(token: str) -> Optional[dict]:
    """
    비밀번호 재설정 토큰 디코딩

    Args:
        token: 재설정 토큰 문자열

    Returns:
        디코딩된 페이로드 또는 None (유효하지 않은 경우)
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        if payload.get("type") != "password_reset":
            return None
        return payload
    except InvalidTokenError:
        return None


def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    JWT Refresh 토큰 생성

    Args:
        data: 토큰에 포함할 데이터 (예: {"sub": "user_id", "barobill_id": "..."})
        expires_delta: 만료 시간 (None이면 설정값 사용, 90일)

    Returns:
        JWT Refresh 토큰 문자열
    """
    to_encode = data.copy()
    to_encode["type"] = "refresh"  # 토큰 타입 명시

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")

    return encoded_jwt


def verify_refresh_token(token: str) -> Optional[dict]:
    """
    Refresh 토큰 검증

    Args:
        token: Refresh 토큰 문자열

    Returns:
        디코딩된 페이로드 또는 None (유효하지 않은 경우)
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        # 토큰 타입 확인
        if payload.get("type") != "refresh":
            return None
        return payload
    except InvalidTokenError:
        return None
