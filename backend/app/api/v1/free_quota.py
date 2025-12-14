"""
무료 제공 쿼터 API
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.api.v1.auth import get_current_user
from app.crud.free_quota import get_or_create_free_quota
from app.crud.free_quota_history import get_history_by_identifier

router = APIRouter()


@router.get("")
def get_free_quota_info(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    무료 제공 쿼터 정보 조회 (무료 소진 팝업 표시 여부 포함)
    """
    quota = get_or_create_free_quota(db, current_user.id)
    
    # 사용자 식별자 결정 (이메일 우선, 없으면 사업자등록번호)
    user_identifier = current_user.email if current_user.email else (current_user.barobill_corp_num if current_user.barobill_corp_num else None)
    
    # 무료 제공 이력 조회 (consumed_at 확인용)
    consumed_at = None
    if user_identifier:
        history = get_history_by_identifier(db, user_identifier)
        if history and history.is_consumed:
            consumed_at = history.consumed_at.isoformat() if history.consumed_at else None
    
    # 무료 소진 팝업 표시 여부 결정
    # 전자세금계산서 무료 제공분 소진 시에만 팝업 표시
    # 사업자상태조회는 전자세금계산서 무료 제공 기간 동안만 무료로 제공되므로 별도 기준 불필요
    show_free_popup = (quota.free_invoice_left == 0)
    
    return {
        "free_invoice_left": quota.free_invoice_left,
        "free_status_left": quota.free_status_left,
        "show_free_popup": show_free_popup,
        "consumed_at": consumed_at  # 소진 시점 (1주일 후 숨김 처리용)
    }

