"""
결제수단 CRUD 함수
"""
from sqlalchemy.orm import Session
from app.models.payment_method import PaymentMethod, PaymentMethodType


def mask_card_number(number: str) -> str:
    """
    카드번호 마스킹 (뒷 4자리만 표시)
    
    Args:
        number: 카드번호 (하이픈 제거된 숫자만)
        
    Returns:
        마스킹된 카드번호 (예: ****1234)
    """
    # 숫자만 추출
    digits = ''.join(filter(str.isdigit, number))
    if len(digits) < 4:
        return "****" + digits
    return "****" + digits[-4:]


def mask_account_number(number: str) -> str:
    """
    계좌번호 마스킹 (뒷 4자리만 표시)
    
    Args:
        number: 계좌번호
        
    Returns:
        마스킹된 계좌번호 (예: ****2211)
    """
    # 숫자만 추출
    digits = ''.join(filter(str.isdigit, number))
    if len(digits) < 4:
        return "****" + digits
    return "****" + digits[-4:]


def create_payment_method(
    db: Session,
    user_id: int,
    method_type: PaymentMethodType,
    number: str,
    toss_billing_key: str = None
) -> PaymentMethod:
    """
    결제수단 등록
    
    Args:
        db: 데이터베이스 세션
        user_id: 사용자 ID
        method_type: 결제수단 유형
        number: 카드번호 또는 계좌번호
        toss_billing_key: 토스 billing_key (선택)
        
    Returns:
        생성된 PaymentMethod 객체
    """
    # 마스킹 처리
    if method_type == PaymentMethodType.CARD:
        masked_number = mask_card_number(number)
    else:
        masked_number = mask_account_number(number)
    
    # 기본 결제수단이 없으면 첫 번째를 기본으로 설정
    existing_default = db.query(PaymentMethod).filter(
        PaymentMethod.user_id == user_id,
        PaymentMethod.is_default == True
    ).first()
    
    is_default = existing_default is None
    
    # 더미 billing_key (향후 토스 연동 시 교체)
    billing_key = toss_billing_key or f"dummy-key-{user_id}-{method_type.value}"
    
    payment_method = PaymentMethod(
        user_id=user_id,
        method_type=method_type,
        masked_number=masked_number,
        provider="toss",
        toss_billing_key=billing_key,
        is_default=is_default
    )
    
    db.add(payment_method)
    db.commit()
    db.refresh(payment_method)
    
    return payment_method


def get_payment_methods(
    db: Session,
    user_id: int
) -> list[PaymentMethod]:
    """
    사용자의 결제수단 목록 조회
    
    Args:
        db: 데이터베이스 세션
        user_id: 사용자 ID
        
    Returns:
        PaymentMethod 리스트
    """
    return db.query(PaymentMethod).filter(
        PaymentMethod.user_id == user_id
    ).order_by(
        PaymentMethod.is_default.desc(),
        PaymentMethod.created_at.desc()
    ).all()


def set_default_payment_method(
    db: Session,
    payment_method_id: int,
    user_id: int
) -> PaymentMethod:
    """
    기본 결제수단 설정
    
    Args:
        db: 데이터베이스 세션
        payment_method_id: 결제수단 ID
        user_id: 사용자 ID
        
    Returns:
        업데이트된 PaymentMethod 객체
    """
    # 기존 기본 결제수단 해제
    db.query(PaymentMethod).filter(
        PaymentMethod.user_id == user_id,
        PaymentMethod.is_default == True
    ).update({"is_default": False})
    
    # 새 기본 결제수단 설정
    payment_method = db.query(PaymentMethod).filter(
        PaymentMethod.id == payment_method_id,
        PaymentMethod.user_id == user_id
    ).first()
    
    if not payment_method:
        raise ValueError("결제수단을 찾을 수 없습니다.")
    
    payment_method.is_default = True
    db.commit()
    db.refresh(payment_method)
    
    return payment_method


def delete_payment_method(
    db: Session,
    payment_method_id: int,
    user_id: int
) -> bool:
    """
    결제수단 삭제
    
    Args:
        db: 데이터베이스 세션
        payment_method_id: 결제수단 ID
        user_id: 사용자 ID
        
    Returns:
        삭제 성공 여부
    """
    payment_method = db.query(PaymentMethod).filter(
        PaymentMethod.id == payment_method_id,
        PaymentMethod.user_id == user_id
    ).first()
    
    if not payment_method:
        return False
    
    # 기본 결제수단이면 다른 결제수단을 기본으로 설정
    if payment_method.is_default:
        other_method = db.query(PaymentMethod).filter(
            PaymentMethod.user_id == user_id,
            PaymentMethod.id != payment_method_id
        ).first()
        
        if other_method:
            other_method.is_default = True
    
    db.delete(payment_method)
    db.commit()
    
    return True

