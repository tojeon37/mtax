from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from decimal import Decimal
from datetime import date, datetime
import json
from app.db.session import get_db
from app.models.user import User
from app.crud.usage import record_usage_log
from app.models.usage_log import UsageType
from app.models.tax_invoice_issue import TaxInvoiceIssue
from pydantic import BaseModel
from app.api.v1.auth import get_current_user
from app.schemas.tax_invoice_barobill import TaxInvoiceCreate
from app.services.tax_invoice import TaxInvoiceService

router = APIRouter(prefix="/barobill/tax-invoices", tags=["barobill-tax-invoices"])


@router.post("/issue", response_model=dict, status_code=status.HTTP_201_CREATED)
def issue_tax_invoice(
    invoice: TaxInvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    전자세금계산서 발행 (사용자별 인증키 사용)
    
    로그인한 사용자의 바로빌 인증키로 세금계산서를 발행합니다.
    발행 시 사용 내역을 기록합니다.
    """
    # 바로빌 연동 확인
    if not current_user.barobill_linked or not current_user.barobill_cert_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="바로빌 연동이 필요합니다. 먼저 바로빌 회원사 가입을 완료해주세요."
        )
    
    if not current_user.barobill_corp_num:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="사업자번호가 등록되지 않았습니다."
        )
    
    # 무료 제공 건수 확인 및 결제수단 확인
    if current_user.free_invoice_remaining > 0:
        # 무료 제공 건수가 있으면 정상 발행 처리
        pass
    else:
        # 무료 제공 건수가 없으면 결제수단 확인
        if not current_user.has_payment_method:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="무료 5건이 모두 소진되었습니다. 결제수단을 등록해야 발행이 가능합니다."
            )
    
    try:
        # 사용자별 인증키로 세금계산서 서비스 생성
        service = TaxInvoiceService(
            cert_key=current_user.barobill_cert_key,
            corp_num=current_user.barobill_corp_num
        )
        
        # 세금계산서 등록 및 발행
        invoice_data = invoice.model_dump(exclude={'IssueTiming'})
        issue_timing = invoice.IssueTiming
        
        # 등록
        mgt_key = service.regist_tax_invoice(invoice_data, issue_timing)
        
        # 즉시 발행인 경우 발행
        if issue_timing == 1:
            result = service.issue_tax_invoice(
                mgt_key=mgt_key,
                send_sms=False,
                force_issue=True
            )
            
            # 발행 성공 시에만 무료 제공 건수 차감 또는 과금 처리
            if result > 0:  # 발행 성공
                # 무료 제공 건수 차감 또는 과금 처리
                if current_user.free_invoice_remaining > 0:
                    # 무료 제공 건수 차감
                    current_user.free_invoice_remaining -= 1
                else:
                    # 결제수단이 등록된 경우 과금 처리
                    if current_user.has_payment_method:
                        # 사용 내역 기록 (후불 청구)
                        record_usage_log(
                            db=db,
                            user_id=current_user.id,
                            usage_type=UsageType.INVOICE_ISSUE,
                            quantity=1
                        )
                        # BillingCharge 기록
                        from app.models.billing_charge import BillingCharge, ChargeType
                        charge = BillingCharge(
                            user_id=current_user.id,
                            charge_type=ChargeType.INVOICE,
                            amount=200  # 계산서 발행 건당 200원
                        )
                        db.add(charge)
                
                # 사용자 정보 업데이트 저장
                db.add(current_user)
            
            # 발행 정보를 DB에 저장 (5년 보관)
            write_date_str = invoice_data.get('WriteDate', '')
            # YYYYMMDD 형식을 date 객체로 변환
            issue_date_obj = date.today()
            if write_date_str and len(write_date_str) == 8:
                try:
                    issue_date_obj = datetime.strptime(write_date_str, '%Y%m%d').date()
                except ValueError:
                    pass  # 변환 실패 시 오늘 날짜 사용
            
            # 품목 정보를 JSON 문자열로 변환
            line_items_json = None
            if invoice_data.get('TaxInvoiceTradeLineItems'):
                line_items_json = json.dumps(invoice_data['TaxInvoiceTradeLineItems'], ensure_ascii=False)
            
            # 발행 정보 저장
            tax_invoice_issue = TaxInvoiceIssue(
                user_id=current_user.id,
                mgt_key=mgt_key,
                issue_date=issue_date_obj,
                write_date=write_date_str,
                invoicer_corp_num=invoice_data.get('InvoicerParty', {}).get('CorpNum', ''),
                invoicer_corp_name=invoice_data.get('InvoicerParty', {}).get('CorpName', ''),
                invoicer_ceo_name=invoice_data.get('InvoicerParty', {}).get('CEOName'),
                invoicer_addr=invoice_data.get('InvoicerParty', {}).get('Addr'),
                invoicer_biz_type=invoice_data.get('InvoicerParty', {}).get('BizType'),
                invoicer_biz_class=invoice_data.get('InvoicerParty', {}).get('BizClass'),
                invoicer_email=invoice_data.get('InvoicerParty', {}).get('Email'),
                invoicee_corp_num=invoice_data.get('InvoiceeParty', {}).get('CorpNum', ''),
                invoicee_corp_name=invoice_data.get('InvoiceeParty', {}).get('CorpName', ''),
                invoicee_ceo_name=invoice_data.get('InvoiceeParty', {}).get('CEOName'),
                invoicee_addr=invoice_data.get('InvoiceeParty', {}).get('Addr'),
                invoicee_biz_type=invoice_data.get('InvoiceeParty', {}).get('BizType'),
                invoicee_biz_class=invoice_data.get('InvoiceeParty', {}).get('BizClass'),
                invoicee_email=invoice_data.get('InvoiceeParty', {}).get('Email'),
                amount_total=invoice_data.get('AmountTotal'),
                tax_total=invoice_data.get('TaxTotal'),
                total_amount=invoice_data.get('TotalAmount'),
                cash=invoice_data.get('Cash'),
                chk_bill=invoice_data.get('ChkBill'),
                note=invoice_data.get('Note'),
                credit=invoice_data.get('Credit'),
                purpose_type=invoice_data.get('PurposeType'),
                tax_type=invoice_data.get('TaxType'),
                remark1=invoice_data.get('Remark1'),
                remark2=invoice_data.get('Remark2'),
                remark3=invoice_data.get('Remark3'),
                line_items=line_items_json,
                barobill_result_code=result if isinstance(result, int) else None,
                barobill_state="발행완료" if result > 0 else None
            )
            db.add(tax_invoice_issue)
            
            # Invoice 모델도 생성 (발행내역 표시 및 취소 기능을 위해)
            if result > 0:  # 발행 성공 시에만
                from app.models.invoice import Invoice
                # 세금계산서 타입 결정 (1: 세금계산서, 2: 계산서)
                tax_type_str = "세금계산서" if invoice_data.get('TaxInvoiceType', 1) == 1 else "계산서"
                # 과세/면세 구분
                if invoice_data.get('TaxType', 1) == 2:
                    tax_type_str = "면세" + tax_type_str
                else:
                    tax_type_str = "과세" + tax_type_str
                
                # 총액을 Decimal로 변환
                total_amount_str = invoice_data.get('TotalAmount', '0')
                try:
                    total_amount_decimal = Decimal(total_amount_str)
                except:
                    total_amount_decimal = Decimal('0')
                
                # Invoice 생성
                invoice = Invoice(
                    user_id=current_user.id,
                    customer_name=invoice_data.get('InvoiceeParty', {}).get('CorpName', '거래처'),
                    amount=total_amount_decimal,
                    tax_type=tax_type_str,
                    memo=invoice_data.get('Remark1') or invoice_data.get('Remark2') or invoice_data.get('Remark3'),
                    status="대기",  # 바로빌로 발행하면 "대기" 상태
                    mgt_key=mgt_key  # 바로빌 관리번호 저장
                )
                db.add(invoice)
            
                db.commit()
                
                return {
                    "success": True,
                    "mgt_key": mgt_key,
                    "issue_result": result,
                    "message": "세금계산서가 발행되었습니다."
                }
            else:
                # 발행 실패 시 에러 처리 (무료 건수 차감 안됨)
                db.rollback()
                error_msg = service.barobill.get_err_string(result) if hasattr(service, 'barobill') else f"발행 실패 (코드: {result})"
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=error_msg
                )
        else:
            # 발행 예약인 경우에도 저장
            write_date_str = invoice_data.get('WriteDate', '')
            issue_date_obj = date.today()
            if write_date_str and len(write_date_str) == 8:
                try:
                    issue_date_obj = datetime.strptime(write_date_str, '%Y%m%d').date()
                except ValueError:
                    pass
            
            line_items_json = None
            if invoice_data.get('TaxInvoiceTradeLineItems'):
                line_items_json = json.dumps(invoice_data['TaxInvoiceTradeLineItems'], ensure_ascii=False)
            
            tax_invoice_issue = TaxInvoiceIssue(
                user_id=current_user.id,
                mgt_key=mgt_key,
                issue_date=issue_date_obj,
                write_date=write_date_str,
                invoicer_corp_num=invoice_data.get('InvoicerParty', {}).get('CorpNum', ''),
                invoicer_corp_name=invoice_data.get('InvoicerParty', {}).get('CorpName', ''),
                invoicer_ceo_name=invoice_data.get('InvoicerParty', {}).get('CEOName'),
                invoicer_addr=invoice_data.get('InvoicerParty', {}).get('Addr'),
                invoicer_biz_type=invoice_data.get('InvoicerParty', {}).get('BizType'),
                invoicer_biz_class=invoice_data.get('InvoicerParty', {}).get('BizClass'),
                invoicer_email=invoice_data.get('InvoicerParty', {}).get('Email'),
                invoicee_corp_num=invoice_data.get('InvoiceeParty', {}).get('CorpNum', ''),
                invoicee_corp_name=invoice_data.get('InvoiceeParty', {}).get('CorpName', ''),
                invoicee_ceo_name=invoice_data.get('InvoiceeParty', {}).get('CEOName'),
                invoicee_addr=invoice_data.get('InvoiceeParty', {}).get('Addr'),
                invoicee_biz_type=invoice_data.get('InvoiceeParty', {}).get('BizType'),
                invoicee_biz_class=invoice_data.get('InvoiceeParty', {}).get('BizClass'),
                invoicee_email=invoice_data.get('InvoiceeParty', {}).get('Email'),
                amount_total=invoice_data.get('AmountTotal'),
                tax_total=invoice_data.get('TaxTotal'),
                total_amount=invoice_data.get('TotalAmount'),
                cash=invoice_data.get('Cash'),
                chk_bill=invoice_data.get('ChkBill'),
                note=invoice_data.get('Note'),
                credit=invoice_data.get('Credit'),
                purpose_type=invoice_data.get('PurposeType'),
                tax_type=invoice_data.get('TaxType'),
                remark1=invoice_data.get('Remark1'),
                remark2=invoice_data.get('Remark2'),
                remark3=invoice_data.get('Remark3'),
                line_items=line_items_json,
                barobill_state="발행예약"
            )
            db.add(tax_invoice_issue)
            
            # 발행 예약인 경우에도 Invoice 모델 생성
            from app.models.invoice import Invoice
            # 세금계산서 타입 결정 (1: 세금계산서, 2: 계산서)
            tax_type_str = "세금계산서" if invoice_data.get('TaxInvoiceType', 1) == 1 else "계산서"
            # 과세/면세 구분
            if invoice_data.get('TaxType', 1) == 2:
                tax_type_str = "면세" + tax_type_str
            else:
                tax_type_str = "과세" + tax_type_str
            
            # 총액을 Decimal로 변환
            total_amount_str = invoice_data.get('TotalAmount', '0')
            try:
                total_amount_decimal = Decimal(total_amount_str)
            except:
                total_amount_decimal = Decimal('0')
            
            # Invoice 생성
            invoice = Invoice(
                user_id=current_user.id,
                customer_name=invoice_data.get('InvoiceeParty', {}).get('CorpName', '거래처'),
                amount=total_amount_decimal,
                tax_type=tax_type_str,
                memo=invoice_data.get('Remark1') or invoice_data.get('Remark2') or invoice_data.get('Remark3'),
                status="CREATED",  # 발행 예약은 "CREATED" 상태
                mgt_key=mgt_key  # 바로빌 관리번호 저장
            )
            db.add(invoice)
            
            db.commit()
            
            return {
                "success": True,
                "mgt_key": mgt_key,
                "message": "세금계산서가 등록되었습니다. 발행 예약 상태입니다."
            }
            
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


class CallbackRequest(BaseModel):
    """바로빌 callback 요청"""
    mgt_key: str
    status: str  # "발행성공" 또는 기타 상태


@router.post("/callback", response_model=dict)
def handle_callback(
    callback_data: CallbackRequest,
    db: Session = Depends(get_db)
):
    """
    바로빌 홈택스 전송 완료 callback 처리
    
    홈택스 전송이 완료되면 바로빌에서 이 엔드포인트로 callback을 보냅니다.
    TaxInvoiceIssue의 상태를 업데이트합니다.
    """
    try:
        # TaxInvoiceIssue 업데이트
        tax_invoice_issue = db.query(TaxInvoiceIssue).filter(
            TaxInvoiceIssue.mgt_key == callback_data.mgt_key
        ).first()
        
        if tax_invoice_issue:
            tax_invoice_issue.barobill_state = callback_data.status
            db.commit()
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"해당 관리번호({callback_data.mgt_key})의 세금계산서를 찾을 수 없습니다."
            )
        
        return {
            "success": True,
            "message": "상태가 업데이트되었습니다.",
            "mgt_key": callback_data.mgt_key,
            "status": callback_data.status
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Callback 처리 중 오류가 발생했습니다: {str(e)}"
        )

