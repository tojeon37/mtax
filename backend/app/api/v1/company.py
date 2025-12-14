from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.company import Company
from app.api.v1.auth import get_current_user
from app.schemas.company import CompanyCreate, CompanyUpdate, CompanyResponse

router = APIRouter()


@router.post("/companies", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
def create_company(
    company: CompanyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """회사 생성"""
    try:
        # 중복 확인 (사용자별로 사업자번호 중복 체크)
        existing = db.query(Company).filter(
            Company.user_id == current_user.id,
            Company.business_number == company.business_number
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 등록된 사업자번호입니다."
            )
        
        db_company = Company(
            user_id=current_user.id,
            **company.model_dump()
        )
        db.add(db_company)
        db.commit()
        db.refresh(db_company)
        
        return db_company
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"회사 생성 중 오류가 발생했습니다: {str(e)}"
        )


@router.get("/companies", response_model=List[CompanyResponse])
def get_companies(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """회사 목록 조회"""
    companies = db.query(Company).filter(
        Company.user_id == current_user.id
    ).offset(skip).limit(limit).all()
    return companies


@router.get("/companies/{company_id}", response_model=CompanyResponse)
def get_company(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """회사 조회"""
    company = db.query(Company).filter(
        Company.id == company_id,
        Company.user_id == current_user.id
    ).first()
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="회사를 찾을 수 없습니다."
        )
    
    return company


@router.put("/companies/{company_id}", response_model=CompanyResponse)
def update_company(
    company_id: int,
    company_update: CompanyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """회사 수정"""
    company = db.query(Company).filter(
        Company.id == company_id,
        Company.user_id == current_user.id
    ).first()
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="회사를 찾을 수 없습니다."
        )
    
    try:
        update_data = company_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(company, field, value)
        
        db.commit()
        db.refresh(company)
        
        return company
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"회사 수정 중 오류가 발생했습니다: {str(e)}"
        )


@router.delete("/companies/{company_id}", response_model=dict)
def delete_company(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """회사 삭제"""
    company = db.query(Company).filter(
        Company.id == company_id,
        Company.user_id == current_user.id
    ).first()
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="회사를 찾을 수 없습니다."
        )
    
    try:
        db.delete(company)
        db.commit()
        
        return {"success": True, "message": "회사가 삭제되었습니다."}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"회사 삭제 중 오류가 발생했습니다: {str(e)}"
        )

