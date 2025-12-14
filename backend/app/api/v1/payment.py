"""
결제 API
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.api.v1.auth import get_current_user
from app.schemas.payment import PaymentResponse, PaymentCreate
from app.crud.payment import register_payment
from app.crud.billing import get_billing_cycle_by_id
from app.models.payment import PaymentStatus

router = APIRouter()


@router.post("/{billing_cycle_id}/pay", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def create_payment(
    billing_cycle_id: int,
    payment_data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    결제 처리
    
    Args:
        billing_cycle_id: 청구 주기 ID
        payment_data: 결제 정보
        db: 데이터베이스 세션
        current_user: 현재 사용자
        
    Returns:
        결제 기록
    """
    # 청구 주기 확인
    billing_cycle = get_billing_cycle_by_id(
        db=db,
        billing_cycle_id=billing_cycle_id,
        user_id=current_user.id
    )
    
    if not billing_cycle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="청구 주기를 찾을 수 없습니다."
        )
    
    # 결제 금액 검증
    if payment_data.amount != billing_cycle.total_bill_amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"결제 금액이 일치하지 않습니다. (청구 금액: {billing_cycle.total_bill_amount}원)"
        )
    
    # TODO: 실제 PG사 결제 처리 로직 추가 필요
    # 현재는 테스트용으로 즉시 성공 처리
    
    # 결제 기록 생성
    payment = register_payment(
        db=db,
        billing_cycle_id=billing_cycle_id,
        user_id=current_user.id,
        amount=payment_data.amount,
        payment_method=payment_data.payment_method,
        transaction_id=payment_data.transaction_id or f"TXN_{billing_cycle_id}_{current_user.id}",
        status=PaymentStatus.SUCCESS
    )
    
    return payment

