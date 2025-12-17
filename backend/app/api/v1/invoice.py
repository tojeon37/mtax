from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel
from typing import Optional, List
from app.db.session import get_db
from app.schemas.invoice import InvoiceCreate, InvoiceResponse
from app.models.invoice import Invoice
from app.models.user import User
from app.api.v1.auth import get_current_user
from app.services.tax_invoice import TaxInvoiceService
from app.core.config import settings

router = APIRouter()


@router.post(
    "/invoices", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED
)
def create_invoice(
    invoice: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    세금계산서 생성

    Args:
        invoice: 세금계산서 생성 정보
        db: 데이터베이스 세션
        current_user: 현재 로그인한 사용자 (JWT 인증)

    Returns:
        생성된 세금계산서 정보
    """
    # 세금계산서 생성 (status는 기본값 "대기"로 설정)
    # CREATED와 대기를 통합하여 사용자에게는 모두 "대기"로 표시
    db_invoice = Invoice(
        user_id=current_user.id,
        customer_name=invoice.customer_name,
        amount=invoice.amount,
        tax_type=invoice.tax_type,
        memo=invoice.memo,
        status="대기",
    )
    db.add(db_invoice)
    db.commit()
    db.refresh(db_invoice)

    return db_invoice


@router.get("/invoices", response_model=list[InvoiceResponse])
def get_invoices(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    세금계산서 목록 조회 (로그인 사용자만, 최신순)

    Args:
        skip: 건너뛸 레코드 수
        limit: 조회할 최대 레코드 수
        db: 데이터베이스 세션
        current_user: 현재 로그인한 사용자 (JWT 인증)

    Returns:
        세금계산서 목록 (최신순 정렬)
    """
    invoices = (
        db.query(Invoice)
        .filter(Invoice.user_id == current_user.id)
        .order_by(desc(Invoice.created_at))
        .offset(skip)
        .limit(limit)
        .all()
    )

    return invoices


def get_tax_invoice_service() -> TaxInvoiceService:
    """세금계산서 서비스 의존성"""
    return TaxInvoiceService()


@router.post("/invoices/check-status", response_model=dict)
def check_invoice_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    service: TaxInvoiceService = Depends(get_tax_invoice_service),
):
    """
    바로빌로 발행한 세금계산서의 상태를 체크하고 업데이트

    - "대기" 상태인 세금계산서 중 mgt_key가 있는 것만 체크
    - 바로빌 API로 상태 조회 후 홈택스 전송 완료 시 "완료"로 업데이트
    """
    try:
        # 바로빌 API 인증키 확인 (안전하게 속성 접근)
        cert_key = getattr(settings, 'BAROBILL_CERT_KEY', None)
        corp_num = getattr(settings, 'BAROBILL_CORP_NUM', None)
        if not cert_key or not corp_num:
            return {
                "success": False,
                "message": "바로빌 API 인증키가 설정되지 않았습니다.",
                "updated_count": 0,
            }

        # "대기" 상태이고 mgt_key가 있는 세금계산서 조회
        pending_invoices = (
            db.query(Invoice)
            .filter(
                Invoice.user_id == current_user.id,
                Invoice.status == "대기",
                Invoice.mgt_key.isnot(None),
                Invoice.mgt_key != "",
            )
            .all()
        )

        if not pending_invoices:
            return {
                "success": True,
                "message": "체크할 세금계산서가 없습니다.",
                "updated_count": 0,
            }

        # mgt_key 리스트 생성
        mgt_key_list = [
            invoice.mgt_key for invoice in pending_invoices if invoice.mgt_key
        ]

        if not mgt_key_list:
            return {
                "success": True,
                "message": "유효한 관리번호가 없습니다.",
                "updated_count": 0,
            }

        # 바로빌 API로 상태 조회
        try:
            states_result = service.get_tax_invoice_states(mgt_key_list)
        except Exception as e:
            return {
                "success": False,
                "message": f"바로빌 상태 조회 실패: {str(e)}",
                "updated_count": 0,
            }

        # 상태 업데이트
        updated_count = 0
        for state_info in states_result:
            mgt_key = state_info.get("MgtKey") or state_info.get("mgt_key")
            barobill_state = state_info.get("BarobillState") or state_info.get(
                "barobill_state"
            )

            if not mgt_key:
                continue

            # 바로빌 상태 값 확인
            # BarobillState 값:
            # 0: 발행 대기
            # 1: 발행 완료 (홈택스 전송 대기)
            # 2: 홈택스 전송 완료
            # 3: 홈택스 전송 실패
            # 4: 취소됨
            # 등등...

            # 홈택스 전송 완료 상태 확인 (2 또는 특정 값)
            # 바로빌 문서에 따르면 BarobillState가 2이면 홈택스 전송 완료
            if barobill_state == 2:
                # 해당 세금계산서 찾기
                invoice = (
                    db.query(Invoice)
                    .filter(
                        Invoice.user_id == current_user.id,
                        Invoice.mgt_key == mgt_key,
                        Invoice.status == "대기",
                    )
                    .first()
                )

                if invoice:
                    invoice.status = "완료"
                    updated_count += 1

        db.commit()

        return {
            "success": True,
            "message": f"{updated_count}건의 세금계산서 상태가 업데이트되었습니다.",
            "updated_count": updated_count,
            "checked_count": len(mgt_key_list),
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"상태 체크 중 오류 발생: {str(e)}",
        )


@router.get("/invoices/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    세금계산서 상세 조회

    Args:
        invoice_id: 세금계산서 ID
        db: 데이터베이스 세션
        current_user: 현재 로그인한 사용자 (JWT 인증)

    Returns:
        세금계산서 상세 정보

    Raises:
        HTTPException: 세금계산서를 찾을 수 없거나 권한이 없는 경우
    """
    invoice = (
        db.query(Invoice)
        .filter(Invoice.id == invoice_id)
        .filter(Invoice.user_id == current_user.id)
        .first()
    )

    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="세금계산서를 찾을 수 없습니다.",
        )

    return invoice


class InvoiceBarobillUpdate(BaseModel):
    """바로빌 발행 후 Invoice 업데이트 스키마"""

    invoice_id: int
    mgt_key: str
    status: str = "대기"  # 바로빌로 발행하면 "대기" 상태


@router.put("/invoices/{invoice_id}/barobill", response_model=InvoiceResponse)
def update_invoice_barobill(
    invoice_id: int,
    update_data: InvoiceBarobillUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    바로빌 발행 후 Invoice 업데이트 (mgt_key 저장 및 상태 변경)

    Args:
        invoice_id: 세금계산서 ID
        update_data: 업데이트 정보 (mgt_key, status)
        db: 데이터베이스 세션
        current_user: 현재 로그인한 사용자

    Returns:
        업데이트된 세금계산서 정보
    """
    invoice = (
        db.query(Invoice)
        .filter(Invoice.id == invoice_id)
        .filter(Invoice.user_id == current_user.id)
        .first()
    )

    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="세금계산서를 찾을 수 없습니다.",
        )

    # mgt_key와 상태 업데이트
    invoice.mgt_key = update_data.mgt_key
    invoice.status = update_data.status
    db.commit()
    db.refresh(invoice)

    return invoice


@router.delete("/invoices/{invoice_id}", response_model=dict)
def delete_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    세금계산서 삭제 (바로빌로 발행하지 않은 것만 삭제 가능)

    Args:
        invoice_id: 세금계산서 ID
        db: 데이터베이스 세션
        current_user: 현재 로그인한 사용자

    Returns:
        삭제 결과

    Raises:
        HTTPException: 세금계산서를 찾을 수 없거나 권한이 없는 경우, 또는 바로빌로 발행한 경우
    """
    invoice = (
        db.query(Invoice)
        .filter(Invoice.id == invoice_id)
        .filter(Invoice.user_id == current_user.id)
        .first()
    )

    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="세금계산서를 찾을 수 없습니다.",
        )

    # 바로빌로 발행한 세금계산서는 삭제 불가 (취소만 가능)
    if invoice.mgt_key and invoice.mgt_key != '':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="바로빌로 발행한 세금계산서는 삭제할 수 없습니다. 취소 기능을 사용해주세요.",
        )

    # 완료 상태인 세금계산서는 삭제 불가
    if invoice.status == "완료":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="완료된 세금계산서는 삭제할 수 없습니다.",
        )

    try:
        db.delete(invoice)
        db.commit()
        return {
            "success": True,
            "message": "세금계산서가 삭제되었습니다."
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"세금계산서 삭제 중 오류가 발생했습니다: {str(e)}",
        )
