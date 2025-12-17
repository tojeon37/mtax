from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.services.tax_invoice import TaxInvoiceService
from app.services.invoice_service import InvoiceService
from app.services.corp_state_service import CorpStateService
from app.core.barobill import BaroBillInvoiceService
from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.models.corp_state_history import CorpStateHistory
from app.api.v1.auth import get_current_user
from fastapi.security import HTTPBearer
from app.schemas.tax_invoice_barobill import (
    TaxInvoiceCreate,
    TaxInvoiceIssue as TaxInvoiceIssueSchema,
    TaxInvoiceResponse
)

router = APIRouter()

# Optional 인증을 위한 의존성
security = HTTPBearer(auto_error=False)

def get_current_user_optional(
    credentials = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """현재 로그인한 사용자 조회 (Optional, 로그인하지 않아도 None 반환)"""
    if not credentials:
        return None
    try:
        return get_current_user(credentials.credentials, db)
    except:
        return None


def get_tax_invoice_service() -> TaxInvoiceService:
    """세금계산서 서비스 의존성"""
    return TaxInvoiceService()


def get_barobill_service() -> BaroBillInvoiceService:
    """바로빌 서비스 의존성"""
    # 안전하게 속성 접근 (속성이 없으면 기본값 사용)
    cert_key = getattr(settings, 'BAROBILL_CERT_KEY', None)
    corp_num = getattr(settings, 'BAROBILL_CORP_NUM', None)
    use_test_server = getattr(settings, 'BAROBILL_USE_TEST_SERVER', False)
    
    if not cert_key or not corp_num:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="바로빌 API 인증키가 설정되지 않았습니다."
        )
    
    return BaroBillInvoiceService(
        cert_key=cert_key,
        corp_num=corp_num,
        use_test_server=use_test_server
    )


class CorpStateCheckRequest(BaseModel):
    corp_num: str


@router.post("/tax-invoices/register", response_model=dict, status_code=status.HTTP_201_CREATED)
def register_tax_invoice(
    invoice: TaxInvoiceCreate,
    service: TaxInvoiceService = Depends(get_tax_invoice_service)
):
    """세금계산서 등록"""
    try:
        # 스키마를 딕셔너리로 변환
        invoice_data = invoice.model_dump(exclude={'IssueTiming'})
        issue_timing = invoice.IssueTiming
        
        mgt_key = service.regist_tax_invoice(invoice_data, issue_timing)
        
        return {
            "success": True,
            "mgt_key": mgt_key,
            "message": "세금계산서가 등록되었습니다."
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/tax-invoices/{mgt_key}", response_model=dict)
def get_tax_invoice(
    mgt_key: str,
    service: TaxInvoiceService = Depends(get_tax_invoice_service)
):
    """세금계산서 조회"""
    try:
        result = service.get_tax_invoice(mgt_key)
        return {
            "success": True,
            "data": result
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.post("/tax-invoices/states", response_model=dict)
def get_tax_invoice_states(
    mgt_key_list: List[str],
    service: TaxInvoiceService = Depends(get_tax_invoice_service)
):
    """세금계산서 상태 조회 (복수)"""
    try:
        result = service.get_tax_invoice_states(mgt_key_list)
        return {
            "success": True,
            "data": result
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/tax-invoices/issue", response_model=dict)
def issue_tax_invoice(
    issue_data: TaxInvoiceIssueSchema,
    service: TaxInvoiceService = Depends(get_tax_invoice_service),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """세금계산서 발행 (바로빌 발행 + DB 상태 업데이트)"""
    try:
        # 바로빌 API 호출
        result = service.issue_tax_invoice(
            mgt_key=issue_data.mgt_key,
            send_sms=issue_data.send_sms,
            sms_message=issue_data.sms_message or "",
            force_issue=issue_data.force_issue,
            mail_title=issue_data.mail_title or "",
            business_license_yn=issue_data.business_license_yn,
            bank_book_yn=issue_data.bank_book_yn
        )
        
        # 발행 성공 시 DB 상태 업데이트 (서비스 레이어 사용)
        if result > 0:
            InvoiceService.update_invoice_after_issue(
                db, current_user.id, issue_data.mgt_key, result
            )
        else:
            # 발행 실패 시
            db.rollback()
            error_msg = service.barobill.get_err_string(result) if hasattr(service, 'barobill') else f"발행 실패 (코드: {result})"
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg
            )
        
        return {
            "success": True,
            "result_code": result,
            "message": "세금계산서가 발행되었습니다."
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/tax-invoices/{mgt_key}", response_model=dict)
def delete_tax_invoice(
    mgt_key: str,
    service: TaxInvoiceService = Depends(get_tax_invoice_service),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """세금계산서 취소 (바로빌 취소 + DB 상태 업데이트)"""
    try:
        # Invoice 찾기 (서비스 레이어 사용)
        invoice = InvoiceService.find_invoice_by_mgt_key(
            db, current_user.id, mgt_key
        )
        
        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="세금계산서를 찾을 수 없습니다."
            )
        
        # 바로빌에서 실제 상태 확인 (실시간 상태 체크)
        barobill_state = None
        try:
            states_result = service.get_tax_invoice_states([mgt_key])
            if states_result and len(states_result) > 0:
                barobill_state = states_result[0].get("BarobobillState") or states_result[0].get("barobill_state")
        except Exception:
            pass  # 상태 확인 실패 시 DB 상태로 판단
        
        # 취소 가능 여부 검증 (서비스 레이어 사용)
        InvoiceService.validate_invoice_cancellation(db, invoice, barobill_state)
        
        # 바로빌 취소 API 호출
        result = service.delete_tax_invoice(mgt_key)
        
        # 취소 실패 시
        if result < 0:
            error_msg = service.barobill.get_err_string(result) if hasattr(service, 'barobill') else f"취소 실패 (코드: {result})"
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"세금계산서 취소 실패: {error_msg}"
            )
        
        # DB 상태 업데이트 (서비스 레이어 사용)
        InvoiceService.update_invoice_after_cancel(
            db, current_user.id, mgt_key
        )
        
        return {
            "success": True,
            "result_code": result,
            "message": "세금계산서가 취소되었습니다."
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/tax-invoices/by-invoice/{invoice_id}", response_model=dict)
def delete_tax_invoice_by_invoice_id(
    invoice_id: int,
    service: TaxInvoiceService = Depends(get_tax_invoice_service),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """세금계산서 취소 (invoice_id로 취소)"""
    try:
        # invoice_id로 Invoice 찾기
        from app.models.invoice import Invoice
        invoice = db.query(Invoice).filter(
            Invoice.id == invoice_id,
            Invoice.user_id == current_user.id
        ).first()
        
        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="세금계산서를 찾을 수 없습니다."
            )
        
        # mgt_key 찾기 (서비스 레이어 사용)
        mgt_key = InvoiceService.find_mgt_key_by_invoice_id(
            db, current_user.id, invoice_id
        )
        
        if not mgt_key:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="바로빌로 발행하지 않은 세금계산서는 취소할 수 없습니다. 바로빌로 발행한 세금계산서만 취소할 수 있습니다."
            )
        
        # 바로빌에서 실제 상태 확인
        barobill_state = None
        try:
            states_result = service.get_tax_invoice_states([mgt_key])
            if states_result and len(states_result) > 0:
                barobill_state = states_result[0].get("BarobillState") or states_result[0].get("barobill_state")
        except Exception:
            pass
        
        # 취소 가능 여부 검증 (서비스 레이어 사용)
        InvoiceService.validate_invoice_cancellation(db, invoice, barobill_state)
        
        # 바로빌 취소 API 호출
        result = service.delete_tax_invoice(mgt_key)
        
        # 취소 실패 시
        if result < 0:
            error_msg = service.barobill.get_err_string(result) if hasattr(service, 'barobill') else f"취소 실패 (코드: {result})"
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"세금계산서 취소 실패: {error_msg}"
            )
        
        # DB 상태 업데이트 (서비스 레이어 사용)
        InvoiceService.update_invoice_after_cancel(
            db, current_user.id, mgt_key
        )
        
        return {
            "success": True,
            "result_code": result,
            "message": "세금계산서가 취소되었습니다."
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/corp-state/check", response_model=dict)
def check_corp_state(
    request: CorpStateCheckRequest,
    service: BaroBillInvoiceService = Depends(get_barobill_service),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """사업자 등록 상태 조회"""
    try:
        corp_num_clean = request.corp_num.replace("-", "").strip()
        
        # 바로빌 API 호출 (안전하게 속성 접근)
        cert_key = getattr(settings, 'BAROBILL_CERT_KEY', None)
        corp_num = getattr(settings, 'BAROBILL_CORP_NUM', None)
        if not cert_key or not corp_num:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="바로빌 API 인증키가 설정되지 않았습니다."
            )
        
        result = service.get_corp_state_ex(corp_num_clean)
        
        # 상태 설명 매핑 (서비스 레이어 사용)
        state_mapping = CorpStateService.get_state_mapping()
        state_value = result.get("state", 7)
        state_info = state_mapping.get(state_value, {"name": "알 수 없음", "description": "상태를 확인할 수 없습니다."})
        
        # 조회 이력 저장 및 사용 내역 기록 (로그인 사용자인 경우만)
        if current_user:
            # 무료 건수 및 결제수단 확인 (서비스 레이어 사용)
            CorpStateService.validate_user_quota(current_user)
            
            # 이력 저장 및 과금 처리 (서비스 레이어 사용)
            CorpStateService.save_corp_state_history(
                db=db,
                user=current_user,
                corp_num=corp_num_clean,
                state_value=state_value,
                state_info=state_info,
                corp_name=result.get("corp_name", ""),
                ceo_name=result.get("ceo_name", "")
            )
        
        return {
            "success": True,
            "data": result,
            "state_name": state_info["name"],
            "state_description": state_info["description"],
            "is_normal": result.get("is_normal", False),
        }
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        # -10002 오류는 인증 오류
        if "-10002" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="바로빌 API 인증 실패. 인증키와 사업자번호를 확인해주세요. 사용 중인 서버(테스트/실전)에 맞는 인증키가 필요합니다."
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )


@router.get("/corp-state/history/{corp_num}", response_model=dict)
def get_corp_state_history(
    corp_num: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """사업자 상태 조회 이력 조회 (최근 조회 날짜)"""
    if not current_user:
        return {"success": False, "message": "로그인이 필요합니다."}
    
    # 조회 이력 조회 (서비스 레이어 사용)
    return CorpStateService.get_corp_state_history(
        db, current_user.id, corp_num
    )

