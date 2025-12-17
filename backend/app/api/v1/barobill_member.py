from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from app.db.session import get_db
from app.models.user import User
from app.models.company import Company
from app.schemas.barobill_member import BarobillMemberCreate, BarobillMemberResponse
from app.core.barobill import BaroBillMemberService, BaroBillAuthService
from app.core.config import settings
from app.api.v1.auth import get_current_user
from datetime import datetime
from pydantic import BaseModel

router = APIRouter(prefix="/barobill", tags=["barobill"])


class AutoLinkRequest(BaseModel):
    """바로빌 자동 연동 요청 스키마"""

    company_id: int  # 회사 ID
    password: Optional[str] = None  # 바로빌 비밀번호 (평문, 선택적)


class AutoLinkResponse(BaseModel):
    """바로빌 자동 연동 응답 스키마"""

    success: bool
    message: str


class CertificateCheckRequest(BaseModel):
    """인증서 확인 요청 스키마"""

    password: Optional[str] = None  # 바로빌 비밀번호 (평문, 선택적)


class CertificateCheckResponse(BaseModel):
    """인증서 확인 응답 스키마"""

    is_valid: bool
    message: str
    regist_url: Optional[str] = None  # 인증서 등록 URL (미등록 시)


def get_barobill_member_service() -> Optional[BaroBillMemberService]:
    """바로빌 회원 관리 서비스 의존성 (파트너 인증키 사용)"""
    # 안전하게 속성 접근 (속성이 없으면 None 반환)
    cert_key = getattr(settings, 'BAROBILL_CERT_KEY', None)
    corp_num = getattr(settings, 'BAROBILL_CORP_NUM', None)
    use_test_server = getattr(settings, 'BAROBILL_USE_TEST_SERVER', False)
    
    if not cert_key or not corp_num:
        # 개발 모드에서는 바로빌 API 없이도 동작 가능
        return None
    return BaroBillMemberService(
        cert_key=cert_key,
        corp_num=corp_num,
        use_test_server=use_test_server,
    )


def get_barobill_auth_service() -> Optional[BaroBillAuthService]:
    """바로빌 인증 서비스 의존성 (파트너 인증키 사용)"""
    # 안전하게 속성 접근 (속성이 없으면 None 반환)
    cert_key = getattr(settings, 'BAROBILL_CERT_KEY', None)
    corp_num = getattr(settings, 'BAROBILL_CORP_NUM', None)
    use_test_server = getattr(settings, 'BAROBILL_USE_TEST_SERVER', False)
    
    if not cert_key or not corp_num:
        # 개발 모드에서는 바로빌 API 없이도 동작 가능
        return None
    return BaroBillAuthService(
        cert_key=cert_key,
        corp_num=corp_num,
        use_test_server=use_test_server,
    )


@router.post(
    "/register",
    response_model=BarobillMemberResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_barobill_member(
    member_data: BarobillMemberCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    partner_service: BaroBillMemberService = Depends(get_barobill_member_service),
):
    """
    바로빌 회원사 가입 (API 방식) - 개발 단계: 바로빌 API 연결 중단

    파트너가 하위 회원사를 바로빌에 등록하고,
    자체 시스템 사용자와 연동합니다.
    """
    try:
        # 이미 바로빌에 연동된 사용자인지 확인
        if current_user.barobill_linked:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 바로빌에 연동된 사용자입니다.",
            )

        # 개발 단계: 바로빌 API 호출 중단
        # 바로빌 API로 회원사 가입
        # result = partner_service.regist_corp_member(
        #     corp_num=member_data.corp_num,
        #     corp_name=member_data.corp_name,
        #     ceo_name=member_data.ceo_name,
        #     biz_type=member_data.biz_type,
        #     biz_class=member_data.biz_class,
        #     post_num=member_data.post_num,
        #     addr1=member_data.addr1,
        #     addr2=member_data.addr2,
        #     member_name=member_data.member_name,
        #     member_id=member_data.id,
        #     member_pwd=member_data.pwd,
        #     grade=member_data.grade,
        #     tel=member_data.tel,
        #     hp=member_data.hp,
        #     email=member_data.email
        # )

        # 사용자 정보 업데이트 (개발 모드에서는 바로빌 연동 상태만 저장)
        current_user.barobill_corp_num = member_data.corp_num.replace("-", "")
        # 인증키는 바로빌에서 별도 조회 필요 (GetCorpMemberCertKey 등)
        # 여기서는 회원사 가입 완료 상태만 저장
        current_user.barobill_linked = True
        current_user.barobill_linked_at = datetime.now()

        db.commit()
        db.refresh(current_user)

        return BarobillMemberResponse(
            success=True,
            cert_key=None,  # 별도 API로 조회 필요
            message="바로빌 회원사 가입이 완료되었습니다. (개발 모드: 바로빌 API 연결 중단)",
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)


@router.post(
    "/auto-link", response_model=AutoLinkResponse, status_code=status.HTTP_200_OK
)
def auto_link_barobill(
    request: AutoLinkRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    partner_service: Optional[BaroBillMemberService] = Depends(get_barobill_member_service),
):
    """
    회사 정보 저장 후 바로빌 자동 연동

    회사 정보를 기반으로 바로빌에 자동으로 회원사 가입 및 연동을 수행합니다.
    """
    try:
        # 파트너 서비스가 설정되지 않은 경우
        if not partner_service:
            return AutoLinkResponse(
                success=False,
                message="바로빌 파트너 인증키가 설정되지 않았습니다. 관리자에게 문의해주세요.",
            )

        # 이미 바로빌에 연동된 사용자인지 확인
        if current_user.barobill_linked:
            return AutoLinkResponse(
                success=True, message="이미 바로빌에 연동된 사용자입니다."
            )

        # 회사 정보 조회
        company = (
            db.query(Company)
            .filter(
                Company.id == request.company_id, Company.user_id == current_user.id
            )
            .first()
        )

        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="회사 정보를 찾을 수 없습니다.",
            )

        # 필수 정보 확인
        if (
            not company.business_number
            or not company.name
            or not company.ceo_name
            or not company.address
            or not company.email
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="회사 정보가 완전하지 않습니다. 사업자번호, 회사명, 대표자명, 주소, 이메일을 모두 입력해주세요.",
            )

        # 바로빌 연동을 위해 최소 하나의 유효한 연락처 필요
        # 숫자만 추출하여 검증
        tel_digits = "".join(filter(str.isdigit, company.tel)) if company.tel else ""
        hp_digits = "".join(filter(str.isdigit, company.hp)) if company.hp else ""

        # 디버깅: 입력된 연락처 값 확인
        import logging

        logger = logging.getLogger(__name__)
        logger.info(
            f"회사 연락처 검증 - 원본 TEL: '{company.tel}', 원본 HP: '{company.hp}'"
        )
        logger.info(
            f"회사 연락처 검증 - 숫자만 추출 TEL: '{tel_digits}', HP: '{hp_digits}'"
        )

        if not tel_digits and not hp_digits:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="바로빌 연동을 위해 전화번호 또는 휴대폰번호 중 하나는 필수입니다. 유효한 번호를 입력해주세요.",
            )

        # 전화번호 최소 길이 검증 (일반전화: 최소 8자리, 휴대폰: 최소 10자리)
        if tel_digits and len(tel_digits) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="전화번호가 너무 짧습니다. 올바른 전화번호를 입력해주세요.",
            )
        if hp_digits and len(hp_digits) < 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="휴대폰번호가 너무 짧습니다. 올바른 휴대폰번호를 입력해주세요.",
            )

        # 사업자번호 하이픈 제거 및 검증
        corp_num_clean = company.business_number.replace("-", "").strip()
        if not corp_num_clean or len(corp_num_clean) != 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="올바른 사업자등록번호 형식이 아닙니다.",
            )

        # 바로빌 회원사 가입 시도
        # 비밀번호는 요청 본문에서 받거나, 없으면 사용자에게 안내
        if not request.password:
            return AutoLinkResponse(
                success=False,
                message="바로빌 연동을 위해 비밀번호가 필요합니다. 로그인 후 다시 시도해주세요.",
            )

        barobill_registered = False
        try:
            barobill_result = partner_service.regist_corp_member(
                corp_num=corp_num_clean,
                corp_name=company.name,
                ceo_name=company.ceo_name,
                biz_type=company.biz_type or "",
                biz_class=company.biz_class or "",
                post_num="",
                addr1=company.address,
                addr2=company.address_detail or "",
                member_name=company.ceo_name,
                member_id=current_user.barobill_id,
                member_pwd=request.password,  # 평문 비밀번호 사용
                grade="",
                tel=company.tel or "",
                hp=company.hp or "",
                email=company.email,
            )
            barobill_registered = True
        except Exception as barobill_error:
            # 바로빌 연동 실패해도 에러를 발생시키지 않고 경고만 반환
            # 사용자가 나중에 다시 시도할 수 있도록 함
            error_msg = str(barobill_error)
            return AutoLinkResponse(
                success=False,
                message=f"바로빌 연동 중 오류가 발생했습니다: {error_msg}. 관리자에게 문의해주세요.",
            )

        # 사용자 정보 업데이트
        if barobill_registered:
            current_user.barobill_corp_num = corp_num_clean
            current_user.barobill_linked = True
            current_user.barobill_linked_at = datetime.now()
            db.commit()
            db.refresh(current_user)

            return AutoLinkResponse(
                success=True, message="바로빌 연동이 완료되었습니다."
            )
        else:
            return AutoLinkResponse(
                success=False,
                message="바로빌 연동에 실패했습니다. 관리자에게 문의해주세요.",
            )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"바로빌 연동 중 오류가 발생했습니다: {error_msg}",
        )


@router.post("/certificate/check", response_model=CertificateCheckResponse)
def check_certificate(
    request: CertificateCheckRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    auth_service: Optional[BaroBillAuthService] = Depends(get_barobill_auth_service),
):
    """
    인증서 등록 여부 확인

    발행 전에 인증서가 등록되어 있는지 확인합니다.
    """
    try:
        # 파트너 서비스가 설정되지 않은 경우
        if not auth_service:
            return CertificateCheckResponse(
                is_valid=False,
                message="바로빌 파트너 인증키가 설정되지 않았습니다. 관리자에게 문의해주세요.",
                regist_url=None,
            )

        # 바로빌 연동 여부 확인
        if not current_user.barobill_linked:
            return CertificateCheckResponse(
                is_valid=False,
                message="바로빌에 연동되지 않은 사용자입니다. 먼저 우리회사 정보를 저장해주세요.",
                regist_url=None,
            )

        # 비밀번호 확인
        if not request.password:
            return CertificateCheckResponse(
                is_valid=False,
                message="인증서 확인을 위해 비밀번호가 필요합니다.",
                regist_url=None,
            )

        # 인증서 유효성 확인
        try:
            cert_check_result = auth_service.check_cert_is_valid(
                member_id=current_user.barobill_id,
                member_pwd=request.password,
            )

            if cert_check_result["is_valid"]:
                return CertificateCheckResponse(
                    is_valid=True,
                    message="인증서가 등록되어 있습니다.",
                    regist_url=None,
                )
            else:
                # 인증서 미등록 시 등록 URL 조회
                try:
                    regist_url_result = auth_service.get_certificate_regist_url(
                        member_id=current_user.barobill_id,
                        member_pwd=request.password,
                    )

                    if regist_url_result["success"]:
                        return CertificateCheckResponse(
                            is_valid=False,
                            message="인증서가 등록되지 않았습니다. 인증서를 등록해주세요.",
                            regist_url=regist_url_result["url"],
                        )
                    else:
                        return CertificateCheckResponse(
                            is_valid=False,
                            message=f"인증서 등록 URL 조회 실패: {regist_url_result.get('error_message', '알 수 없는 오류')}",
                            regist_url=None,
                        )
                except Exception as url_error:
                    return CertificateCheckResponse(
                        is_valid=False,
                        message=f"인증서 등록 URL 조회 중 오류가 발생했습니다: {str(url_error)}",
                        regist_url=None,
                    )
        except Exception as cert_error:
            error_msg = str(cert_error)
            # 인증서 확인 실패 시에도 등록 URL을 조회해볼 수 있음
            try:
                regist_url_result = auth_service.get_certificate_regist_url(
                    member_id=current_user.barobill_id,
                    member_pwd=request.password,
                )
                if regist_url_result["success"]:
                    return CertificateCheckResponse(
                        is_valid=False,
                        message="인증서 확인 중 오류가 발생했습니다. 인증서를 등록해주세요.",
                        regist_url=regist_url_result["url"],
                    )
            except:
                pass

            return CertificateCheckResponse(
                is_valid=False,
                message=f"인증서 확인 중 오류가 발생했습니다: {error_msg}",
                regist_url=None,
            )

    except Exception as e:
        error_msg = str(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"인증서 확인 중 오류가 발생했습니다: {error_msg}",
        )
