from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class TaxInvoiceIssueBase(BaseModel):
    """세금계산서 발행 정보 기본 스키마"""
    mgt_key: str
    issue_date: date
    write_date: str
    invoicer_corp_num: str
    invoicer_corp_name: str
    invoicer_ceo_name: Optional[str] = None
    invoicer_addr: Optional[str] = None
    invoicer_biz_type: Optional[str] = None
    invoicer_biz_class: Optional[str] = None
    invoicer_email: Optional[str] = None
    invoicee_corp_num: str
    invoicee_corp_name: str
    invoicee_ceo_name: Optional[str] = None
    invoicee_addr: Optional[str] = None
    invoicee_biz_type: Optional[str] = None
    invoicee_biz_class: Optional[str] = None
    invoicee_email: Optional[str] = None
    amount_total: Optional[str] = None
    tax_total: Optional[str] = None
    total_amount: Optional[str] = None
    cash: Optional[str] = None
    chk_bill: Optional[str] = None
    note: Optional[str] = None
    credit: Optional[str] = None
    purpose_type: Optional[int] = None
    tax_type: Optional[int] = None
    remark1: Optional[str] = None
    remark2: Optional[str] = None
    remark3: Optional[str] = None
    line_items: Optional[str] = None  # JSON 문자열
    barobill_result_code: Optional[int] = None
    barobill_state: Optional[str] = None


class TaxInvoiceIssueCreate(TaxInvoiceIssueBase):
    """세금계산서 발행 정보 생성 스키마"""
    pass


class TaxInvoiceIssueResponse(TaxInvoiceIssueBase):
    """세금계산서 발행 정보 응답 스키마"""
    id: int
    user_id: int
    retention_until: date
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

