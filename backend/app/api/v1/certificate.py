from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.api.v1.auth import get_current_user
from app.core.barobill.barobill_auth import BaroBillAuthService
from app.core.config import settings

router = APIRouter()


@router.get("/status")
def get_certificate_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    바로빌 인증서 등록 여부 확인 API
    
    현재 로그인한 사용자의 바로빌 인증서 등록 여부를 확인합니다.
    바로빌 API의 CheckCERTIsValid를 사용하여 실제 인증서 상태를 조회합니다.
    """
    # 바로빌 연동 확인
    if not current_user.barobill_linked or not current_user.barobill_cert_key:
        return {
            "certificate_registered": False,
            "certificate_status_message": "바로빌 연동이 필요합니다. 먼저 바로빌 회원사 가입을 완료해주세요.",
            "can_issue_invoice": False,
        }
    
    if not current_user.barobill_corp_num:
        return {
            "certificate_registered": False,
            "certificate_status_message": "사업자번호가 등록되지 않았습니다.",
            "can_issue_invoice": False,
        }
    
    try:
        # 사용자별 인증키로 인증 서비스 생성
        auth_service = BaroBillAuthService(
            cert_key=current_user.barobill_cert_key,
            corp_num=current_user.barobill_corp_num.replace("-", "").strip(),
            use_test_server=getattr(settings, "BAROBILL_USE_TEST_SERVER", False)
        )
        
        # 인증서 상태 조회
        cert_status = auth_service.get_certificate_status()
        
        return {
            "certificate_registered": cert_status["certificate_registered"],
            "certificate_status_message": cert_status["status_message"],
            "can_issue_invoice": cert_status["can_issue_invoice"],
        }
        
    except Exception as e:
        # API 호출 실패 시 인증서 미등록으로 간주
        error_message = str(e)
        return {
            "certificate_registered": False,
            "certificate_status_message": f"인증서 상태 확인 실패: {error_message}",
            "can_issue_invoice": False,
        }

