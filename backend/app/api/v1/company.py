from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from datetime import datetime
import logging
import re
from app.db.session import get_db
from app.models.user import User
from app.models.company import Company
from app.api.v1.auth import get_current_user
from app.schemas.company import CompanyCreate, CompanyUpdate, CompanyResponse
from app.services.company_service import CompanyService
from app.core.barobill.barobill_member import BaroBillMemberService
from app.core.barobill.barobill_invoice import BaroBillInvoiceService
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


def normalize_string(text: str) -> str:
    """
    문자열 정규화 (공백, 괄호, 특수문자 제거)
    
    Args:
        text: 정규화할 문자열
        
    Returns:
        정규화된 문자열
    """
    if not text:
        return ""
    # 공백 제거
    normalized = text.replace(" ", "")
    # 괄호 및 내용 제거
    normalized = re.sub(r'\([^)]*\)', '', normalized)
    normalized = re.sub(r'\[[^\]]*\]', '', normalized)
    normalized = re.sub(r'\{[^}]*\}', '', normalized)
    # 특수문자 제거 (한글, 영문, 숫자만 남김)
    normalized = re.sub(r'[^\w가-힣]', '', normalized)
    return normalized


def validate_company_info_match(
    our_company: Company,
    barobill_info: dict
) -> Tuple[bool, Optional[str]]:
    """
    우리 서비스 회사 정보와 바로빌 사업자 정보 정합성 검증
    
    Args:
        our_company: 우리 서비스의 회사 정보
        barobill_info: 바로빌에서 조회한 사업자 정보
        
    Returns:
        (정합성 일치 여부, 불일치 사유)
    """
    # 사업자번호 완전 일치 확인
    our_corp_num = our_company.business_number.replace("-", "").strip()
    barobill_corp_num = barobill_info.get("corp_num", "").replace("-", "").strip()
    
    if our_corp_num != barobill_corp_num:
        return False, f"사업자번호 불일치: 우리({our_corp_num}) vs 바로빌({barobill_corp_num})"
    
    # 상호명 정규화 후 일치 확인
    our_name = normalize_string(our_company.name)
    barobill_name = normalize_string(barobill_info.get("corp_name", ""))
    
    if our_name != barobill_name:
        return False, f"상호명 불일치: 우리({our_company.name}) vs 바로빌({barobill_info.get('corp_name', '')})"
    
    # 대표자명 정규화 후 일치 확인
    our_ceo = normalize_string(our_company.ceo_name)
    barobill_ceo = normalize_string(barobill_info.get("ceo_name", ""))
    
    if our_ceo != barobill_ceo:
        return False, f"대표자명 불일치: 우리({our_company.ceo_name}) vs 바로빌({barobill_info.get('ceo_name', '')})"
    
    # 주소는 참고용이므로 불일치해도 실패 사유로 삼지 않음
    return True, None


def link_company_to_barobill(
    company: Company,
    user: User,
    db: Session
) -> Tuple[bool, Optional[str]]:
    """
    회사 정보를 바로빌에 연동
    
    Args:
        company: 회사 정보
        user: 사용자 정보
        db: 데이터베이스 세션
        
    Returns:
        (연동 성공 여부, 실패 사유 또는 성공 메시지)
    """
    # 바로빌 파트너 설정 확인
    if not settings.is_barobill_configured():
        return False, "바로빌 파트너 인증키가 설정되지 않았습니다."
    
    try:
        # 파트너 서비스 생성
        partner_service = CompanyService.get_barobill_partner_service()
        if not partner_service:
            return False, "바로빌 파트너 서비스를 생성할 수 없습니다."
        
        # 사업자번호 정리
        corp_num_clean = company.business_number.replace("-", "").strip()
        if not corp_num_clean or len(corp_num_clean) != 10:
            return False, "유효하지 않은 사업자번호입니다."
        
        # 필수 정보 확인
        if not company.name or not company.ceo_name or not company.email:
            return False, "회사명, 대표자명, 이메일은 필수 항목입니다."
        
        # 연락처 검증
        tel_digits = "".join(filter(str.isdigit, company.tel)) if company.tel else ""
        hp_digits = "".join(filter(str.isdigit, company.hp)) if company.hp else ""
        
        if not tel_digits and not hp_digits:
            return False, "전화번호 또는 휴대폰번호 중 하나는 필수입니다."
        
        if tel_digits and len(tel_digits) < 8:
            return False, "전화번호가 너무 짧습니다."
        
        if hp_digits and len(hp_digits) < 10:
            return False, "휴대폰번호가 너무 짧습니다."
        
        # 바로빌 회원사 가입 시도
        # 주의: regist_corp_member는 평문 비밀번호가 필요하지만,
        # 이미 등록된 사업자의 경우 조회만 하면 되므로 비밀번호 없이도 처리 가능
        # 신규 등록 시에는 비밀번호가 필요하므로 실패 처리
        try:
            # 사용자의 기존 비밀번호 해시는 사용할 수 없으므로,
            # 바로빌 API 호출 시 기본 비밀번호 사용 (실제로는 사용자 입력 필요)
            # 하지만 이미 등록된 사업자의 경우 조회만 하면 되므로 기본 비밀번호 사용
            # 실제 운영 환경에서는 사용자에게 비밀번호를 요청해야 함
            default_password = user.barobill_id  # 기본 비밀번호로 바로빌 아이디 사용 (임시)
            
            barobill_result = partner_service.regist_corp_member(
                corp_num=corp_num_clean,
                corp_name=company.name,
                ceo_name=company.ceo_name,
                biz_type=company.biz_type or "",
                biz_class=company.biz_class or "",
                post_num="",
                addr1=company.address,
                addr2="",
                member_name=company.ceo_name,
                member_id=user.barobill_id,
                member_pwd=default_password,  # 기본 비밀번호 (실제로는 사용자 입력 필요)
                grade="",
                tel=company.tel or "",
                hp=company.hp or "",
                email=company.email,
            )
            
            result_code = barobill_result.get("result_code")
            
            # (1) 신규 등록 성공
            if result_code == 0:
                company.barobill_linked = True
                company.barobill_linked_at = datetime.now()
                company.barobill_linked_reason = "바로빌 신규 등록 성공"
                db.commit()
                return True, "바로빌 연동이 완료되었습니다."
            
            # (2) 이미 등록된 사업자 응답
            elif result_code == -32000:
                # 바로빌 사업자 정보 조회 API 호출
                try:
                    # 파트너 인증키로 사업자 정보 조회
                    invoice_service = BaroBillInvoiceService(
                        cert_key=settings.BAROBILL_CERT_KEY,
                        corp_num=settings.BAROBILL_CORP_NUM,
                        use_test_server=getattr(settings, "BAROBILL_USE_TEST_SERVER", False)
                    )
                    
                    barobill_info = invoice_service.get_corp_state_ex(corp_num_clean)
                    
                    # 정합성 검증
                    is_match, mismatch_reason = validate_company_info_match(
                        company, barobill_info
                    )
                    
                    if is_match:
                        # 정합성 일치 - 연동 완료
                        company.barobill_linked = True
                        company.barobill_linked_at = datetime.now()
                        company.barobill_linked_reason = "바로빌에 이미 등록된 사업자 (정보 일치)"
                        db.commit()
                        return True, "바로빌 연동이 완료되었습니다."
                    else:
                        # 정합성 불일치 - 연동 실패
                        company.barobill_linked = False
                        company.barobill_linked_reason = f"정보 불일치: {mismatch_reason}"
                        db.commit()
                        return False, f"바로빌에 등록된 사업자 정보와 입력하신 회사 정보가 일치하지 않습니다. {mismatch_reason} 상호명 또는 대표자명을 확인해주세요."
                
                except Exception as query_error:
                    # 사업자 정보 조회 실패
                    logger.error(f"바로빌 사업자 정보 조회 실패: {str(query_error)}")
                    company.barobill_linked = False
                    company.barobill_linked_reason = f"사업자 정보 조회 실패: {str(query_error)}"
                    db.commit()
                    return False, f"바로빌 사업자 정보 조회 중 오류가 발생했습니다: {str(query_error)}"
            
            # (3) 기타 오류
            else:
                error_msg = barobill_result.get("message", f"바로빌 연동 실패 (코드: {result_code})")
                company.barobill_linked = False
                company.barobill_linked_reason = error_msg
                db.commit()
                logger.error(f"바로빌 연동 실패: {error_msg}")
                return False, f"바로빌 연동 중 오류가 발생했습니다: {error_msg}"
        
        except Exception as barobill_error:
            # 바로빌 API 호출 실패
            error_msg = str(barobill_error)
            company.barobill_linked = False
            company.barobill_linked_reason = f"바로빌 API 호출 실패: {error_msg}"
            db.commit()
            logger.error(f"바로빌 API 호출 실패: {error_msg}")
            return False, f"바로빌 연동 중 오류가 발생했습니다: {error_msg}"
    
    except Exception as e:
        logger.error(f"바로빌 연동 처리 중 예외 발생: {str(e)}")
        return False, f"바로빌 연동 처리 중 오류가 발생했습니다: {str(e)}"


@router.post(
    "/companies", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED
)
def create_company(
    company: CompanyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    회사 생성 및 바로빌 연동
    
    회사 정보를 저장하고 바로빌 연동을 시도합니다.
    - 신규 등록 성공: 바로빌 연동 완료
    - 이미 등록된 사업자: 사업자 정보 조회 후 정합성 검증
    - 정합성 일치: 바로빌 연동 완료
    - 정합성 불일치: 바로빌 연동 실패 (발행 차단)
    """
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

        # 회사 정보 저장
        db_company = Company(user_id=current_user.id, **company.model_dump())
        db.add(db_company)
        db.flush()  # commit 전에 ID를 얻기 위해 flush
        
        # 바로빌 연동 시도
        # 주의: regist_corp_member는 비밀번호가 필요하지만,
        # 이미 등록된 사업자의 경우 조회만 하면 되므로 비밀번호 없이도 처리 가능
        # 신규 등록 시에는 비밀번호가 필요하므로, 이 경우 연동 실패로 처리
        try:
            # 바로빌 연동 시도 (비밀번호 없이 시도, 실패 시 조회로 대체)
            link_success, link_message = link_company_to_barobill(
                db_company, current_user, db
            )
            
            if not link_success:
                # 연동 실패 시에도 회사 정보는 저장 (나중에 재시도 가능)
                logger.warning(f"회사 정보 저장 성공, 바로빌 연동 실패: {link_message}")
                # 연동 실패 사유는 이미 DB에 저장됨
        except Exception as link_error:
            # 바로빌 연동 실패해도 회사 정보는 저장
            logger.error(f"바로빌 연동 처리 중 예외: {str(link_error)}")
            db_company.barobill_linked = False
            db_company.barobill_linked_reason = f"연동 처리 중 예외: {str(link_error)}"
        
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
        # UpdateCorpInfo는 파트너가 하위 회원사 정보를 수정하는 API이므로 파트너 서비스를 사용해야 함
        barobill_update_success = False
        barobill_error = None

        if current_user.barobill_linked:
            # 파트너 서비스 가져오기
            partner_service = CompanyService.get_barobill_partner_service()

            if partner_service:
                try:
                    # 수정할 회원사의 사업자번호 (company.business_number 사용)
                    target_corp_num = company.business_number.replace("-", "").strip()

                    if not target_corp_num or len(target_corp_num) != 10:
                        raise Exception("유효하지 않은 사업자번호입니다.")

                    # 회사 정보 업데이트 (제공된 경우에만)
                    if (
                        company_update.name
                        or company_update.ceo_name
                        or company_update.address
                        or company_update.biz_type
                        or company_update.biz_class
                    ):
                        partner_service.update_corp_info(
                            corp_num=target_corp_num,  # 수정할 회원사 사업자번호
                            corp_name=company_update.name or company.name or "",
                            ceo_name=company_update.ceo_name or company.ceo_name or "",
                            biz_type=company_update.biz_type or company.biz_type or "",
                            biz_class=company_update.biz_class
                            or company.biz_class
                            or "",
                            post_num="",
                            addr1=company_update.address or company.address or "",
                            addr2="",
                        )

                    # 사용자 정보 업데이트 (이메일, 연락처가 변경된 경우)
                    if company_update.email or company_update.tel or company_update.hp:
                        partner_service.update_user_info(
                            corp_num=target_corp_num,  # 수정할 회원사 사업자번호
                            user_id=current_user.barobill_id,
                            member_name=current_user.barobill_id,
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
