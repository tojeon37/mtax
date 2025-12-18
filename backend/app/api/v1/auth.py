from datetime import timedelta, datetime
from typing import Tuple

from fastapi import APIRouter, Depends, HTTPException, status
from starlette.requests import Request
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.db.session import get_db
from app.schemas.user import (
    UserCreate,
    UserUpdate,
    UserResponse,
    Token,
    PasswordResetRequest,
    PasswordReset,
    PasswordResetByToken,
    PasswordChange,
)
from app.models.user import User
from app.core.security import (
    get_password_hash,
    verify_password,
    decode_access_token,
    create_password_reset_token,
    decode_password_reset_token,
)
from app.core.config import settings
from app.services.auth_service import AuthService
from app.services.company_service import CompanyService

router = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password: str


def update_barobill_password(user: User, new_password: str) -> Tuple[bool, str]:
    """
    바로빌 비밀번호 업데이트 헬퍼 함수

    Args:
        user: 사용자 객체
        new_password: 새 비밀번호

    Returns:
        (성공 여부, 에러 메시지)
    """
    if (
        not user.barobill_linked
        or not user.barobill_cert_key
        or not user.barobill_corp_num
    ):
        return False, None

    try:
        from app.core.barobill.barobill_member import BaroBillMemberService

        # 안전하게 속성 접근 (속성이 없으면 기본값 사용)
        use_test_server = getattr(settings, "BAROBILL_USE_TEST_SERVER", False)

        barobill_service = BaroBillMemberService(
            cert_key=user.barobill_cert_key,
            corp_num=user.barobill_corp_num.replace("-", ""),
            use_test_server=use_test_server,
        )

        barobill_result = barobill_service.update_user_password(
            user_id=user.barobill_id, new_password=new_password
        )
        return True, None
    except Exception as e:
        import logging

        logger = logging.getLogger(__name__)
        logger.warning(f"바로빌 비밀번호 변경 실패: {str(e)}")
        return False, str(e)


oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    """
    현재 로그인한 사용자 조회 (의존성)

    Args:
        token: JWT 토큰
        db: 데이터베이스 세션

    Returns:
        User 객체

    Raises:
        HTTPException: 토큰이 유효하지 않거나 사용자를 찾을 수 없는 경우
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="인증 정보를 확인할 수 없습니다.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # 토큰 디코딩
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    barobill_id: str = payload.get("sub")
    if barobill_id is None:
        raise credentials_exception

    # 사용자 조회 (바로빌 아이디로 조회)
    user = db.query(User).filter(User.barobill_id == barobill_id).first()
    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="비활성화된 사용자입니다."
        )

    return user


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user: UserCreate, db: Session = Depends(get_db)):
    """
    사용자 회원가입 (바로빌 연동)

    Args:
        user: 회원가입 정보
        db: 데이터베이스 세션

    Returns:
        JWT 토큰 (자동 로그인)
    """
    try:
        # 바로빌 아이디 중복 확인
        db_user = db.query(User).filter(User.barobill_id == user.barobill_id).first()
        if db_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 등록된 바로빌 아이디입니다.",
            )

        # 이메일 중복 확인 (이메일이 제공된 경우에만)
        if user.email:
            db_user_email = db.query(User).filter(User.email == user.email).first()
            if db_user_email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="이미 등록된 이메일입니다.",
                )

        # 바로빌 회원가입 API 호출 (회사 서비스 사용)
        barobill_service = CompanyService.get_barobill_partner_service()
        barobill_registered = False
        barobill_error = None

        if barobill_service:
            user_data = {
                "barobill_id": user.barobill_id,
                "password": user.password,
                "business_no": user.business_no,
                "company_name": user.company_name,
                "biz_name": user.biz_name,
                "ceo_name": user.ceo_name,
                "biz_type": user.biz_type,
                "biz_item": user.biz_item,
                "address": user.address,
                "manager_name": user.manager_name,
                "tel": user.tel,
                "manager_tel": user.manager_tel,
                "email": user.email,
            }
            barobill_registered, barobill_error = (
                CompanyService.register_barobill_member(barobill_service, user_data)
            )

            # 바로빌 연동 실패 시 에러 메시지 로깅 (하지만 우리 DB에는 계속 등록)
            if barobill_error:
                import logging

                logger = logging.getLogger(__name__)
                logger.warning(f"바로빌 연동 실패: {barobill_error}")
                # 바로빌 연동 실패해도 우리 DB에는 등록 진행 (barobill_registered=False)

        # 사용자 생성 및 무료 쿼터 지급 (인증 서비스 사용)
        user_data = {
            "barobill_id": user.barobill_id,
            "password": user.password,
            "email": user.email,
            "business_no": user.business_no,
            "company_name": user.company_name,
            "biz_name": user.biz_name,
        }
        db_user = AuthService.create_user_with_quota(db, user_data, barobill_registered)

        # JWT 토큰 생성 (인증 서비스 사용)
        tokens = AuthService.create_tokens(db_user)
        refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        AuthService.save_refresh_token(
            db, db_user, tokens["refresh_token"], refresh_token_expires
        )

        return tokens
    except HTTPException:
        raise
    except IntegrityError as e:
        db.rollback()
        # 데이터베이스 무결성 오류 처리
        error_msg = str(e.orig) if hasattr(e, "orig") else str(e)

        # 이메일 중복 오류 감지
        if "email" in error_msg.lower() or "ix_users_email" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 등록된 이메일입니다.",
            )
        # 바로빌 아이디 중복 오류 감지
        elif "barobill_id" in error_msg.lower() or "ix_users_barobill_id" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 등록된 바로빌 아이디입니다.",
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 등록된 정보가 있습니다. 아이디나 이메일을 확인해주세요.",
            )
    except Exception as e:
        db.rollback()
        import traceback

        error_detail = traceback.format_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"회원가입 중 오류가 발생했습니다: {str(e)}",
        )


@router.post("/login", response_model=Token)
def login(req: LoginRequest, request: Request = None, db: Session = Depends(get_db)):
    # 사용자 조회
    user = db.query(User).filter(User.barobill_id == req.username).first()

    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="바로빌 아이디 또는 비밀번호가 올바르지 않습니다.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="비활성화된 사용자입니다.",
        )

    tokens = AuthService.create_tokens(user)
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    AuthService.save_refresh_token(
        db, user, tokens["refresh_token"], refresh_token_expires
    )

    if request:
        user_agent = request.headers.get("User-Agent", "Unknown Device")
        ip_address = request.client.host if request.client else "0.0.0.0"
        AuthService.save_user_session(
            db, user, tokens["access_token"], user_agent, ip_address
        )
        AuthService.save_device_session(db, user, user_agent, ip_address)

    return tokens


@router.get("/check-id/{barobill_id}")
def check_barobill_id(barobill_id: str, db: Session = Depends(get_db)):
    """
    바로빌 아이디 중복 확인

    Args:
        barobill_id: 확인할 바로빌 아이디
        db: 데이터베이스 세션

    Returns:
        중복 여부 (available: 사용 가능 여부)
    """
    db_user = db.query(User).filter(User.barobill_id == barobill_id).first()
    return {
        "available": db_user is None,
        "message": (
            "이미 사용 중인 아이디입니다." if db_user else "사용 가능한 아이디입니다."
        ),
    }


@router.get("/check-username/{username}")
def check_username(username: str, db: Session = Depends(get_db)):
    """
    아이디 중복 확인 (우리 DB + 바로빌 체크)

    Args:
        username: 확인할 바로빌 아이디
        db: 데이터베이스 세션

    Returns:
        중복 여부 (available: 사용 가능 여부)
    """
    try:
        # 우리 DB에서 확인
        db_user = db.query(User).filter(User.barobill_id == username).first()
        if db_user:
            return {
                "available": False,
                "message": "이미 사용 중인 아이디입니다.",
            }

        # TODO: 바로빌 API로도 중복 확인 (필요시)
        # 현재는 우리 DB만 확인

        return {
            "available": True,
            "message": "사용 가능한 아이디입니다.",
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"아이디 중복 확인 중 오류가 발생했습니다: {str(e)}",
        )


@router.get("/check-email/{email}")
def check_email(email: str, db: Session = Depends(get_db)):
    """
    이메일 중복 확인

    Args:
        email: 확인할 이메일
        db: 데이터베이스 세션

    Returns:
        중복 여부 (available: 사용 가능 여부)
    """
    db_user = db.query(User).filter(User.email == email).first()
    return {
        "available": db_user is None,
        "message": (
            "이미 등록된 이메일입니다." if db_user else "사용 가능한 이메일입니다."
        ),
    }


@router.post("/forgot-password")
def forgot_password(request: PasswordResetRequest, db: Session = Depends(get_db)):
    """
    비밀번호 찾기 (이메일로 재설정 링크 전송)

    Args:
        request: 비밀번호 찾기 요청 (barobill_id, email)
        db: 데이터베이스 세션

    Returns:
        이메일 전송 결과
    """
    try:
        # barobill_id로만 사용자 찾기
        user_by_id = (
            db.query(User).filter(User.barobill_id == request.barobill_id).first()
        )

        # email로만 사용자 찾기
        user_by_email = db.query(User).filter(User.email == request.email).first()

        # 아이디와 이메일로 사용자 찾기 (우선 시도)
        user = (
            db.query(User)
            .filter(
                User.barobill_id == request.barobill_id, User.email == request.email
            )
            .first()
        )

        # 아이디와 이메일이 모두 일치하지 않으면, 이메일만으로 사용자 찾기
        if not user and user_by_email:
            user = user_by_email

        if not user:
            # 보안을 위해 사용자가 없어도 성공 메시지 반환 (이메일 주소 추측 방지)
            return {
                "success": True,
                "message": "입력하신 이메일 주소로 비밀번호 재설정 링크를 전송했습니다.",
            }

        # 재설정 토큰 생성
        reset_token = create_password_reset_token(user.id, user.barobill_id)

        # 토큰을 데이터베이스에 저장
        try:
            user.reset_token = reset_token
            user.reset_token_expires = datetime.utcnow() + timedelta(
                minutes=settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES
            )
            db.commit()
        except Exception as e:
            db.rollback()
            # 데이터베이스 스키마 오류인 경우
            if "reset_token" in str(e) or "Unknown column" in str(e):
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="데이터베이스 스키마가 업데이트되지 않았습니다. 관리자에게 문의하세요.",
                )
            raise

        # 이메일 전송 기능은 현재 구현되지 않음
        # 보안을 위해 항상 성공 메시지 반환 (이메일 주소 추측 방지)
        return {
            "success": True,
            "message": "입력하신 이메일 주소로 비밀번호 재설정 링크를 전송했습니다.",
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        import traceback

        error_detail = traceback.format_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"비밀번호 찾기 중 오류가 발생했습니다: {str(e)}",
        )


@router.post("/reset-password")
def reset_password(request: PasswordReset, db: Session = Depends(get_db)):
    """
    비밀번호 재설정 (아이디/이메일 방식 - 기존 방식 유지)

    Args:
        request: 비밀번호 재설정 요청 (barobill_id, email, new_password)
        db: 데이터베이스 세션

    Returns:
        재설정 결과
    """
    # 아이디와 이메일로 사용자 찾기
    user = (
        db.query(User)
        .filter(User.barobill_id == request.barobill_id, User.email == request.email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="아이디와 이메일이 일치하는 사용자를 찾을 수 없습니다.",
        )

    # 새 비밀번호 검증
    if len(request.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="비밀번호는 최소 6자 이상이어야 합니다.",
        )

    # 비밀번호 해시화 및 업데이트
    try:
        # 바로빌 연동이 되어있는 경우 바로빌 비밀번호도 업데이트
        barobill_update_success, barobill_error = update_barobill_password(
            user, request.new_password
        )

        new_password_hash = get_password_hash(request.new_password)
        user.password_hash = new_password_hash
        # 재설정 토큰 초기화
        user.reset_token = None
        user.reset_token_expires = None
        # 비밀번호 변경 시 모든 refresh token 무효화 (보안)
        user.refresh_token_hash = None
        user.refresh_token_expires = None
        db.commit()
        db.refresh(user)

        # 결과 메시지 구성
        if barobill_update_success:
            message = "비밀번호가 성공적으로 변경되었습니다. 변경된 비밀번호로 바로빌에도 로그인할 수 있습니다."
        elif barobill_error:
            message = f"비밀번호가 변경되었습니다. 다만 바로빌 비밀번호 변경 중 오류가 발생했습니다: {barobill_error}"
        else:
            message = "비밀번호가 성공적으로 변경되었습니다."

        return {"success": True, "message": message}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"비밀번호 변경 중 오류가 발생했습니다: {str(e)}",
        )


@router.post("/reset-password-by-token")
def reset_password_by_token(
    request: PasswordResetByToken, db: Session = Depends(get_db)
):
    """
    비밀번호 재설정 (토큰 방식 - 이메일 링크로 접근)

    Args:
        request: 비밀번호 재설정 요청 (token, new_password)
        db: 데이터베이스 세션

    Returns:
        재설정 결과
    """
    # 토큰 디코딩
    payload = decode_password_reset_token(request.token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="유효하지 않거나 만료된 재설정 링크입니다.",
        )

    user_id = int(payload.get("sub"))
    barobill_id = payload.get("barobill_id")

    # 사용자 찾기
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="사용자를 찾을 수 없습니다.",
        )

    # 토큰 검증 (데이터베이스에 저장된 토큰과 일치하는지 확인)
    if user.reset_token != request.token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="유효하지 않은 재설정 토큰입니다.",
        )

    # 토큰 만료 확인
    if user.reset_token_expires and user.reset_token_expires < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="재설정 링크가 만료되었습니다. 다시 요청해주세요.",
        )

    # 새 비밀번호 검증
    if len(request.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="비밀번호는 최소 6자 이상이어야 합니다.",
        )

    # 비밀번호 해시화 및 업데이트
    try:
        # 바로빌 연동이 되어있는 경우 바로빌 비밀번호도 업데이트
        barobill_update_success, barobill_error = update_barobill_password(
            user, request.new_password
        )

        new_password_hash = get_password_hash(request.new_password)
        user.password_hash = new_password_hash
        # 재설정 토큰 초기화 (한 번만 사용 가능)
        user.reset_token = None
        user.reset_token_expires = None
        # 비밀번호 변경 시 모든 refresh token 무효화 (보안)
        user.refresh_token_hash = None
        user.refresh_token_expires = None
        db.commit()
        db.refresh(user)

        # 결과 메시지 구성
        if barobill_update_success:
            message = "비밀번호가 성공적으로 변경되었습니다. 변경된 비밀번호로 바로빌에도 로그인할 수 있습니다."
        elif barobill_error:
            message = f"비밀번호가 변경되었습니다. 다만 바로빌 비밀번호 변경 중 오류가 발생했습니다: {barobill_error}"
        else:
            message = "비밀번호가 성공적으로 변경되었습니다."

        return {"success": True, "message": message}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"비밀번호 변경 중 오류가 발생했습니다: {str(e)}",
        )


@router.put("/password")
def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    비밀번호 변경 (로그인한 사용자가 자신의 비밀번호 변경)

    Args:
        password_data: 비밀번호 변경 정보 (current_password, new_password)
        current_user: 현재 로그인한 사용자 (의존성 주입)
        db: 데이터베이스 세션

    Returns:
        변경 결과
    """
    # 현재 세션에서 사용자 다시 조회 (세션 연결 보장)
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="사용자를 찾을 수 없습니다.",
        )

    # 현재 비밀번호 검증
    if not verify_password(password_data.current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="현재 비밀번호가 올바르지 않습니다.",
        )

    # 새 비밀번호 유효성 검사
    if len(password_data.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="비밀번호는 최소 8자 이상이어야 합니다.",
        )

    # 현재 비밀번호와 새 비밀번호가 같은지 확인
    if password_data.current_password == password_data.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="현재 비밀번호와 동일한 비밀번호는 사용할 수 없습니다.",
        )

    # 비밀번호 해시화 및 업데이트
    try:
        # 바로빌 연동이 되어있는 경우 바로빌 비밀번호도 업데이트
        barobill_update_success, barobill_error = update_barobill_password(
            user, password_data.new_password
        )

        # 로컬 DB 비밀번호 업데이트
        new_password_hash = get_password_hash(password_data.new_password)
        user.password_hash = new_password_hash
        # 비밀번호 변경 시 모든 refresh token 무효화 (보안)
        user.refresh_token_hash = None
        user.refresh_token_expires = None
        db.commit()
        db.refresh(user)

        # 결과 메시지 구성
        if barobill_update_success:
            message = "비밀번호가 성공적으로 변경되었습니다. 변경된 비밀번호로 바로빌에도 로그인할 수 있습니다."
        elif barobill_error:
            message = f"비밀번호가 변경되었습니다. 다만 바로빌 비밀번호 변경 중 오류가 발생했습니다: {barobill_error}"
        else:
            message = "비밀번호가 성공적으로 변경되었습니다."

        return {"success": True, "message": message}
    except Exception as e:
        db.rollback()
        import traceback

        error_detail = traceback.format_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"비밀번호 변경 중 오류가 발생했습니다: {str(e)}",
        )


@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """
    현재 로그인한 사용자 정보 조회 (기존 JWT 방식 - 호환성 유지)

    Args:
        current_user: 현재 로그인한 사용자 (의존성 주입)
        db: 데이터베이스 세션

    Returns:
        사용자 정보 (is_free_mode 포함)
    """
    # DB에서 최신 정보 조회
    db.refresh(current_user)

    # free_quota에서 무료 건수 조회
    from app.crud.free_quota import get_or_create_free_quota
    from app.models.payment_method import PaymentMethod

    free_quota = get_or_create_free_quota(db, current_user.id)
    free_invoice_remaining = free_quota.free_invoice_left if free_quota else 0

    # payment_methods에서 결제수단 등록 여부 확인
    has_payment_method = (
        db.query(PaymentMethod).filter(PaymentMethod.user_id == current_user.id).first()
        is not None
    )

    # UserResponse 스키마에 맞게 데이터 구성
    return UserResponse(
        id=current_user.id,
        barobill_id=current_user.barobill_id,
        email=current_user.email,
        biz_name=current_user.biz_name,
        is_active=current_user.is_active,
        barobill_corp_num=current_user.barobill_corp_num,
        barobill_cert_key=current_user.barobill_cert_key,
        barobill_linked=current_user.barobill_linked,
        barobill_linked_at=current_user.barobill_linked_at,
        free_invoice_remaining=free_invoice_remaining,
        has_payment_method=has_payment_method,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
    )


@router.put("/me", response_model=UserResponse)
def update_current_user_info(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    현재 로그인한 사용자 정보 수정 및 바로빌 업데이트

    Args:
        user_update: 수정할 사용자 정보
        current_user: 현재 로그인한 사용자 (의존성 주입)
        db: 데이터베이스 세션

    Returns:
        수정된 사용자 정보
    """
    try:
        # DB에서 최신 정보 조회
        user = db.query(User).filter(User.id == current_user.id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="사용자를 찾을 수 없습니다.",
            )

        # 우리 DB 정보 업데이트
        if user_update.email is not None:
            # 이메일 중복 확인 (다른 사용자가 사용 중인지)
            existing_user = (
                db.query(User)
                .filter(User.email == user_update.email, User.id != user.id)
                .first()
            )
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="이미 사용 중인 이메일입니다.",
                )
            user.email = user_update.email

        if user_update.biz_name is not None:
            user.biz_name = user_update.biz_name

        if user_update.is_active is not None:
            # 일반 사용자는 자신의 활성화 상태를 변경할 수 없음 (관리자만 가능)
            # 여기서는 무시하거나 에러 반환
            pass

        db.flush()

        # 바로빌 연동이 되어있는 경우 바로빌에도 업데이트
        barobill_update_success = False
        barobill_error = None

        if user.barobill_linked and user.barobill_cert_key and user.barobill_corp_num:
            try:
                from app.core.barobill.barobill_member import BaroBillMemberService
                from app.core.config import settings

                use_test_server = getattr(settings, "BAROBILL_USE_TEST_SERVER", False)

                barobill_service = BaroBillMemberService(
                    cert_key=user.barobill_cert_key,
                    corp_num=user.barobill_corp_num.replace("-", ""),
                    use_test_server=use_test_server,
                )

                # 회사 정보 업데이트 (제공된 경우에만)
                if (
                    user_update.company_name
                    or user_update.ceo_name
                    or user_update.address
                    or user_update.biz_type
                    or user_update.biz_item
                ):
                    barobill_service.update_corp_info(
                        corp_num=user.barobill_corp_num,
                        corp_name=user_update.company_name or user.biz_name or "",
                        ceo_name=user_update.ceo_name or "",
                        biz_type=user_update.biz_type or "",
                        biz_class=user_update.biz_item or "",
                        post_num="",
                        addr1=user_update.address or "",
                        addr2="",
                    )

                # 사용자 정보 업데이트 (제공된 경우에만)
                if (
                    user_update.email
                    or user_update.manager_name
                    or user_update.tel
                    or user_update.manager_tel
                ):
                    barobill_service.update_user_info(
                        corp_num=user.barobill_corp_num,
                        user_id=user.barobill_id,
                        member_name=user_update.manager_name or "",
                        tel=user_update.tel or "",
                        hp=user_update.manager_tel or "",
                        email=user_update.email or user.email or "",
                        grade="",
                    )

                barobill_update_success = True
            except Exception as e:
                import logging

                logger = logging.getLogger(__name__)
                logger.warning(f"바로빌 정보 업데이트 실패: {str(e)}")
                barobill_error = str(e)
                # 바로빌 업데이트 실패해도 우리 DB는 업데이트 진행

        db.commit()
        db.refresh(user)

        # free_quota에서 무료 건수 조회
        from app.crud.free_quota import get_or_create_free_quota
        from app.models.payment_method import PaymentMethod

        free_quota = get_or_create_free_quota(db, user.id)
        free_invoice_remaining = free_quota.free_invoice_left if free_quota else 0

        # payment_methods에서 결제수단 등록 여부 확인
        has_payment_method = (
            db.query(PaymentMethod).filter(PaymentMethod.user_id == user.id).first()
            is not None
        )

        # 응답 메시지 구성
        message = "사용자 정보가 성공적으로 수정되었습니다."
        if barobill_update_success:
            message += " 바로빌 정보도 함께 업데이트되었습니다."
        elif barobill_error:
            message += f" 다만 바로빌 정보 업데이트 중 오류가 발생했습니다: {barobill_error}"

        # UserResponse 스키마에 맞게 데이터 구성
        return UserResponse(
            id=user.id,
            barobill_id=user.barobill_id,
            email=user.email,
            biz_name=user.biz_name,
            is_active=user.is_active,
            barobill_corp_num=user.barobill_corp_num,
            barobill_cert_key=user.barobill_cert_key,
            barobill_linked=user.barobill_linked,
            barobill_linked_at=user.barobill_linked_at,
            free_invoice_remaining=free_invoice_remaining,
            has_payment_method=has_payment_method,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        import traceback

        error_detail = traceback.format_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"사용자 정보 수정 중 오류가 발생했습니다: {str(e)}",
        )
