"""
세션 관리 API
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.session import UserSession
from app.api.v1.auth import get_current_user, oauth2_scheme
from app.models.user import User
from app.schemas.session import UserSessionResponse
from datetime import datetime

router = APIRouter()


@router.get("/sessions", response_model=list[UserSessionResponse])
def get_sessions(
    request: Request = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    현재 사용자의 모든 세션 조회

    Args:
        request: HTTP 요청 객체 (현재 토큰 추출용)
        current_user: 현재 로그인한 사용자
        db: 데이터베이스 세션

    Returns:
        세션 목록
    """
    try:
        sessions = db.query(UserSession).filter(UserSession.user_id == current_user.id).all()
        
        # 현재 토큰 추출
        current_token = None
        if request:
            authorization = request.headers.get("Authorization", "")
            if authorization.startswith("Bearer "):
                current_token = authorization.replace("Bearer ", "")
        
        # 현재 토큰과 일치하는 세션이 없으면 현재 세션 생성
        if current_token:
            existing_session = db.query(UserSession).filter(
                UserSession.user_id == current_user.id,
                UserSession.token == current_token
            ).first()
            
            if not existing_session:
                # 현재 세션이 DB에 없으면 생성
                try:
                    user_agent = request.headers.get("User-Agent", "Unknown Device") if request else "Unknown Device"
                    ip_address = request.client.host if request else "Unknown"
                    
                    device_name = user_agent
                    if len(device_name) > 255:
                        device_name = device_name[:255]
                    
                    new_session = UserSession(
                        user_id=current_user.id,
                        device_name=device_name,
                        ip_address=ip_address,
                        login_time=datetime.utcnow(),
                        last_seen=datetime.utcnow(),
                        user_agent=user_agent,
                        token=current_token
                    )
                    db.add(new_session)
                    db.commit()
                    db.refresh(new_session)
                    
                    # 새로 생성한 세션을 목록에 추가
                    sessions.append(new_session)
                    pass
                except Exception:
                    pass
                    db.rollback()
        
        return sessions if sessions else []
    except Exception as e:
        # 테이블이 없거나 다른 오류 발생 시 빈 배열 반환
        import traceback
        traceback.print_exc()
        return []


@router.delete("/sessions/{session_id}")
def delete_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    특정 세션 삭제 (해당 기기 로그아웃)

    Args:
        session_id: 삭제할 세션 ID
        current_user: 현재 로그인한 사용자
        db: 데이터베이스 세션

    Returns:
        삭제 결과
    """
    session = db.query(UserSession).filter(
        UserSession.id == session_id,
        UserSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="세션을 찾을 수 없습니다."
        )
    
    db.delete(session)
    db.commit()
    
    return {"success": True, "message": "세션이 삭제되었습니다."}


@router.delete("/sessions")
def delete_all_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    현재 사용자의 모든 세션 삭제 (모든 기기 로그아웃)

    Args:
        current_user: 현재 로그인한 사용자
        db: 데이터베이스 세션

    Returns:
        삭제 결과
    """
    deleted_count = db.query(UserSession).filter(
        UserSession.user_id == current_user.id
    ).delete()
    
    db.commit()
    
    return {
        "success": True,
        "message": f"{deleted_count}개의 세션이 삭제되었습니다."
    }

