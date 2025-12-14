from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import RefreshTokenRequest, RefreshTokenResponse
from app.core.security import (
    verify_refresh_token,
    create_access_token,
    get_password_hash,
    verify_password,
)
from app.core.config import settings

router = APIRouter()


def verify_refresh_token_in_db(token: str, db: Session) -> User:
    """
    Refresh 토큰을 검증하고 사용자 반환

    Args:
        token: Refresh 토큰 문자열
        db: 데이터베이스 세션

    Returns:
        User 객체

    Raises:
        HTTPException: 토큰이 유효하지 않거나 사용자를 찾을 수 없는 경우
    """
    # JWT 토큰 검증
    payload = verify_refresh_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않은 refresh token입니다.",
        )

    barobill_id = payload.get("sub")
    user_id = payload.get("user_id")

    if not barobill_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않은 refresh token입니다.",
        )

    # 사용자 조회
    user = None
    if user_id:
        user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        user = db.query(User).filter(User.barobill_id == barobill_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="사용자를 찾을 수 없습니다.",
        )

    # 사용자 활성화 확인
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="비활성화된 사용자입니다.",
        )

    # DB에 저장된 refresh token 확인
    if not user.refresh_token_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="저장된 refresh token이 없습니다. 다시 로그인해주세요.",
        )

    # Refresh token 만료 시간 확인
    if user.refresh_token_expires and user.refresh_token_expires < datetime.utcnow():
        # 만료된 토큰은 DB에서 제거
        user.refresh_token_hash = None
        user.refresh_token_expires = None
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token이 만료되었습니다. 다시 로그인해주세요.",
        )

    return user


@router.post("/refresh", response_model=RefreshTokenResponse)
def refresh_access_token(
    request: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """
    Refresh token을 사용하여 새로운 access token 발급

    Args:
        request: Refresh token 요청
        db: 데이터베이스 세션

    Returns:
        새로운 access token
    """
    try:
        # Refresh token 검증 및 사용자 조회
        user = verify_refresh_token_in_db(request.refresh_token, db)

        # 새로운 access token 생성 (30분 만료)
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.barobill_id},
            expires_delta=access_token_expires
        )

        return {
            "access_token": access_token,
            "token_type": "bearer"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"토큰 갱신 중 오류가 발생했습니다: {str(e)}",
        )

