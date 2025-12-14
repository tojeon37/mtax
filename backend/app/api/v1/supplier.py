from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.supplier import Supplier
from app.api.v1.auth import get_current_user
from app.schemas.supplier import SupplierCreate, SupplierUpdate, SupplierResponse

router = APIRouter()


@router.post("/suppliers", response_model=SupplierResponse, status_code=status.HTTP_201_CREATED)
def create_supplier(
    supplier: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """공급자 생성"""
    try:
        # 중복 확인 (사용자별로 등록번호 중복 체크)
        existing = db.query(Supplier).filter(
            Supplier.user_id == current_user.id,
            Supplier.registration_number == supplier.registration_number
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 등록된 등록번호입니다."
            )
        
        db_supplier = Supplier(
            user_id=current_user.id,
            **supplier.model_dump()
        )
        db.add(db_supplier)
        db.commit()
        db.refresh(db_supplier)
        
        return db_supplier
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"공급자 생성 중 오류가 발생했습니다: {str(e)}"
        )


@router.get("/suppliers", response_model=List[SupplierResponse])
def get_suppliers(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """공급자 목록 조회"""
    suppliers = db.query(Supplier).filter(
        Supplier.user_id == current_user.id
    ).offset(skip).limit(limit).all()
    return suppliers


@router.get("/suppliers/{supplier_id}", response_model=SupplierResponse)
def get_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """공급자 조회"""
    supplier = db.query(Supplier).filter(
        Supplier.id == supplier_id,
        Supplier.user_id == current_user.id
    ).first()
    
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="공급자를 찾을 수 없습니다."
        )
    
    return supplier


@router.put("/suppliers/{supplier_id}", response_model=SupplierResponse)
def update_supplier(
    supplier_id: int,
    supplier_update: SupplierUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """공급자 수정"""
    supplier = db.query(Supplier).filter(
        Supplier.id == supplier_id,
        Supplier.user_id == current_user.id
    ).first()
    
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="공급자를 찾을 수 없습니다."
        )
    
    try:
        update_data = supplier_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(supplier, field, value)
        
        db.commit()
        db.refresh(supplier)
        
        return supplier
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"공급자 수정 중 오류가 발생했습니다: {str(e)}"
        )


@router.delete("/suppliers/{supplier_id}", response_model=dict)
def delete_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """공급자 삭제"""
    supplier = db.query(Supplier).filter(
        Supplier.id == supplier_id,
        Supplier.user_id == current_user.id
    ).first()
    
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="공급자를 찾을 수 없습니다."
        )
    
    try:
        db.delete(supplier)
        db.commit()
        
        return {"success": True, "message": "공급자가 삭제되었습니다."}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"공급자 삭제 중 오류가 발생했습니다: {str(e)}"
        )

