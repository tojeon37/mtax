from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.client import Client
from app.api.v1.auth import get_current_user
from app.schemas.client import ClientCreate, ClientUpdate, ClientResponse

router = APIRouter()


@router.post("/clients", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
def create_client(
    client: ClientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """거래처 생성"""
    try:
        # 중복 확인 (사용자별로 사업자번호 중복 체크)
        existing = db.query(Client).filter(
            Client.user_id == current_user.id,
            Client.business_number == client.business_number
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 등록된 사업자번호입니다."
            )
        
        db_client = Client(
            user_id=current_user.id,
            **client.model_dump()
        )
        db.add(db_client)
        db.commit()
        db.refresh(db_client)
        
        return db_client
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"거래처 생성 중 오류가 발생했습니다: {str(e)}"
        )


@router.get("/clients", response_model=List[ClientResponse])
def get_clients(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """거래처 목록 조회"""
    try:
        clients = db.query(Client).filter(
            Client.user_id == current_user.id
        ).offset(skip).limit(limit).all()
        return clients
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"거래처 목록 조회 중 오류가 발생했습니다: {str(e)}"
        )


@router.get("/clients/{client_id}", response_model=ClientResponse)
def get_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """거래처 조회"""
    client = db.query(Client).filter(
        Client.id == client_id,
        Client.user_id == current_user.id
    ).first()
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="거래처를 찾을 수 없습니다."
        )
    
    return client


@router.put("/clients/{client_id}", response_model=ClientResponse)
def update_client(
    client_id: int,
    client_update: ClientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """거래처 수정"""
    client = db.query(Client).filter(
        Client.id == client_id,
        Client.user_id == current_user.id
    ).first()
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="거래처를 찾을 수 없습니다."
        )
    
    try:
        update_data = client_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(client, field, value)
        
        db.commit()
        db.refresh(client)
        
        return client
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"거래처 수정 중 오류가 발생했습니다: {str(e)}"
        )


@router.delete("/clients/{client_id}", response_model=dict)
def delete_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """거래처 삭제"""
    client = db.query(Client).filter(
        Client.id == client_id,
        Client.user_id == current_user.id
    ).first()
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="거래처를 찾을 수 없습니다."
        )
    
    try:
        db.delete(client)
        db.commit()
        
        return {"success": True, "message": "거래처가 삭제되었습니다."}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"거래처 삭제 중 오류가 발생했습니다: {str(e)}"
        )

