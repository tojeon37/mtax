"""
무료 제공 쿼터 CRUD 함수
"""
from sqlalchemy.orm import Session
from app.models.free_quota import FreeQuota


def create_free_quota(
    db: Session,
    user_id: int,
    free_invoice_left: int = 5,
    free_status_left: int = 5
) -> FreeQuota:
    """
    무료 제공 쿼터 생성
    
    Args:
        db: 데이터베이스 세션
        user_id: 사용자 ID
        free_invoice_left: 무료 세금계산서 발행 횟수 (기본값 5)
        free_status_left: 무료 상태조회 횟수 (기본값 5)
        
    Returns:
        생성된 FreeQuota 객체
    """
    free_quota = FreeQuota(
        user_id=user_id,
        free_invoice_left=free_invoice_left,
        free_status_left=free_status_left
    )
    
    db.add(free_quota)
    db.commit()
    db.refresh(free_quota)
    
    return free_quota


def get_free_quota(
    db: Session,
    user_id: int
) -> FreeQuota:
    """
    사용자의 무료 제공 쿼터 조회
    
    Args:
        db: 데이터베이스 세션
        user_id: 사용자 ID
        
    Returns:
        FreeQuota 객체 (없으면 None)
    """
    return db.query(FreeQuota).filter(
        FreeQuota.user_id == user_id
    ).first()


def get_or_create_free_quota(
    db: Session,
    user_id: int
) -> FreeQuota:
    """
    무료 제공 쿼터 조회 또는 생성
    
    Args:
        db: 데이터베이스 세션
        user_id: 사용자 ID
        
    Returns:
        FreeQuota 객체
    """
    quota = get_free_quota(db, user_id)
    
    if not quota:
        quota = create_free_quota(db, user_id)
    
    return quota


def use_free_invoice(
    db: Session,
    user_id: int,
    user_identifier: str = None
) -> bool:
    """
    무료 세금계산서 발행 사용
    
    Args:
        db: 데이터베이스 세션
        user_id: 사용자 ID
        user_identifier: 사용자 식별자 (이메일 또는 사업자등록번호, 선택사항)
        
    Returns:
        사용 성공 여부 (남은 횟수가 있으면 True, 없으면 False)
    """
    quota = get_free_quota(db, user_id)
    
    if not quota:
        return False
    
    # 사용 전 잔여량 저장 (소진 상태 체크용)
    was_more_than_zero = quota.free_invoice_left > 0
    
    if quota.free_invoice_left > 0:
        quota.free_invoice_left -= 1
        
        # 무료 제공분이 모두 소진되었는지 확인 및 사용량 업데이트
        if user_identifier:
            from app.crud.free_quota_history import get_history_by_identifier, update_usage, update_consumed_status
            history = get_history_by_identifier(db, user_identifier)
            if history:
                # 사용량 업데이트
                new_used = history.free_invoice_used + 1
                update_usage(db, user_identifier, free_invoice_used=new_used)
                
                # 소진 여부 확인 및 업데이트
                if quota.free_invoice_left == 0:
                    update_consumed_status(db, user_identifier, is_consumed=True)
        
        db.commit()
        return True
    
    return False


def use_free_status_check(
    db: Session,
    user_id: int,
    user_identifier: str = None
) -> bool:
    """
    무료 상태조회 사용
    
    Args:
        db: 데이터베이스 세션
        user_id: 사용자 ID
        user_identifier: 사용자 식별자 (이메일 또는 사업자등록번호, 선택사항)
        
    Returns:
        사용 성공 여부 (남은 횟수가 있으면 True, 없으면 False)
    """
    quota = get_free_quota(db, user_id)
    
    if not quota:
        return False
    
    # 사용 전 잔여량 저장 (소진 상태 체크용)
    was_more_than_zero = quota.free_status_left > 0
    
    if quota.free_status_left > 0:
        quota.free_status_left -= 1
        
        # 무료 제공분이 모두 소진되었는지 확인 및 사용량 업데이트
        if user_identifier:
            from app.crud.free_quota_history import get_history_by_identifier, update_usage, update_consumed_status
            history = get_history_by_identifier(db, user_identifier)
            if history:
                # 사용량 업데이트
                new_used = history.free_status_used + 1
                update_usage(db, user_identifier, free_status_used=new_used)
                
                # 소진 여부 확인 및 업데이트
                if quota.free_status_left == 0:
                    update_consumed_status(db, user_identifier, is_consumed=True)
        
        db.commit()
        return True
    
    return False

