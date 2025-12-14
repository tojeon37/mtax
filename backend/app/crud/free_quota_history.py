"""
무료 제공 쿼터 이력 CRUD 함수
"""
from sqlalchemy.orm import Session
from app.models.free_quota_history import FreeQuotaHistory
from typing import Optional


def get_history_by_identifier(
    db: Session,
    user_identifier: str
) -> Optional[FreeQuotaHistory]:
    """
    사용자 식별자(이메일 또는 사업자등록번호)로 무료 제공 이력 조회
    
    Args:
        db: 데이터베이스 세션
        user_identifier: 이메일 또는 사업자등록번호
        
    Returns:
        FreeQuotaHistory 객체 (없으면 None)
    """
    return db.query(FreeQuotaHistory).filter(
        FreeQuotaHistory.user_identifier == user_identifier
    ).first()


def create_history(
    db: Session,
    user_identifier: str,
    free_invoice_total: int = 5,
    free_status_total: int = 5,
    free_invoice_used: int = 0,
    free_status_used: int = 0,
    is_consumed: bool = False
) -> FreeQuotaHistory:
    """
    무료 제공 이력 생성
    
    Args:
        db: 데이터베이스 세션
        user_identifier: 이메일 또는 사업자등록번호
        free_invoice_total: 지급된 총 무료 세금계산서 건수
        free_status_total: 지급된 총 무료 상태조회 건수
        free_invoice_used: 사용한 무료 세금계산서 건수
        free_status_used: 사용한 무료 상태조회 건수
        is_consumed: 무료 제공분 모두 소진 여부
        
    Returns:
        생성된 FreeQuotaHistory 객체
    """
    history = FreeQuotaHistory(
        user_identifier=user_identifier,
        free_invoice_total=free_invoice_total,
        free_status_total=free_status_total,
        free_invoice_used=free_invoice_used,
        free_status_used=free_status_used,
        is_consumed=is_consumed
    )
    
    db.add(history)
    db.commit()
    db.refresh(history)
    
    return history


def update_usage(
    db: Session,
    user_identifier: str,
    free_invoice_used: int = None,
    free_status_used: int = None
) -> Optional[FreeQuotaHistory]:
    """
    무료 제공 사용량 업데이트
    
    Args:
        db: 데이터베이스 세션
        user_identifier: 사용자 식별자
        free_invoice_used: 사용한 무료 세금계산서 건수 (선택)
        free_status_used: 사용한 무료 상태조회 건수 (선택)
        
    Returns:
        업데이트된 FreeQuotaHistory 객체 (없으면 None)
    """
    from datetime import datetime
    
    history = get_history_by_identifier(db, user_identifier)
    
    if history:
        if free_invoice_used is not None:
            history.free_invoice_used = free_invoice_used
        if free_status_used is not None:
            history.free_status_used = free_status_used
        
        # 소진 여부 업데이트
        was_consumed = history.is_consumed
        if history.free_invoice_used >= history.free_invoice_total and history.free_status_used >= history.free_status_total:
            history.is_consumed = True
            # 처음 소진될 때만 consumed_at 기록
            if not was_consumed and history.consumed_at is None:
                history.consumed_at = datetime.utcnow()
        
        db.commit()
        db.refresh(history)
    
    return history


def update_consumed_status(
    db: Session,
    user_identifier: str,
    is_consumed: bool = True
) -> Optional[FreeQuotaHistory]:
    """
    무료 제공분 소진 상태 업데이트
    
    Args:
        db: 데이터베이스 세션
        user_identifier: 이메일 또는 사업자등록번호
        is_consumed: 소진 여부
        
    Returns:
        업데이트된 FreeQuotaHistory 객체 (없으면 None)
    """
    from datetime import datetime
    
    history = get_history_by_identifier(db, user_identifier)
    
    if history:
        history.is_consumed = is_consumed
        # 소진 시점 기록 (처음 소진될 때만 기록)
        if is_consumed and history.consumed_at is None:
            history.consumed_at = datetime.utcnow()
        db.commit()
        db.refresh(history)
    
    return history

