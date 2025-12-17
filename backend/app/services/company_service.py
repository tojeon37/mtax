"""
회사 관련 비즈니스 로직 서비스
"""

from typing import Optional
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
    def register_barobill_member(
        barobill_service: BaroBillMemberService, user_data: dict
    ) -> bool:
        """
        바로빌 회원사 가입

        Args:
            barobill_service: BaroBillService 인스턴스
            user_data: 사용자 데이터

        Returns:
            성공 여부
        """
        if (
            not user_data.get("business_no")
            or not user_data.get("company_name")
            or not user_data.get("email")
        ):
            return False

        try:
            # 사업자번호 하이픈 제거 및 검증
            corp_num_clean = user_data["business_no"].replace("-", "").strip()
            if not corp_num_clean or len(corp_num_clean) != 10:
                return False

            # 바로빌 회원사 가입
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

            return True
        except Exception:
            return False
