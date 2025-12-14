from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Date
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base
from datetime import datetime, timedelta


class TaxInvoiceIssue(Base):
    """바로빌 전자세금계산서 발행 정보 모델 (5년 보관)"""
    __tablename__ = "tax_invoice_issues"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # 바로빌 관리번호
    mgt_key = Column(String(100), nullable=False, unique=True, index=True)
    
    # 발행 정보
    issue_date = Column(Date, nullable=False, index=True)  # 발행일자
    write_date = Column(String(20), nullable=False)  # 작성일자 (YYYYMMDD)
    
    # 공급자 정보 (우리회사)
    invoicer_corp_num = Column(String(20), nullable=False)
    invoicer_corp_name = Column(String(255), nullable=False)
    invoicer_ceo_name = Column(String(100))
    invoicer_addr = Column(Text)
    invoicer_biz_type = Column(String(100))
    invoicer_biz_class = Column(String(100))
    invoicer_email = Column(String(255))
    
    # 공급받는자 정보 (거래처)
    invoicee_corp_num = Column(String(20), nullable=False)
    invoicee_corp_name = Column(String(255), nullable=False)
    invoicee_ceo_name = Column(String(100))
    invoicee_addr = Column(Text)
    invoicee_biz_type = Column(String(100))
    invoicee_biz_class = Column(String(100))
    invoicee_email = Column(String(255))
    
    # 금액 정보
    amount_total = Column(String(50))  # 공급가액
    tax_total = Column(String(50))  # 세액
    total_amount = Column(String(50))  # 합계금액
    
    # 결제 정보
    cash = Column(String(50))
    chk_bill = Column(String(50))
    note = Column(String(50))
    credit = Column(String(50))
    
    # 기타 정보
    purpose_type = Column(Integer)  # 청구/영수
    tax_type = Column(Integer)  # 과세/면세/영세
    remark1 = Column(Text)
    remark2 = Column(Text)
    remark3 = Column(Text)
    
    # 품목 정보 (JSON 형태로 저장)
    line_items = Column(Text)  # JSON 문자열로 저장
    
    # 바로빌 응답 정보
    barobill_result_code = Column(Integer)  # 바로빌 응답 코드
    barobill_state = Column(String(50))  # 바로빌 상태
    
    # 보관 기간 관리
    retention_until = Column(Date, nullable=False, index=True)  # 보관 만료일 (발행일 + 5년)
    
    # 메타 정보
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 관계 설정
    user = relationship("User", backref="tax_invoice_issues")
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # 보관 만료일 자동 계산 (발행일 + 5년)
        if self.issue_date and not self.retention_until:
            self.retention_until = self.issue_date + timedelta(days=365 * 5)

