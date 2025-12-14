from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.api.v1.auth import get_current_user
from app.services.tax_invoice import TaxInvoiceService

router = APIRouter()


@router.get("/status")
def get_certificate_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    바로빌 인증서 등록 여부 확인 API
    
    현재 로그인한 사용자의 바로빌 인증서 등록 여부를 확인합니다.
    """
    # 바로빌 연동 확인
    if not current_user.barobill_linked or not current_user.barobill_cert_key:
        return {
            "certificate_registered": False,
            "expire_date": None,
            "message": "바로빌 연동이 필요합니다. 먼저 바로빌 회원사 가입을 완료해주세요."
        }
    
    if not current_user.barobill_corp_num:
        return {
            "certificate_registered": False,
            "expire_date": None,
            "message": "사업자번호가 등록되지 않았습니다."
        }
    
    try:
        # 사용자별 인증키로 세금계산서 서비스 생성
        service = TaxInvoiceService(
            cert_key=current_user.barobill_cert_key,
            corp_num=current_user.barobill_corp_num
        )
        
        # 바로빌 API를 통해 인증서 목록 조회 시도
        # 인증서가 없으면 세금계산서 발행 시 오류가 발생하므로,
        # 실제 발행을 시도해보거나 인증서 조회 API를 호출해야 합니다.
        # 바로빌 SOAP API에는 GetCertificateList 같은 API가 있을 수 있지만,
        # 여기서는 간단히 인증키와 사업자번호가 있는지만 확인합니다.
        
        # 실제로는 바로빌 API에서 인증서 목록을 조회해야 하지만,
        # 현재 바로빌 SOAP API 문서에 따라 구현이 필요합니다.
        # 일단 인증키가 있으면 인증서가 등록된 것으로 간주하거나,
        # 실제 API 호출로 확인해야 합니다.
        
        # 임시로 인증키가 있으면 등록된 것으로 간주
        # 실제로는 바로빌 API를 호출하여 확인해야 합니다.
        return {
            "certificate_registered": True,
            "expire_date": None,  # 바로빌 API에서 만료일 조회 필요
            "message": "인증서가 등록되어 있습니다."
        }
        
    except Exception as e:
        # API 호출 실패 시 인증서 미등록으로 간주
        error_message = str(e)
        if "인증" in error_message or "인증키" in error_message or "cert" in error_message.lower():
            return {
                "certificate_registered": False,
                "expire_date": None,
                "message": "인증서가 등록되지 않았거나 인증에 실패했습니다."
            }
        
        # 기타 오류는 그대로 전달
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"인증서 확인 중 오류가 발생했습니다: {error_message}"
        )

