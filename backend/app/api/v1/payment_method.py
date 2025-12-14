"""
결제수단 API
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.api.v1.auth import get_current_user
from app.schemas.payment_method import (
    PaymentMethodResponse,
    PaymentMethodCreate,
    PaymentMethodUpdate
)
from app.crud.payment_method import (
    create_payment_method,
    get_payment_methods,
    set_default_payment_method,
    delete_payment_method
)

router = APIRouter()


@router.post("", response_model=PaymentMethodResponse, status_code=status.HTTP_201_CREATED)
def register_payment_method(
    payment_data: PaymentMethodCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    결제수단 등록
    """
    try:
        payment_method = create_payment_method(
            db=db,
            user_id=current_user.id,
            method_type=payment_data.method_type,
            number=payment_data.number
        )
        
        # 결제수단 등록 성공 시 has_payment_method = True로 설정
        current_user.has_payment_method = True
        db.commit()
        db.refresh(current_user)
        
        return payment_method
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"결제수단 등록 실패: {str(e)}"
        )


@router.get("", response_model=list[PaymentMethodResponse])
def list_payment_methods(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    결제수단 목록 조회
    """
    methods = get_payment_methods(db=db, user_id=current_user.id)
    return methods


@router.patch("/{payment_method_id}/default", response_model=PaymentMethodResponse)
def set_default(
    payment_method_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    기본 결제수단 설정
    """
    try:
        payment_method = set_default_payment_method(
            db=db,
            payment_method_id=payment_method_id,
            user_id=current_user.id
        )
        return payment_method
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.delete("/{payment_method_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_payment_method(
    payment_method_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    결제수단 삭제
    """
    success = delete_payment_method(
        db=db,
        payment_method_id=payment_method_id,
        user_id=current_user.id
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="결제수단을 찾을 수 없습니다."
        )
    
    return None

