from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from decimal import Decimal
from datetime import datetime
from app.db.session import get_db
from app.models.user import User
from app.models.billing_cycle import BillingCycle, BillingCycleStatus
from app.models.usage_log import UsageLog
from app.api.v1.auth import get_current_user
from app.crud.billing import generate_billing_cycle

router = APIRouter()


@router.get("/devices")
def get_device_list(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    사용자의 로그인 기기 목록 조회
    """
    try:
        from app.models.device_session import UserDeviceSession
        from sqlalchemy.exc import OperationalError
        
        devices = db.query(UserDeviceSession).filter_by(
            user_id=str(current_user.id)
        ).order_by(UserDeviceSession.last_login.desc()).all()
        
        result = [
            {
                "user_agent": d.user_agent,
                "ip": d.ip,
                "last_login": d.last_login.isoformat() if d.last_login else None,
            }
            for d in devices
        ]
        
        return {"devices": result}
    except OperationalError as e:
        # 테이블이 존재하지 않는 경우 (마이그레이션 전)
        if "Table 'invoice_db.user_device_sessions' doesn't exist" in str(e):
            return {"devices": []}
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"데이터베이스 오류: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"기기 목록 조회 중 오류가 발생했습니다: {str(e)}"
        )


@router.get("/delete/check")
def check_delete_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    회원탈퇴 가능 여부 확인
    
    상태:
    - A: 미결제 billing_cycle (status='pending') 존재
    - B: pending은 없지만 billing_cycle_id=NULL usage_logs 존재
    - C: usage_logs는 있으나 모두 billing_cycle_id != NULL (결제 완료)
    - D: usage_logs가 전혀 없음
    """
    # 미결제 청구서 확인
    unpaid_cycles = db.query(BillingCycle).filter(
        BillingCycle.user_id == current_user.id,
        BillingCycle.status == BillingCycleStatus.PENDING
    ).all()
    
    # 미청구 사용 내역 확인 (billing_cycle_id가 NULL인 usage_logs)
    unbilled_usage = db.query(UsageLog).filter(
        UsageLog.user_id == current_user.id,
        UsageLog.billing_cycle_id.is_(None)
    ).all()
    
    # 과거 사용 내역 확인 (billing_cycle_id가 NULL이 아닌 usage_logs)
    history_usage = db.query(UsageLog).filter(
        UsageLog.user_id == current_user.id,
        UsageLog.billing_cycle_id.isnot(None)
    ).first()
    
    # 상태 판별
    if unpaid_cycles:
        # A 상태: 미결제 청구서 존재
        unpaid_amount = sum(float(cycle.total_bill_amount) for cycle in unpaid_cycles)
        return {
            "state": "A",
            "unpaid_amount": unpaid_amount,
            "unbilled_amount": 0,
            "has_history": history_usage is not None
        }
    elif unbilled_usage:
        # B 상태: 미청구 사용 내역 존재
        unbilled_amount = sum(float(log.total_price) for log in unbilled_usage)
        return {
            "state": "B",
            "unpaid_amount": 0,
            "unbilled_amount": unbilled_amount,
            "has_history": history_usage is not None
        }
    elif history_usage:
        # C 상태: 과거 사용 내역만 존재 (모두 결제 완료)
        return {
            "state": "C",
            "unpaid_amount": 0,
            "unbilled_amount": 0,
            "has_history": True
        }
    else:
        # D 상태: 사용 내역 없음
        return {
            "state": "D",
            "unpaid_amount": 0,
            "unbilled_amount": 0,
            "has_history": False
        }


@router.post("/delete/confirm")
def confirm_delete(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    회원탈퇴 처리
    
    - state='A' 또는 'B'일 경우 403 반환
    - state='C' 또는 'D'일 경우 탈퇴 처리
    """
    # 상태 재확인
    check_result = check_delete_status(current_user, db)
    
    if check_result["state"] in ["A", "B"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"미결제 요금이 있어 탈퇴할 수 없습니다. (상태: {check_result['state']})"
        )
    
    # 탈퇴 처리 (soft delete)
    current_user.is_active = False
    db.commit()
    
    return {
        "success": True,
        "message": "탈퇴가 완료되었습니다. 발행내역은 법령에 따라 보관됩니다."
    }
