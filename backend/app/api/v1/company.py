from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.company import Company
from app.api.v1.auth import get_current_user
from app.schemas.company import CompanyCreate, CompanyUpdate, CompanyResponse

router = APIRouter()


@router.post(
    "/companies", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED
)
def create_company(
    company: CompanyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """회사 생성"""
    try:
        # 중복 확인 (사용자별로 사업자번호 중복 체크)
        existing = (
            db.query(Company)
            .filter(
                Company.user_id == current_user.id,
                Company.business_number == company.business_number,
            )
            .first()
        )

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 등록된 사업자번호입니다.",
            )

        db_company = Company(user_id=current_user.id, **company.model_dump())
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
            detail=f"회사 생성 중 오류가 발생했습니다: {str(e)}",
        )


@router.get("/companies", response_model=List[CompanyResponse])
def get_companies(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """회사 목록 조회"""
    companies = (
        db.query(Company)
        .filter(Company.user_id == current_user.id)
        .offset(skip)
        .limit(limit)
        .all()
    )
    return companies


@router.get("/companies/{company_id}", response_model=CompanyResponse)
def get_company(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """회사 조회"""
    company = (
        db.query(Company)
        .filter(Company.id == company_id, Company.user_id == current_user.id)
        .first()
    )

    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="회사를 찾을 수 없습니다."
        )

    return company


@router.put("/companies/{company_id}", response_model=CompanyResponse)
def update_company(
    company_id: int,
    company_update: CompanyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """회사 수정 및 바로빌 업데이트"""
    company = (
        db.query(Company)
        .filter(Company.id == company_id, Company.user_id == current_user.id)
        .first()
    )

    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="회사를 찾을 수 없습니다."
        )

    try:
        # DB 업데이트
        update_data = company_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(company, field, value)

        db.flush()

        # 바로빌 연동이 되어있는 경우 바로빌에도 업데이트
        barobill_update_success = False
        barobill_error = None

        if (
            current_user.barobill_linked
            and current_user.barobill_cert_key
            and current_user.barobill_corp_num
        ):
            try:
                from app.core.barobill.barobill_member import BaroBillMemberService
                from app.core.config import settings

                use_test_server = getattr(settings, "BAROBILL_USE_TEST_SERVER", False)

                barobill_service = BaroBillMemberService(
                    cert_key=current_user.barobill_cert_key,
                    corp_num=current_user.barobill_corp_num.replace("-", ""),
                    use_test_server=use_test_server,
                )

                # 회사 정보 업데이트 (제공된 경우에만)
                if (
                    company_update.name
                    or company_update.ceo_name
                    or company_update.address
                    or company_update.biz_type
                    or company_update.biz_class
                ):
                    barobill_service.update_corp_info(
                        corp_num=current_user.barobill_corp_num,
                        corp_name=company_update.name or company.name or "",
                        ceo_name=company_update.ceo_name or company.ceo_name or "",
                        biz_type=company_update.biz_type or company.biz_type or "",
                        biz_class=company_update.biz_class or company.biz_class or "",
                        post_num="",
                        addr1=company_update.address or company.address or "",
                        addr2="",
                    )

                # 사용자 정보 업데이트 (이메일, 연락처가 변경된 경우)
                if company_update.email or company_update.tel or company_update.hp:
                    barobill_service.update_user_info(
                        corp_num=current_user.barobill_corp_num,
                        user_id=current_user.barobill_id,
                        member_name=current_user.barobill_id,  # 담당자명은 사용자 ID 사용
                        tel=company_update.tel or company.tel or "",
                        hp=company_update.hp or company.hp or "",
                        email=company_update.email
                        or company.email
                        or current_user.email
                        or "",
                        grade="",
                    )

                barobill_update_success = True
            except Exception as e:
                import logging

                logger = logging.getLogger(__name__)
                logger.warning(f"바로빌 정보 업데이트 실패: {str(e)}")
                barobill_error = str(e)
                # 바로빌 업데이트 실패해도 우리 DB는 업데이트 진행

        db.commit()
        db.refresh(company)

        return company
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        import traceback

        error_detail = traceback.format_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"회사 수정 중 오류가 발생했습니다: {str(e)}",
        )


@router.delete("/companies/{company_id}", response_model=dict)
def delete_company(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """회사 삭제"""
    company = (
        db.query(Company)
        .filter(Company.id == company_id, Company.user_id == current_user.id)
        .first()
    )

    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="회사를 찾을 수 없습니다."
        )

    try:
        db.delete(company)
        db.commit()

        return {"success": True, "message": "회사가 삭제되었습니다."}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"회사 삭제 중 오류가 발생했습니다: {str(e)}",
        )
