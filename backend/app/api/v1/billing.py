"""
청구 주기 API
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.db.session import get_db
from app.models.user import User
from app.api.v1.auth import get_current_user
from app.schemas.billing import BillingCycleResponse, BillingCycleDetailResponse
from app.crud.billing import get_billing_cycles, get_billing_cycle_by_id, generate_billing_cycle
from app.crud.usage import get_usage_logs
from app.schemas.usage import UsageLogResponse
from app.models.billing_cycle import BillingCycle

router = APIRouter()


@router.get("", response_model=list[BillingCycleResponse])
def list_billing_cycles(
    page: int = Query(1, ge=1, description="페이지 번호"),
    limit: int = Query(50, ge=1, le=100, description="페이지당 항목 수"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    청구 주기 목록 조회
    """
    skip = (page - 1) * limit
    cycles = get_billing_cycles(
        db=db,
        user_id=current_user.id,
        skip=skip,
        limit=limit
    )
    
    return cycles


@router.get("/{billing_cycle_id}", response_model=BillingCycleDetailResponse)
def get_billing_cycle_detail(
    billing_cycle_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    청구 주기 상세 조회
    """
    cycle = get_billing_cycle_by_id(
        db=db,
        billing_cycle_id=billing_cycle_id,
        user_id=current_user.id
    )
    
    if not cycle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="청구 주기를 찾을 수 없습니다."
        )
    
    # 사용 내역 조회
    usage_logs = get_usage_logs(
        db=db,
        user_id=current_user.id,
        billing_cycle_id=billing_cycle_id,
        skip=0,
        limit=1000
    )
    
    return BillingCycleDetailResponse(
        **cycle.__dict__,
        usage_count=len(usage_logs),
        usage_logs=[UsageLogResponse(**log.__dict__) for log in usage_logs]
    )


@router.get("/current/summary")
def get_current_month_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    이번 달 사용 요약 조회
    """
    from datetime import datetime
    from app.crud.usage import get_monthly_usage
    
    # 현재 년월
    now = datetime.now()
    current_year_month = now.strftime("%Y%m")
    
    # 이번 달 사용 금액
    total_usage = get_monthly_usage(db, current_user.id, current_year_month)
    
    # 이번 달 사용 내역 개수
    from app.models.usage_log import UsageLog
    from sqlalchemy import func as sql_func
    
    usage_count = db.query(sql_func.count(UsageLog.id)).filter(
        UsageLog.user_id == current_user.id,
        sql_func.date_format(UsageLog.created_at, "%Y%m") == current_year_month
    ).scalar() or 0
    
    # 가장 최근 청구 주기
    latest_cycle = db.query(BillingCycle).filter(
        BillingCycle.user_id == current_user.id
    ).order_by(BillingCycle.year_month.desc()).first()
    
    return {
        "current_month": current_year_month,
        "total_usage_amount": float(total_usage),
        "usage_count": usage_count,
        "latest_billing_cycle": BillingCycleResponse(**latest_cycle.__dict__) if latest_cycle else None
    }


@router.post("/generate-now")
def generate_billing_now(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    즉시 청구서 생성 (B 상태 전용)
    
    billing_cycle_id=NULL인 usage_logs를 모두 묶어 즉시 BillingCycle 생성
    """
    # 미청구 사용 내역 확인
    unbilled_usage = db.query(UsageLog).filter(
        UsageLog.user_id == current_user.id,
        UsageLog.billing_cycle_id.is_(None)
    ).all()
    
    if not unbilled_usage:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="청구할 사용 내역이 없습니다."
        )
    
    # 현재 년월
    now = datetime.now()
    current_year_month = now.strftime("%Y%m")
    
    # 총 사용 금액 계산
    total_usage_amount = sum(float(log.total_price) for log in unbilled_usage)
    
    # 청구서 생성
    billing_cycle = generate_billing_cycle(
        db=db,
        user_id=current_user.id,
        year_month=current_year_month
    )
    
    return {
        "billing_cycle_id": billing_cycle.id,
        "total_amount": float(billing_cycle.total_bill_amount)
    }

