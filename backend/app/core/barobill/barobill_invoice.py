"""
바로빌 세금계산서 관련 API 서비스
"""
from app.core.barobill.barobill_client import BaroBillService


class BaroBillInvoiceService(BaroBillService):
    """바로빌 세금계산서 관련 서비스"""

    def get_corp_state_ex(self, check_corp_num: str) -> dict:
        """
        사업자 등록 상태 조회

        Args:
            check_corp_num: 확인할 사업자번호 (하이픈 없이)

        Returns:
            사업자 상태 정보 딕셔너리
        """
        try:
            # 인증키 확인
            if not self.client.cert_key or not self.client.corp_num:
                raise Exception(
                    "바로빌 API 인증키 또는 사업자번호가 설정되지 않았습니다."
                )

            result = self.client.get_corp_state_client().service.GetCorpStateEx(
                CERTKEY=self.client.cert_key,
                CorpNum=self.client.corp_num,
                CheckCorpNum=check_corp_num,
            )

            if result.State < 0:  # 호출 실패
                # -10002는 인증 오류
                if result.State == -10002:
                    raise Exception(
                        f"바로빌 API 인증 실패 (코드: {result.State}). 인증키와 사업자번호를 확인해주세요."
                    )
                try:
                    error_msg = self.get_err_string(result.State)
                    raise Exception(
                        f"사업자 상태 조회 실패: {error_msg} (코드: {result.State})"
                    )
                except:
                    raise Exception(f"사업자 상태 조회 실패 (코드: {result.State})")

            # 결과를 딕셔너리로 변환
            state_name = result.StateName if hasattr(result, "StateName") else ""

            # 정상 여부 판단
            # 바로빌 API State 값 매핑:
            # 0 = 미등록
            # 1 = 정상 ← 정상 상태
            # 2 = 휴업
            # 3 = 폐업
            # 4 = 간이과세
            # 5 = 면세사업자
            # 6 = 기타(직권폐업 등)
            # 7 = 조회불가
            # State가 음수면 API 호출 오류
            is_normal = False
            state_value = result.State

            # State 값 매핑
            state_mapping = {
                0: "미등록",
                1: "정상",
                2: "휴업",
                3: "폐업",
                4: "간이과세",
                5: "면세사업자",
                6: "기타(직권폐업 등)",
                7: "조회불가",
            }

            state_description = state_mapping.get(
                state_value, f"알 수 없음({state_value})"
            )

            # StateName이 있는 경우 (빈 문자열이 아닌 경우)
            if state_name and str(state_name).strip():
                # StateName이 있으면 StateName 기준으로 판단
                state_name_str = str(state_name).strip()
                is_normal = "정상" in state_name_str or state_name_str == "정상"
            else:
                # StateName이 없거나 비어있으면 State 값으로 판단
                # State == 1이 정상
                is_normal = state_value == 1  # State == 1이 정상

            return {
                "state": result.State,
                "state_description": state_description,
                "corp_num": (
                    result.CorpNum if hasattr(result, "CorpNum") else check_corp_num
                ),
                "corp_name": result.CorpName if hasattr(result, "CorpName") else "",
                "ceo_name": result.CeoName if hasattr(result, "CeoName") else "",
                "corp_type": result.CorpType if hasattr(result, "CorpType") else "",
                "state_name": state_name,
                "is_normal": is_normal,
            }
        except Exception as e:
            raise

