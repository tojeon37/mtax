from pydantic import BaseModel
from typing import Optional, List
from decimal import Decimal


class InvoicePartyBase(BaseModel):
    """거래처 기본 정보"""
    MgtNum: Optional[str] = None
    CorpNum: str
    TaxRegID: Optional[str] = None
    CorpName: str
    CEOName: str
    Addr: str
    BizClass: Optional[str] = None
    BizType: Optional[str] = None
    ContactID: Optional[str] = None
    ContactName: Optional[str] = None
    TEL: Optional[str] = None
    HP: Optional[str] = None
    Email: Optional[str] = None


class TaxInvoiceTradeLineItem(BaseModel):
    """세금계산서 거래명세서 항목"""
    PurchaseExpiry: Optional[str] = None
    Name: str
    Information: Optional[str] = None
    ChargeableUnit: Optional[str] = None
    UnitPrice: Optional[str] = None
    Amount: Optional[str] = None
    Tax: Optional[str] = None
    Description: Optional[str] = None


class TaxInvoiceCreate(BaseModel):
    """세금계산서 생성 스키마"""
    IssueDirection: int = 1  # 1: 정발행, 2: 역발행
    TaxInvoiceType: int = 1  # 1: 세금계산서, 2: 계산서
    ModifyCode: Optional[str] = None
    TaxType: int = 1
    TaxCalcType: int = 1
    PurposeType: int = 2
    WriteDate: str
    AmountTotal: str
    TaxTotal: str
    TotalAmount: str
    Cash: Optional[str] = None
    ChkBill: Optional[str] = None
    Note: Optional[str] = None
    Credit: Optional[str] = None
    Remark1: Optional[str] = None
    Remark2: Optional[str] = None
    Remark3: Optional[str] = None
    Kwon: Optional[str] = None
    Ho: Optional[str] = None
    SerialNum: Optional[str] = None
    InvoicerParty: InvoicePartyBase
    InvoiceeParty: InvoicePartyBase
    BrokerParty: Optional[InvoicePartyBase] = None
    TaxInvoiceTradeLineItems: Optional[List[TaxInvoiceTradeLineItem]] = None
    IssueTiming: int = 1  # 1: 즉시발행, 2: 발행예약


class TaxInvoiceIssue(BaseModel):
    """세금계산서 발행 스키마"""
    mgt_key: str
    send_sms: bool = False
    sms_message: Optional[str] = None
    force_issue: bool = False
    mail_title: Optional[str] = None
    business_license_yn: bool = False
    bank_book_yn: bool = False


class TaxInvoiceResponse(BaseModel):
    """세금계산서 응답 스키마"""
    mgt_key: Optional[str] = None
    tax_invoice_type: Optional[int] = None
    issue_direction: Optional[int] = None
    write_date: Optional[str] = None
    amount_total: Optional[str] = None
    tax_total: Optional[str] = None
    total_amount: Optional[str] = None
    invoicer_party: Optional[dict] = None
    invoicee_party: Optional[dict] = None
    
    class Config:
        from_attributes = True

