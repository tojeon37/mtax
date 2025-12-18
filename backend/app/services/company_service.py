"""
회사 관련 비즈니스 로직 서비스
"""

from typing import Optional, Tuple
from app.core.barobill import BaroBillMemberService
from app.core.config import settings


class CompanyService:
    """회사 관련 비즈니스 로직"""

    @staticmethod
    def get_barobill_partner_service() -> Optional[BaroBillMemberService]:
        """
        바로빌 파트너 서비스 의존성

        Returns:
            BaroBillMemberService 인스턴스 또는 None
        """
        # 안전하게 속성 접근 (속성이 없으면 None 반환)
        cert_key = getattr(settings, "BAROBILL_CERT_KEY", None)
        corp_num = getattr(settings, "BAROBILL_CORP_NUM", None)
        use_test_server = getattr(settings, "BAROBILL_USE_TEST_SERVER", False)

        if not cert_key or not corp_num:
            return None
        return BaroBillMemberService(
            cert_key=cert_key, corp_num=corp_num, use_test_server=use_test_server
        )

    @staticmethod
    def check_barobill_member_exists(
        barobill_service: BaroBillMemberService, business_no: str
    ) -> Tuple[bool, Optional[str]]:
        """
        바로빌에 회원이 이미 등록되어 있는지 확인

        Args:
            barobill_service: BaroBillMemberService 인스턴스
            business_no: 사업자번호

        Returns:
            (회원 존재 여부, 에러 메시지)
        """
        try:
            corp_num_clean = business_no.replace("-", "").strip()
            if not corp_num_clean or len(corp_num_clean) != 10:
                return False, None

            result = barobill_service.check_corp_is_member(corp_num_clean)
            
            if result == 1:  # 회원
                return True, None
            elif result == 0:  # 비회원
                return False, None
            else:  # 오류 코드
                error_msg = barobill_service.get_err_string(result)
                return False, f"바로빌 회원 확인 중 오류: {error_msg} (코드: {result})"
        except Exception as e:
            return False, f"바로빌 회원 확인 중 예외 발생: {str(e)}"

    @staticmethod
    def register_barobill_member(
        barobill_service: BaroBillMemberService, user_data: dict
    ) -> Tuple[bool, Optional[str]]:
        """
        바로빌 회원사 가입 또는 정보 업데이트

        Args:
            barobill_service: BaroBillService 인스턴스
            user_data: 사용자 데이터

        Returns:
            (성공 여부, 에러 메시지)
        """
        if (
            not user_data.get("business_no")
            or not user_data.get("company_name")
            or not user_data.get("email")
        ):
            return False, "필수 정보가 누락되었습니다."

        try:
            # 사업자번호 하이픈 제거 및 검증
            corp_num_clean = user_data["business_no"].replace("-", "").strip()
            if not corp_num_clean or len(corp_num_clean) != 10:
                return False, "유효하지 않은 사업자번호입니다."

            # 바로빌에 이미 회원이 있는지 확인
            is_member, check_error = CompanyService.check_barobill_member_exists(
                barobill_service, corp_num_clean
            )
            
            if check_error:
                return False, check_error
            
            if is_member:
                # 이미 회원인 경우 - 회원 정보 업데이트 시도
                try:
                    # 회사 정보 업데이트
                    barobill_service.update_corp_info(
                        corp_num=corp_num_clean,
                        corp_name=user_data.get("company_name")
                        or user_data.get("biz_name")
                        or "",
                        ceo_name=user_data.get("ceo_name") or "",
                        biz_type=user_data.get("biz_type") or "",
                        biz_class=user_data.get("biz_item") or "",
                        post_num="",
                        addr1=user_data.get("address") or "",
                        addr2="",
                    )
                    
                    # 사용자 정보 업데이트
                    barobill_service.update_user_info(
                        corp_num=corp_num_clean,
                        user_id=user_data["barobill_id"],
                        member_name=user_data.get("manager_name")
                        or user_data.get("ceo_name")
                        or "",
                        tel=user_data.get("tel") or "",
                        hp=user_data.get("manager_tel") or user_data.get("tel") or "",
                        email=user_data["email"],
                        grade="",
                    )
                    
                    # 비밀번호도 업데이트 시도 (실패해도 계속 진행)
                    try:
                        barobill_service.update_user_password(
                            user_id=user_data["barobill_id"],
                            new_password=user_data["password"],
                        )
                    except Exception:
                        pass  # 비밀번호 업데이트 실패해도 계속 진행
                    
                    return True, None  # 업데이트 성공
                except Exception as e:
                    error_msg = str(e)
                    # 업데이트 실패해도 우리 DB에는 등록 (바로빌 연동 없이)
                    return False, f"바로빌 회원 정보 업데이트 실패: {error_msg}"

            # 비회원인 경우 - 새로 가입
            barobill_service.regist_corp_member(
                corp_num=corp_num_clean,
                corp_name=user_data.get("company_name")
                or user_data.get("biz_name")
                or "",
                ceo_name=user_data.get("ceo_name") or "",
                biz_type=user_data.get("biz_type") or "",
                biz_class=user_data.get("biz_item") or "",
                post_num="",
                addr1=user_data.get("address") or "",
                addr2="",
                member_name=user_data.get("manager_name")
                or user_data.get("ceo_name")
                or "",
                member_id=user_data["barobill_id"],
                member_pwd=user_data["password"],
                grade="",
                tel=user_data.get("tel") or "",
                hp=user_data.get("manager_tel") or user_data.get("tel") or "",
                email=user_data["email"],
            )

            return True, None
        except Exception as e:
            error_msg = str(e)
            # 바로빌 API 에러 메시지에서 중복 가입 관련 메시지 확인
            if "이미" in error_msg or "중복" in error_msg or "등록" in error_msg:
                return False, f"바로빌에 이미 등록된 회원입니다: {error_msg}"
            return False, f"바로빌 회원가입 실패: {error_msg}"
