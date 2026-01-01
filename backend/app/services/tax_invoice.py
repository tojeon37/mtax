from typing import Optional, List, Dict, Any
from app.core.barobill import BaroBillService
from app.core.config import settings


class TaxInvoiceService:
    """세금계산서 서비스"""

    def __init__(self, cert_key: Optional[str] = None, corp_num: Optional[str] = None):
        """
        세금계산서 서비스 초기화

        Args:
            cert_key: 인증키 (없으면 설정에서 가져옴)
            corp_num: 사업자번호 (없으면 설정에서 가져옴)
        """
        # 안전하게 속성 접근 (속성이 없으면 기본값 사용)
        self.cert_key = cert_key or getattr(settings, "BAROBILL_CERT_KEY", None)
        self.corp_num = corp_num or getattr(settings, "BAROBILL_CORP_NUM", None)
        use_test_server = getattr(settings, "BAROBILL_USE_TEST_SERVER", False)

        # 설정에서 테스트 서버 사용 여부 가져오기
        self.barobill = BaroBillService(
            cert_key=self.cert_key,
            corp_num=self.corp_num,
            use_test_server=use_test_server,
        )
        self.client = self.barobill.client.get_tax_invoice_client()

    def get_tax_invoice(self, mgt_key: str) -> Dict[str, Any]:
        """
        세금계산서 조회 (조회용, 실제 HTTP 요청)

        Args:
            mgt_key: 관리번호

        Returns:
            세금계산서 정보
        """
        # 조회용이지만 실제 HTTP 요청을 보내므로 검증 필요
        if not settings.is_barobill_configured():
            raise RuntimeError(
                "바로빌 API 호출 실패: 바로빌 인증키가 설정되지 않았습니다."
            )
        
        try:
            result = self.client.service.GetTaxInvoice(
                CERTKEY=self.cert_key,
                CorpNum=self.corp_num,
                MgtKey=mgt_key,
            )

            if result.TaxInvoiceType < 0:  # 호출 실패
                error_msg = self.barobill.get_err_string(result.TaxInvoiceType)
                raise Exception(
                    f"세금계산서 조회 실패: {error_msg} (코드: {result.TaxInvoiceType})"
                )

            # 결과를 딕셔너리로 변환
            return self._convert_to_dict(result)
        except Exception as e:
            raise

    def get_tax_invoice_states(self, mgt_key_list: List[str]) -> List[Dict[str, Any]]:
        """
        세금계산서 상태 조회 (복수, 조회용, 실제 HTTP 요청)

        Args:
            mgt_key_list: 관리번호 리스트

        Returns:
            세금계산서 상태 리스트
        """
        # 조회용이지만 실제 HTTP 요청을 보내므로 검증 필요
        if not settings.is_barobill_configured():
            raise RuntimeError(
                "바로빌 API 호출 실패: 바로빌 인증키가 설정되지 않았습니다."
            )
        
        try:
            array_type = self.client.get_type("ns0:ArrayOfString")
            result = self.client.service.GetTaxInvoiceStatesEX(
                CERTKEY=self.cert_key,
                CorpNum=self.corp_num,
                MgtKeyList=array_type(mgt_key_list),
            )

            if (
                len(result) == 1
                and result[0].MgtKey is None
                and result[0].BarobillState < 0
            ):
                error_msg = self.barobill.get_err_string(result[0].BarobillState)
                raise Exception(
                    f"세금계산서 상태 조회 실패: {error_msg} (코드: {result[0].BarobillState})"
                )

            return [self._convert_to_dict(state) for state in result]
        except Exception as e:
            raise

    def regist_tax_invoice(
        self, invoice_data: Dict[str, Any], issue_timing: int = 1
    ) -> str:
        """
        세금계산서 등록 (실제 HTTP 요청)

        Args:
            invoice_data: 세금계산서 데이터
            issue_timing: 발행시점 (1: 즉시발행, 2: 발행예약)

        Returns:
            관리번호
        """
        # 실제 바로빌 서버로 HTTP 요청을 보내므로 검증 필요
        settings.validate_barobill()
        
        try:
            # TaxInvoice 타입 생성
            tax_invoice = self._create_tax_invoice_object(invoice_data)

            result = self.client.service.RegistTaxInvoiceEX(
                CERTKEY=self.cert_key,
                CorpNum=self.corp_num,
                Invoice=tax_invoice,
                IssueTiming=issue_timing,
            )

            if result < 0:  # 호출 실패
                error_msg = self.barobill.get_err_string(result)
                raise Exception(f"세금계산서 등록 실패: {error_msg} (코드: {result})")

            return str(result)
        except Exception as e:
            raise

    def issue_tax_invoice(
        self,
        mgt_key: str,
        send_sms: bool = False,
        sms_message: str = "",
        force_issue: bool = False,
        mail_title: str = "",
        business_license_yn: bool = False,
        bank_book_yn: bool = False,
    ) -> int:
        """
        세금계산서 발행 (실제 HTTP 요청)

        Args:
            mgt_key: 관리번호
            send_sms: SMS 발송 여부
            sms_message: SMS 메시지
            force_issue: 강제발행 여부
            mail_title: 메일 제목
            business_license_yn: 사업자등록증 첨부 여부
            bank_book_yn: 통장사본 첨부 여부

        Returns:
            결과 코드 (양수: 성공, 음수: 실패)
        """
        # 실제 바로빌 서버로 HTTP 요청을 보내므로 검증 필요
        settings.validate_barobill()
        
        try:
            result = self.client.service.IssueTaxInvoiceEx(
                CERTKEY=self.cert_key,
                CorpNum=self.corp_num,
                MgtKey=mgt_key,
                SendSMS=send_sms,
                SMSMessage=sms_message,
                ForceIssue=force_issue,
                MailTitle=mail_title,
                BusinessLicenseYN=business_license_yn,
                BankBookYN=bank_book_yn,
            )

            if result < 0:  # 호출 실패
                error_msg = self.barobill.get_err_string(result)
                raise Exception(f"세금계산서 발행 실패: {error_msg} (코드: {result})")

            return result
        except Exception as e:
            raise

    def delete_tax_invoice(self, mgt_key: str) -> int:
        """
        세금계산서 삭제 (실제 HTTP 요청)

        Args:
            mgt_key: 관리번호

        Returns:
            결과 코드 (양수: 성공, 음수: 실패)
        """
        # 실제 바로빌 서버로 HTTP 요청을 보내므로 검증 필요
        settings.validate_barobill()
        
        try:
            result = self.client.service.DeleteTaxInvoice(
                CERTKEY=self.cert_key,
                CorpNum=self.corp_num,
                MgtKey=mgt_key,
            )

            if result < 0:  # 호출 실패
                error_msg = self.barobill.get_err_string(result)
                raise Exception(f"세금계산서 삭제 실패: {error_msg} (코드: {result})")

            return result
        except Exception as e:
            raise

    def _create_tax_invoice_object(self, invoice_data: Dict[str, Any]):
        """세금계산서 객체 생성"""
        # TaxInvoice 타입 가져오기
        tax_invoice_type = self.client.get_type("ns0:TaxInvoice")
        invoice_party_type = self.client.get_type("ns0:InvoiceParty")
        array_of_line_items_type = self.client.get_type(
            "ns0:ArrayOfTaxInvoiceTradeLineItem"
        )
        line_item_type = self.client.get_type("ns0:TaxInvoiceTradeLineItem")

        # 전체 부가세율 확인 (API 엔드포인트에서 계산되었지만, 혹시 모를 경우를 대비)
        vat_rate_percent = invoice_data.get("vat_rate_percent", 10.0)
        vat_rate = vat_rate_percent / 100.0

        # 거래명세서 항목 생성
        line_items = []
        if "TaxInvoiceTradeLineItems" in invoice_data:
            for item_data in invoice_data["TaxInvoiceTradeLineItems"]:
                # 공급가액 추출
                try:
                    supply_value = float(item_data.get("Amount", 0) or 0)
                except (ValueError, TypeError):
                    supply_value = 0

                # VAT 금액 확인 및 계산
                tax_value = item_data.get("Tax", "")
                if not tax_value or tax_value == "":
                    # Tax 필드가 비어있으면 부가세율로 계산
                    # 품목별 부가세율이 있으면 사용, 없으면 전체 부가세율 사용
                    item_vat_rate_percent = item_data.get("vat_rate_percent")
                    if item_vat_rate_percent is not None:
                        item_vat_rate = item_vat_rate_percent / 100.0
                    else:
                        item_vat_rate = vat_rate

                    # VAT 금액 계산 (공급가액 * 부가세율)
                    tax_amount = round(supply_value * item_vat_rate)
                    tax_value = str(int(tax_amount))

                # barobill API는 VAT 금액을 문자열로 받음
                line_item = line_item_type(
                    PurchaseExpiry=item_data.get("PurchaseExpiry", ""),
                    Name=item_data.get("Name", ""),
                    Information=item_data.get("Information", ""),
                    ChargeableUnit=item_data.get("ChargeableUnit", ""),
                    UnitPrice=item_data.get("UnitPrice", ""),
                    Amount=item_data.get("Amount", ""),
                    Tax=tax_value,  # 계산된 VAT 금액 전달
                    Description=item_data.get("Description", ""),
                )
                line_items.append(line_item)

        # 세금계산서 객체 생성
        tax_invoice = tax_invoice_type(
            IssueDirection=invoice_data.get("IssueDirection", 1),
            TaxInvoiceType=invoice_data.get("TaxInvoiceType", 1),
            ModifyCode=invoice_data.get("ModifyCode", ""),
            TaxType=invoice_data.get("TaxType", 1),
            TaxCalcType=invoice_data.get("TaxCalcType", 1),
            PurposeType=invoice_data.get("PurposeType", 2),
            WriteDate=invoice_data.get("WriteDate", ""),
            AmountTotal=invoice_data.get("AmountTotal", ""),
            TaxTotal=invoice_data.get("TaxTotal", ""),
            TotalAmount=invoice_data.get("TotalAmount", ""),
            Cash=invoice_data.get("Cash", ""),
            ChkBill=invoice_data.get("ChkBill", ""),
            Note=invoice_data.get("Note", ""),
            Credit=invoice_data.get("Credit", ""),
            Remark1=invoice_data.get("Remark1", ""),
            Remark2=invoice_data.get("Remark2", ""),
            Remark3=invoice_data.get("Remark3", ""),
            Kwon=invoice_data.get("Kwon", ""),
            Ho=invoice_data.get("Ho", ""),
            SerialNum=invoice_data.get("SerialNum", ""),
            InvoicerParty=self._create_invoice_party(
                invoice_data.get("InvoicerParty", {}), invoice_party_type
            ),
            InvoiceeParty=self._create_invoice_party(
                invoice_data.get("InvoiceeParty", {}), invoice_party_type
            ),
            BrokerParty=(
                self._create_invoice_party(
                    invoice_data.get("BrokerParty", {}), invoice_party_type
                )
                if invoice_data.get("BrokerParty")
                else None
            ),
            TaxInvoiceTradeLineItems=(
                array_of_line_items_type(line_items) if line_items else None
            ),
        )

        return tax_invoice

    def _create_invoice_party(self, party_data: Dict[str, Any], party_type):
        """거래처 정보 객체 생성"""
        return party_type(
            MgtNum=party_data.get("MgtNum", ""),
            CorpNum=party_data.get("CorpNum", ""),
            TaxRegID=party_data.get("TaxRegID", ""),
            CorpName=party_data.get("CorpName", ""),
            CEOName=party_data.get("CEOName", ""),
            Addr=party_data.get("Addr", ""),
            BizClass=party_data.get("BizClass", ""),
            BizType=party_data.get("BizType", ""),
            ContactID=party_data.get("ContactID", ""),
            ContactName=party_data.get("ContactName", ""),
            TEL=party_data.get("TEL", ""),
            HP=party_data.get("HP", ""),
            Email=party_data.get("Email", ""),
        )

    def _convert_to_dict(self, obj) -> Dict[str, Any]:
        """zeep 객체를 딕셔너리로 변환"""
        if hasattr(obj, "__dict__"):
            result = {}
            for key, value in obj.__dict__.items():
                if hasattr(value, "__dict__"):
                    result[key] = self._convert_to_dict(value)
                elif isinstance(value, list):
                    result[key] = [
                        (
                            self._convert_to_dict(item)
                            if hasattr(item, "__dict__")
                            else item
                        )
                        for item in value
                    ]
                else:
                    result[key] = value
            return result
        return obj
