"""
청구 주기 CRUD 함수
"""
from sqlalchemy.orm import Session
from decimal import Decimal
from datetime import datetime, date, timedelta
from calendar import monthrange
from app.models.billing_cycle import BillingCycle, BillingCycleStatus
from app.models.usage_log import UsageLog
from app.crud.usage import get_monthly_usage


def generate_billing_cycle(
    db: Session,
    user_id: int,
    year_month: str  # YYYYMM 형식
) -> BillingCycle:
    """
    청구 주기 생성
    
    매월 1일 00:10에 지난달 로그를 묶어 생성하는 함수
    
    Args:
        db: 데이터베이스 세션
        user_id: 사용자 ID
        year_month: 년월 (YYYYMM 형식)
        
    Returns:
        생성된 BillingCycle 객체
    """
    # 이미 존재하는지 확인
    existing = db.query(BillingCycle).filter(
        BillingCycle.user_id == user_id,
        BillingCycle.year_month == year_month
    ).first()
    
    if existing:
        return existing
    
    # 월별 사용 금액 합계
    total_usage_amount = get_monthly_usage(db, user_id, year_month)
    
    # 월 기본료 (현재는 0)
    monthly_fee = Decimal("0")
    
    # 총 청구 금액
    total_bill_amount = total_usage_amount + monthly_fee
    
    # 납부 기한 계산 (다음 달 말일)
    year = int(year_month[:4])
    month = int(year_month[4:6])
    
    # 다음 달
    if month == 12:
        next_year = year + 1
        next_month = 1
    else:
        next_year = year
        next_month = month + 1
    
    # 다음 달 말일
    _, last_day = monthrange(next_year, next_month)
    due_date = date(next_year, next_month, last_day)
    
    # 청구 주기 생성
    billing_cycle = BillingCycle(
        user_id=user_id,
        year_month=year_month,
        total_usage_amount=total_usage_amount,
        monthly_fee=monthly_fee,
        total_bill_amount=total_bill_amount,
        status=BillingCycleStatus.PENDING,
        due_date=due_date
    )
    
    db.add(billing_cycle)
    db.flush()  # ID를 얻기 위해 flush
    
    # 해당 월의 usage_logs에 billing_cycle_id 업데이트
    start_date = datetime(year, month, 1)
    if month == 12:
        end_date = datetime(year + 1, 1, 1)
    else:
        end_date = datetime(year, month + 1, 1)
    
    db.query(UsageLog).filter(
        UsageLog.user_id == user_id,
        UsageLog.created_at >= start_date,
        UsageLog.created_at < end_date,
        UsageLog.billing_cycle_id.is_(None)
    ).update({
        UsageLog.billing_cycle_id: billing_cycle.id
    })
    
    db.commit()
    db.refresh(billing_cycle)
    
    return billing_cycle


def get_billing_cycles(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 100
) -> list[BillingCycle]:
    """
    청구 주기 목록 조회
    
    Args:
        db: 데이터베이스 세션
        user_id: 사용자 ID
        skip: 건너뛸 개수
        limit: 최대 개수
        
    Returns:
        BillingCycle 리스트
    """
    return db.query(BillingCycle).filter(
        BillingCycle.user_id == user_id
    ).order_by(
        BillingCycle.year_month.desc()
    ).offset(skip).limit(limit).all()


def get_billing_cycle_by_id(
    db: Session,
    billing_cycle_id: int,
    user_id: int = None
) -> BillingCycle:
    """
    청구 주기 상세 조회
    
    Args:
        db: 데이터베이스 세션
        billing_cycle_id: 청구 주기 ID
        user_id: 사용자 ID (선택, 권한 확인용)
        
    Returns:
        BillingCycle 객체
    """
    query = db.query(BillingCycle).filter(BillingCycle.id == billing_cycle_id)
    
    if user_id:
        query = query.filter(BillingCycle.user_id == user_id)
    
    return query.first()

