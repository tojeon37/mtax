from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.recipient import Recipient
from app.api.v1.auth import get_current_user
from app.schemas.recipient import RecipientCreate, RecipientUpdate, RecipientResponse

router = APIRouter()


@router.post("/recipients", response_model=RecipientResponse, status_code=status.HTTP_201_CREATED)
def create_recipient(
    recipient: RecipientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """거래처 생성"""
    try:
        # 중복 확인 (사용자별로 등록번호 중복 체크)
        existing = db.query(Recipient).filter(
            Recipient.user_id == current_user.id,
            Recipient.registration_number == recipient.registration_number
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 등록된 등록번호입니다."
            )
        
        db_recipient = Recipient(
            user_id=current_user.id,
            **recipient.model_dump()
        )
        db.add(db_recipient)
        db.commit()
        db.refresh(db_recipient)
        
        return db_recipient
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"거래처 생성 중 오류가 발생했습니다: {str(e)}"
        )


@router.get("/recipients", response_model=List[RecipientResponse])
def get_recipients(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """거래처 목록 조회"""
    recipients = db.query(Recipient).filter(
        Recipient.user_id == current_user.id
    ).offset(skip).limit(limit).all()
    return recipients


@router.get("/recipients/{recipient_id}", response_model=RecipientResponse)
def get_recipient(
    recipient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """거래처 조회"""
    recipient = db.query(Recipient).filter(
        Recipient.id == recipient_id,
        Recipient.user_id == current_user.id
    ).first()
    
    if not recipient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="거래처를 찾을 수 없습니다."
        )
    
    return recipient


@router.put("/recipients/{recipient_id}", response_model=RecipientResponse)
def update_recipient(
    recipient_id: int,
    recipient_update: RecipientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """거래처 수정"""
    recipient = db.query(Recipient).filter(
        Recipient.id == recipient_id,
        Recipient.user_id == current_user.id
    ).first()
    
    if not recipient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="거래처를 찾을 수 없습니다."
        )
    
    try:
        update_data = recipient_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(recipient, field, value)
        
        db.commit()
        db.refresh(recipient)
        
        return recipient
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"거래처 수정 중 오류가 발생했습니다: {str(e)}"
        )


@router.delete("/recipients/{recipient_id}", response_model=dict)
def delete_recipient(
    recipient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """거래처 삭제"""
    recipient = db.query(Recipient).filter(
        Recipient.id == recipient_id,
        Recipient.user_id == current_user.id
    ).first()
    
    if not recipient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="거래처를 찾을 수 없습니다."
        )
    
    try:
        db.delete(recipient)
        db.commit()
        
        return {"success": True, "message": "거래처가 삭제되었습니다."}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"거래처 삭제 중 오류가 발생했습니다: {str(e)}"
        )

