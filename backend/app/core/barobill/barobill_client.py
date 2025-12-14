"""
바로빌 API 클라이언트 기본 클래스
"""
from zeep import Client
from typing import Optional


class BaroBillClient:
    """바로빌 API 클라이언트"""

    def __init__(self, cert_key: str, corp_num: str, use_test_server: bool = False):
        """
        바로빌 클라이언트 초기화

        Args:
            cert_key: 인증키
            corp_num: 사업자번호
            use_test_server: 테스트 서버 사용 여부 (기본값: False, 실전 서버 사용)
        """
        self.cert_key = cert_key
        self.corp_num = corp_num
        self.use_test_server = use_test_server

        # WSDL URL 설정
        if use_test_server:
            wsdl_url = "https://testws.baroservice.com/TI.asmx?WSDL"
            corp_state_wsdl_url = "https://testws.baroservice.com/CORPSTATE.asmx?WSDL"
        else:
            wsdl_url = "https://ws.baroservice.com/TI.asmx?WSDL"
            corp_state_wsdl_url = "https://ws.baroservice.com/CORPSTATE.asmx?WSDL"

        # SOAP 클라이언트 생성
        self.client = Client(wsdl_url)
        self.corp_state_client = Client(corp_state_wsdl_url)

    def get_common_client(self):
        """공통 API 클라이언트 반환"""
        return self.client

    def get_tax_invoice_client(self):
        """세금계산서 API 클라이언트 반환"""
        return self.client

    def get_corp_state_client(self):
        """사업자 상태 조회 API 클라이언트 반환"""
        return self.corp_state_client


class BaroBillService:
    """바로빌 서비스 기본 클래스"""

    def __init__(self, cert_key: str, corp_num: str, use_test_server: bool = False):
        self.client = BaroBillClient(cert_key, corp_num, use_test_server)

    def get_err_string(self, err_code: int) -> str:
        """
        오류 코드에 대한 오류 메시지 조회

        Args:
            err_code: 오류 코드

        Returns:
            오류 메시지
        """
        try:
            result = self.client.get_common_client().service.GetErrString(
                CERTKEY=self.client.cert_key,
                ErrCode=err_code,
            )
            return result
        except Exception as e:
            raise

