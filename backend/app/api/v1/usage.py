"""
사용 내역 API
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from app.db.session import get_db
from app.models.user import User
from app.api.v1.auth import get_current_user
from app.schemas.usage import UsageLogResponse
from app.crud.usage import get_usage_logs
from app.models.usage_log import UsageType

router = APIRouter()


@router.get("", response_model=list[UsageLogResponse])
def get_usage_history(
    start_date: Optional[str] = Query(None, description="시작일 (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="종료일 (YYYY-MM-DD)"),
    billing_cycle_id: Optional[int] = Query(None, description="청구 주기 ID"),
    page: int = Query(1, ge=1, description="페이지 번호"),
    limit: int = Query(50, ge=1, le=100, description="페이지당 항목 수"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    사용 내역 조회
    """
    try:
        start_dt = None
        end_dt = None
        
        if start_date:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        
        if end_date:
            end_dt = datetime.strptime(end_date, "%Y-%m-%d")
            # 종료일 포함을 위해 하루 더하기
            end_dt = datetime(end_dt.year, end_dt.month, end_dt.day, 23, 59, 59)
        
        skip = (page - 1) * limit
        logs = get_usage_logs(
            db=db,
            user_id=current_user.id,
            start_date=start_dt,
            end_date=end_dt,
            billing_cycle_id=billing_cycle_id,
            skip=skip,
            limit=limit
        )
        
        return logs
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"날짜 형식이 올바르지 않습니다: {str(e)}"
        )

