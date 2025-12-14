"""
사용 내역 CRUD 함수
"""
from sqlalchemy.orm import Session
from decimal import Decimal
from datetime import datetime
from app.models.usage_log import UsageLog, UsageType


# 사용 단가 고정 상수
UNIT_PRICE_INVOICE_ISSUE = Decimal("200")  # 세금계산서 발행: 200원
UNIT_PRICE_STATUS_CHECK = Decimal("15")    # 사업자 상태조회: 15원


def record_usage_log(
    db: Session,
    user_id: int,
    usage_type: UsageType,
    quantity: int = 1
) -> UsageLog:
    """
    사용 내역 기록 (무료 쿼터 체크 포함)
    
    Args:
        db: 데이터베이스 세션
        user_id: 사용자 ID
        usage_type: 사용 유형
        quantity: 수량 (기본값 1)
        
    Returns:
        생성된 UsageLog 객체
    """
    from app.crud.free_quota import get_or_create_free_quota, use_free_invoice, use_free_status_check
    from app.models.user import User
    
    # 사용자 정보 조회 (user_identifier 추출용)
    user = db.query(User).filter(User.id == user_id).first()
    user_identifier = None
    if user:
        # 이메일 우선, 없으면 사업자등록번호
        user_identifier = user.email if user.email else (user.barobill_corp_num if user.barobill_corp_num else None)
    
    # 무료 쿼터 조회 또는 생성
    quota = get_or_create_free_quota(db, user_id)
    
    # 사용 전 잔여량 저장 (소진 상태 체크용)
    free_invoice_before = quota.free_invoice_left
    free_status_before = quota.free_status_left
    
    # 무료 여부 체크 및 단가 결정
    unit_price = Decimal("0")
    
    if usage_type == UsageType.INVOICE_ISSUE:
        # 무료 세금계산서 발행 횟수 확인
        if quota.free_invoice_left > 0:
            use_free_invoice(db, user_id, user_identifier)
            unit_price = Decimal("0")  # 무료
        else:
            unit_price = UNIT_PRICE_INVOICE_ISSUE  # 유료
    elif usage_type == UsageType.STATUS_CHECK:
        # 사업자상태조회는 전자세금계산서 무료 제공 기간 동안만 무료로 제공
        # 전자세금계산서 무료 제공 기간 확인
        if quota.free_invoice_left > 0:
            # 전자세금계산서 무료 제공 기간이면 사업자상태조회도 무료로 제공
            # 사업자상태조회 무료 제공 건수는 별도로 차감하지 않음
            unit_price = Decimal("0")  # 무료
        else:
            # 전자세금계산서 무료 제공 기간이 종료되면 유료
            unit_price = UNIT_PRICE_STATUS_CHECK  # 유료
    else:
        raise ValueError(f"Unknown usage type: {usage_type}")
    
    # 총 금액 계산
    total_price = unit_price * quantity
    
    # 사용 내역 기록
    usage_log = UsageLog(
        user_id=user_id,
        usage_type=usage_type,
        unit_price=unit_price,
        quantity=quantity,
        total_price=total_price,
        billing_cycle_id=None  # 나중에 billing_cycle 생성 시 업데이트
    )
    
    db.add(usage_log)
    db.commit()
    db.refresh(usage_log)
    
    return usage_log


def get_usage_logs(
    db: Session,
    user_id: int,
    start_date: datetime = None,
    end_date: datetime = None,
    billing_cycle_id: int = None,
    skip: int = 0,
    limit: int = 100
) -> list[UsageLog]:
    """
    사용 내역 조회
    
    Args:
        db: 데이터베이스 세션
        user_id: 사용자 ID
        start_date: 시작 날짜
        end_date: 종료 날짜
        billing_cycle_id: 청구 주기 ID (선택)
        skip: 건너뛸 개수
        limit: 최대 개수
        
    Returns:
        UsageLog 리스트
    """
    query = db.query(UsageLog).filter(UsageLog.user_id == user_id)
    
    if start_date:
        query = query.filter(UsageLog.created_at >= start_date)
    
    if end_date:
        query = query.filter(UsageLog.created_at <= end_date)
    
    if billing_cycle_id:
        query = query.filter(UsageLog.billing_cycle_id == billing_cycle_id)
    
    return query.order_by(UsageLog.created_at.desc()).offset(skip).limit(limit).all()


def get_monthly_usage(
    db: Session,
    user_id: int,
    year_month: str  # YYYYMM 형식
) -> Decimal:
    """
    월별 사용 금액 합계 조회
    
    Args:
        db: 데이터베이스 세션
        user_id: 사용자 ID
        year_month: 년월 (YYYYMM 형식)
        
    Returns:
        총 사용 금액
    """
    from sqlalchemy import func as sql_func
    
    # YYYYMM을 시작일과 종료일로 변환
    year = int(year_month[:4])
    month = int(year_month[4:6])
    start_date = datetime(year, month, 1)
    
    # 다음 달 1일
    if month == 12:
        end_date = datetime(year + 1, 1, 1)
    else:
        end_date = datetime(year, month + 1, 1)
    
    result = db.query(
        sql_func.sum(UsageLog.total_price)
    ).filter(
        UsageLog.user_id == user_id,
        UsageLog.created_at >= start_date,
        UsageLog.created_at < end_date
    ).scalar()
    
    return Decimal(result) if result else Decimal("0")

