"""
세금계산서 발행/취소 관련 DB 및 비즈니스 로직 서비스
"""
from typing import Optional, List
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import timedelta
from fastapi import HTTPException, status
from app.models.invoice import Invoice
from app.models.tax_invoice_issue import TaxInvoiceIssue
from app.models.user import User
from app.crud.usage import record_usage_log
from app.models.usage_log import UsageType


class InvoiceService:
    """세금계산서 발행/취소 관련 DB 및 비즈니스 로직"""

    @staticmethod
    def update_invoice_after_issue(
        db: Session,
        user_id: int,
        mgt_key: str,
        result_code: int
    ):
        """
        세금계산서 발행 후 DB 상태 업데이트
        
        Args:
            db: 데이터베이스 세션
            user_id: 사용자 ID
            mgt_key: 관리번호
            result_code: 발행 결과 코드
        """
        # 사용 내역 기록
        record_usage_log(
            db=db,
            user_id=user_id,
            usage_type=UsageType.INVOICE_ISSUE,
            quantity=1
        )
        
        # Invoice 모델 상태 업데이트
        invoice = db.query(Invoice).filter(
            Invoice.mgt_key == mgt_key,
            Invoice.user_id == user_id
        ).first()
        
        if invoice:
            invoice.status = "대기"
        
        # TaxInvoiceIssue 모델 상태 업데이트
        tax_invoice_issue = db.query(TaxInvoiceIssue).filter(
            TaxInvoiceIssue.mgt_key == mgt_key,
            TaxInvoiceIssue.user_id == user_id
        ).first()
        
        if tax_invoice_issue:
            tax_invoice_issue.barobill_result_code = result_code
            tax_invoice_issue.barobill_state = "발행완료"
        
        db.commit()

    @staticmethod
    def find_invoice_by_mgt_key(
        db: Session,
        user_id: int,
        mgt_key: str
    ) -> Optional[Invoice]:
        """
        mgt_key로 Invoice 찾기 (없으면 TaxInvoiceIssue에서 찾아서 생성)
        
        Args:
            db: 데이터베이스 세션
            user_id: 사용자 ID
            mgt_key: 관리번호
            
        Returns:
            Invoice 객체 또는 None
        """
        invoice = db.query(Invoice).filter(
            Invoice.mgt_key == mgt_key,
            Invoice.user_id == user_id
        ).first()
        
        if not invoice:
            tax_invoice_issue = db.query(TaxInvoiceIssue).filter(
                TaxInvoiceIssue.mgt_key == mgt_key,
                TaxInvoiceIssue.user_id == user_id
            ).first()
            
            if not tax_invoice_issue:
                return None
            
            # TaxInvoiceIssue는 있지만 Invoice가 없는 경우 Invoice 생성
            invoice = Invoice(
                user_id=user_id,
                customer_name=tax_invoice_issue.invoicee_corp_name or "거래처",
                amount=Decimal(tax_invoice_issue.total_amount or "0"),
                tax_type="세금계산서",
                status="대기",
                mgt_key=mgt_key
            )
            db.add(invoice)
            db.flush()
        
        return invoice

    @staticmethod
    def find_mgt_key_by_invoice_id(
        db: Session,
        user_id: int,
        invoice_id: int
    ) -> Optional[str]:
        """
        invoice_id로 mgt_key 찾기 (복잡한 로직)
        
        Args:
            db: 데이터베이스 세션
            user_id: 사용자 ID
            invoice_id: Invoice ID
            
        Returns:
            mgt_key 또는 None
        """
        invoice = db.query(Invoice).filter(
            Invoice.id == invoice_id,
            Invoice.user_id == user_id
        ).first()
        
        if not invoice:
            return None
        
        mgt_key = invoice.mgt_key
        if mgt_key and mgt_key != '':
            return mgt_key
        
        # mgt_key가 없으면 TaxInvoiceIssue에서 찾기
        # 1. created_at이 비슷한 것으로 찾기 (10분 이내)
        time_window_start = invoice.created_at - timedelta(minutes=10)
        time_window_end = invoice.created_at + timedelta(minutes=10)
        
        tax_invoice_issue = db.query(TaxInvoiceIssue).filter(
            TaxInvoiceIssue.user_id == user_id,
            TaxInvoiceIssue.created_at >= time_window_start,
            TaxInvoiceIssue.created_at <= time_window_end
        ).order_by(desc(TaxInvoiceIssue.created_at)).first()
        
        # 2. 시간으로 찾지 못하면 customer_name과 amount로 찾기
        if not tax_invoice_issue:
            invoice_amount_str = str(invoice.amount)
            tax_invoice_issue = db.query(TaxInvoiceIssue).filter(
                TaxInvoiceIssue.user_id == user_id,
                TaxInvoiceIssue.invoicee_corp_name == invoice.customer_name,
                TaxInvoiceIssue.total_amount == invoice_amount_str
            ).order_by(desc(TaxInvoiceIssue.created_at)).first()
        
        # 3. customer_name만으로 찾기
        if not tax_invoice_issue:
            tax_invoice_issue = db.query(TaxInvoiceIssue).filter(
                TaxInvoiceIssue.user_id == user_id,
                TaxInvoiceIssue.invoicee_corp_name == invoice.customer_name
            ).order_by(desc(TaxInvoiceIssue.created_at)).first()
        
        # 4. 최근 발행 예약 상태인 것만 찾기
        if not tax_invoice_issue:
            tax_invoice_issue = db.query(TaxInvoiceIssue).filter(
                TaxInvoiceIssue.user_id == user_id,
                TaxInvoiceIssue.barobill_state.in_(["발행예약", "발행완료", None])
            ).order_by(desc(TaxInvoiceIssue.created_at)).first()
        
        # 5. 마지막으로 사용자의 최근 TaxInvoiceIssue 중에서 찾기
        if not tax_invoice_issue:
            tax_invoice_issue = db.query(TaxInvoiceIssue).filter(
                TaxInvoiceIssue.user_id == user_id
            ).order_by(desc(TaxInvoiceIssue.created_at)).first()
        
        if tax_invoice_issue:
            mgt_key = tax_invoice_issue.mgt_key
            invoice.mgt_key = mgt_key
            db.commit()
            return mgt_key
        
        return None

    @staticmethod
    def validate_invoice_cancellation(
        db: Session,
        invoice: Invoice,
        barobill_state: Optional[int] = None
    ):
        """
        세금계산서 취소 가능 여부 검증
        
        Args:
            db: 데이터베이스 세션
            invoice: Invoice 객체
            barobill_state: 바로빌 상태 (None이면 DB 상태로 판단)
            
        Raises:
            HTTPException: 취소 불가능한 경우
        """
        if barobill_state is not None:
            # 바로빌 상태로 판단
            if barobill_state == 2:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="홈택스로 전송된 세금계산서는 취소할 수 없습니다."
                )
            elif barobill_state == 4:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="이미 취소된 세금계산서입니다."
                )
        else:
            # DB 상태로 판단
            if invoice.status == "완료":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="홈택스로 전송된 세금계산서는 취소할 수 없습니다."
                )
            elif invoice.status == "취소됨":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="이미 취소된 세금계산서입니다."
                )

    @staticmethod
    def update_invoice_after_cancel(
        db: Session,
        user_id: int,
        mgt_key: str
    ):
        """
        세금계산서 취소 후 DB 상태 업데이트
        
        Args:
            db: 데이터베이스 세션
            user_id: 사용자 ID
            mgt_key: 관리번호
        """
        invoice = db.query(Invoice).filter(
            Invoice.mgt_key == mgt_key,
            Invoice.user_id == user_id
        ).first()
        
        if invoice:
            invoice.status = "취소됨"
        
        tax_invoice_issue = db.query(TaxInvoiceIssue).filter(
            TaxInvoiceIssue.mgt_key == mgt_key,
            TaxInvoiceIssue.user_id == user_id
        ).first()
        
        if tax_invoice_issue:
            tax_invoice_issue.barobill_state = "취소됨"
        
        db.commit()

