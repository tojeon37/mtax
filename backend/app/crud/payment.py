"""
결제 CRUD 함수
"""
from sqlalchemy.orm import Session
from decimal import Decimal
from datetime import datetime
from app.models.payment import Payment, PaymentMethod, PaymentStatus
from app.models.billing_cycle import BillingCycle, BillingCycleStatus


def register_payment(
    db: Session,
    billing_cycle_id: int,
    user_id: int,
    amount: Decimal,
    payment_method: PaymentMethod,
    transaction_id: str = None,
    status: PaymentStatus = PaymentStatus.SUCCESS
) -> Payment:
    """
    결제 기록 등록
    
    Args:
        db: 데이터베이스 세션
        billing_cycle_id: 청구 주기 ID
        user_id: 사용자 ID
        amount: 결제 금액
        payment_method: 결제 수단
        transaction_id: 거래 ID (선택)
        status: 결제 상태
        
    Returns:
        생성된 Payment 객체
    """
    # 결제 일시 (성공인 경우에만)
    paid_at = datetime.utcnow() if status == PaymentStatus.SUCCESS else None
    
    # 결제 기록 생성
    payment = Payment(
        billing_cycle_id=billing_cycle_id,
        user_id=user_id,
        amount=amount,
        payment_method=payment_method,
        transaction_id=transaction_id,
        paid_at=paid_at,
        status=status
    )
    
    db.add(payment)
    
    # 결제 성공 시 billing_cycle 상태 업데이트
    if status == PaymentStatus.SUCCESS:
        billing_cycle = db.query(BillingCycle).filter(
            BillingCycle.id == billing_cycle_id
        ).first()
        
        if billing_cycle:
            billing_cycle.status = BillingCycleStatus.PAID
    
    db.commit()
    db.refresh(payment)
    
    return payment


def get_payments(
    db: Session,
    user_id: int,
    billing_cycle_id: int = None,
    skip: int = 0,
    limit: int = 100
) -> list[Payment]:
    """
    결제 기록 조회
    
    Args:
        db: 데이터베이스 세션
        user_id: 사용자 ID
        billing_cycle_id: 청구 주기 ID (선택)
        skip: 건너뛸 개수
        limit: 최대 개수
        
    Returns:
        Payment 리스트
    """
    query = db.query(Payment).filter(Payment.user_id == user_id)
    
    if billing_cycle_id:
        query = query.filter(Payment.billing_cycle_id == billing_cycle_id)
    
    return query.order_by(Payment.created_at.desc()).offset(skip).limit(limit).all()

