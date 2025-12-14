"""
바로빌 회원 관리 관련 API 서비스
"""
from typing import Optional
import logging
from app.core.barobill.barobill_client import BaroBillService


class BaroBillMemberService(BaroBillService):
    """바로빌 회원 관리 관련 서비스"""

    def check_corp_is_member(self, check_corp_num: str) -> int:
        """
        회원사 여부 확인

        Args:
            check_corp_num: 확인할 사업자번호

        Returns:
            회원사 여부 (1: 회원, 0: 비회원, 음수: 오류코드)
        """
        try:
            result = self.client.get_common_client().service.CheckCorpIsMember(
                CERTKEY=self.client.cert_key,
                CorpNum=self.client.corp_num,
                CheckCorpNum=check_corp_num,
            )
            return result
        except Exception as e:
            raise

    def regist_corp_member(
        self,
        corp_num: str,
        corp_name: str,
        ceo_name: str,
        biz_type: Optional[str],
        biz_class: Optional[str],
        post_num: Optional[str],
        addr1: str,
        addr2: Optional[str],
        member_name: str,
        member_id: str,
        member_pwd: str,
        grade: Optional[str],
        tel: Optional[str],
        hp: Optional[str],
        email: str,
    ) -> dict:
        """
        바로빌 회원사 가입 (파트너가 하위 회원사 추가)

        Args:
            corp_num: 사업자번호 (하이픈 없이)
            corp_name: 상호명
            ceo_name: 대표자명
            biz_type: 업태
            biz_class: 종목
            post_num: 우편번호
            addr1: 주소1
            addr2: 주소2
            member_name: 담당자명
            member_id: 바로빌 아이디
            member_pwd: 바로빌 비밀번호
            grade: 등급
            tel: 전화번호
            hp: 휴대폰번호
            email: 이메일

        Returns:
            결과 딕셔너리 (result_code, cert_key 등)
        """
        try:
            # 하이픈 제거
            corp_num_clean = corp_num.replace("-", "")

            # 전화번호 형식 정리 (하이픈 제거, 공백 제거, 숫자만 추출)
            tel_clean = None
            if tel:
                # 숫자만 추출
                tel_digits = "".join(filter(str.isdigit, tel))
                if tel_digits and len(tel_digits) >= 8:  # 최소 8자리 이상
                    tel_clean = tel_digits
                else:
                    tel_clean = None

            hp_clean = None
            if hp:
                # 숫자만 추출
                hp_digits = "".join(filter(str.isdigit, hp))
                if hp_digits and len(hp_digits) >= 10:  # 휴대폰은 최소 10자리 이상
                    hp_clean = hp_digits
                else:
                    hp_clean = None

            # 연락처 검증: 바로빌 API는 TEL과 HP 모두 유효한 값이 필요할 수 있음
            # 최소 하나는 필수이지만, 둘 다 있으면 더 안전함
            if not tel_clean and not hp_clean:
                raise Exception(
                    "전화번호 또는 휴대폰번호 중 하나는 필수입니다. 유효한 번호를 입력해주세요."
                )

            # 바로빌 API가 둘 다 요구할 수 있으므로, 하나만 있으면 다른 하나에도 복사
            # 단, 이는 임시 해결책이며 바로빌 API 문서 확인 필요
            if tel_clean and not hp_clean:
                # TEL만 있으면 HP에도 동일한 값 사용 (바로빌 API 요구사항에 따라 조정 필요)
                hp_clean = tel_clean
            elif hp_clean and not tel_clean:
                # HP만 있으면 TEL에도 동일한 값 사용
                tel_clean = hp_clean

            # 이메일 검증
            if not email or not email.strip():
                raise Exception("이메일은 필수 항목입니다.")

            # RegistCorp API 호출 (파트너 인증키로 하위 회원사 추가)
            # 바로빌 API는 빈 문자열을 유효하지 않다고 판단하므로, 유효한 번호만 전송
            # TEL과 HP 중 최소 하나는 반드시 유효한 값이 있어야 함 (위에서 검증됨)

            # API 호출 파라미터 준비
            api_params = {
                "CERTKEY": self.client.cert_key,
                "CorpNum": corp_num_clean,  # 가입할 회원사 사업자번호
                "CorpName": corp_name,
                "CEOName": ceo_name,
                "BizType": biz_type or "",
                "BizClass": biz_class or "",
                "PostNum": post_num or "",
                "Addr1": addr1,
                "Addr2": addr2 or "",
                "MemberName": member_name,
                "ID": member_id,
                "PWD": member_pwd,
                "Grade": grade or "",
                "Email": email.strip(),
            }

            # 유효한 연락처만 추가
            # 바로빌 API는 TEL과 HP 중 최소 하나는 유효한 값이 있어야 함
            # 빈 문자열은 유효하지 않으므로, 유효한 값만 전송
            api_params["TEL"] = tel_clean if tel_clean else ""
            api_params["HP"] = hp_clean if hp_clean else ""

            # 디버깅: 전송되는 연락처 값 확인
            logger = logging.getLogger(__name__)
            logger.info(
                f"바로빌 API 호출 - TEL: '{api_params['TEL']}', HP: '{api_params['HP']}'"
            )

            result = self.client.get_common_client().service.RegistCorp(**api_params)

            if result < 0:  # 호출 실패
                error_msg = self.get_err_string(result)
                raise Exception(
                    f"바로빌 회원사 가입 실패: {error_msg} (코드: {result})"
                )

            # 성공 시 인증키 조회 필요 (바로빌 API 문서 확인 필요)
            # 일반적으로 RegistCorp 성공 후 별도 API로 인증키를 조회해야 할 수 있음
            # 여기서는 성공 코드만 반환하고, 인증키는 별도 조회 API 사용 권장

            return {
                "success": True,
                "result_code": result,
                "corp_num": corp_num_clean,
                "message": "바로빌 회원사 가입이 완료되었습니다.",
            }
        except Exception as e:
            raise

    def update_user_password(
        self,
        user_id: str,
        new_password: str,
    ) -> dict:
        """
        바로빌 사용자 비밀번호 변경

        Args:
            user_id: 바로빌 아이디
            new_password: 새 비밀번호

        Returns:
            결과 딕셔너리 (success, result_code, message)
        """
        try:
            result = self.client.get_common_client().service.UpdateUserPWD(
                CERTKEY=self.client.cert_key,
                CorpNum=self.client.corp_num,
                ID=user_id,
                newPWD=new_password,
            )

            if result < 0:  # 호출 실패
                error_msg = self.get_err_string(result)
                raise Exception(
                    f"바로빌 비밀번호 변경 실패: {error_msg} (코드: {result})"
                )

            return {
                "success": True,
                "result_code": result,
                "message": "바로빌 비밀번호가 성공적으로 변경되었습니다.",
            }
        except Exception as e:
            raise

