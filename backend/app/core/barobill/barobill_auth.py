"""
바로빌 인증 관련 API 서비스
"""
import re
from app.core.barobill.barobill_client import BaroBillService


class BaroBillAuthService(BaroBillService):
    """바로빌 인증 관련 서비스"""

    def check_cert_is_valid(self, member_id: str = None, member_pwd: str = None) -> dict:
        """
        인증서 유효성 확인 (비밀번호 불필요)
        
        바로빌 API의 CheckCERTIsValid는 인증키와 사업자번호만으로 호출 가능합니다.

        Args:
            member_id: 바로빌 회원사 아이디 (선택사항, 사용하지 않음)
            member_pwd: 바로빌 회원사 비밀번호 (선택사항, 사용하지 않음)

        Returns:
            인증서 유효성 확인 결과 딕셔너리
        """
        try:
            result = self.client.get_common_client().service.CheckCERTIsValid(
                CERTKEY=self.client.cert_key,
                CorpNum=self.client.corp_num,
            )

            # result가 음수면 오류 코드, 양수면 유효한 인증서
            if result < 0:
                # 오류 코드에 대한 메시지 조회
                try:
                    error_msg = self.get_err_string(result)
                    return {
                        "is_valid": False,
                        "result_code": result,
                        "error_message": error_msg,
                        "message": f"인증서 확인 실패: {error_msg} (코드: {result})",
                    }
                except:
                    return {
                        "is_valid": False,
                        "result_code": result,
                        "error_message": None,
                        "message": f"인증서 확인 실패 (코드: {result})",
                    }
            else:
                # result가 양수면 유효한 인증서
                return {
                    "is_valid": True,
                    "result_code": result,
                    "error_message": None,
                    "message": "인증서가 유효합니다.",
                }
        except Exception as e:
            raise
    
    def get_certificate_status(self) -> dict:
        """
        인증서 등록 상태 조회 (비밀번호 불필요)
        
        바로빌 API를 통해 인증서 등록 여부 및 발행 가능 여부를 확인합니다.
        
        Returns:
            {
                "certificate_registered": bool,
                "can_issue_invoice": bool,
                "status_message": str,
                "raw_barobill_response": dict
            }
        """
        try:
            # CheckCERTIsValid API 호출
            cert_check_result = self.check_cert_is_valid()
            
            # 인증서 유효성 확인 결과
            is_valid = cert_check_result.get("is_valid", False)
            result_code = cert_check_result.get("result_code")
            error_message = cert_check_result.get("error_message")
            
            # 인증서 등록 여부 판단
            certificate_registered = is_valid
            
            # 발행 가능 여부 판단 (인증서가 유효하면 발행 가능)
            can_issue_invoice = is_valid
            
            # 상태 메시지 생성
            if certificate_registered:
                status_message = "인증서가 등록되어 있습니다."
            else:
                if error_message:
                    status_message = f"인증서 미등록: {error_message}"
                else:
                    status_message = "인증서가 등록되지 않았습니다."
            
            return {
                "certificate_registered": certificate_registered,
                "can_issue_invoice": can_issue_invoice,
                "status_message": status_message,
                "raw_barobill_response": {
                    "result_code": result_code,
                    "error_message": error_message,
                    "is_valid": is_valid,
                }
            }
        except Exception as e:
            # API 호출 실패 시 인증서 미등록으로 간주
            error_msg = str(e)
            return {
                "certificate_registered": False,
                "can_issue_invoice": False,
                "status_message": f"인증서 상태 확인 실패: {error_msg}",
                "raw_barobill_response": {
                    "error": error_msg
                }
            }

    def get_certificate_regist_url(self, member_id: str, member_pwd: str) -> dict:
        """
        인증서 등록 URL 조회

        Args:
            member_id: 바로빌 회원사 아이디
            member_pwd: 바로빌 회원사 비밀번호

        Returns:
            인증서 등록 URL 딕셔너리
        """
        try:
            result = self.client.get_common_client().service.GetCertificateRegistURL(
                CERTKEY=self.client.cert_key,
                CorpNum=self.client.corp_num,
                ID=member_id,
                PWD=member_pwd,
            )

            # 오류 코드 패턴 확인 (예: -10002)
            if re.compile("^-[0-9]{5}$").match(str(result)) is not None:
                # 오류 코드에 대한 메시지 조회
                try:
                    error_code = int(result)
                    error_msg = self.get_err_string(error_code)
                    return {
                        "success": False,
                        "url": None,
                        "result_code": error_code,
                        "error_message": error_msg,
                        "message": f"인증서 등록 URL 조회 실패: {error_msg} (코드: {error_code})",
                    }
                except:
                    return {
                        "success": False,
                        "url": None,
                        "result_code": result,
                        "error_message": None,
                        "message": f"인증서 등록 URL 조회 실패 (코드: {result})",
                    }
            else:
                # 성공 시 URL 반환
                return {
                    "success": True,
                    "url": str(result),
                    "result_code": None,
                    "error_message": None,
                    "message": "인증서 등록 URL을 조회했습니다.",
                }
        except Exception as e:
            raise

