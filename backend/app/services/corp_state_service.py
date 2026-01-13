"""
사업자 상태 조회 관련 비즈니스 로직 서비스
"""
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.corp_state_history import CorpStateHistory
from app.models.user import User
from app.models.tax_invoice_issue import TaxInvoiceIssue
from fastapi import HTTPException, status

# 무료 발행 기본 제공 수량 상수
FREE_INVOICE_QUOTA = 5


def calculate_free_invoice_remaining(db: Session, user_id: int) -> int:
    """
    무료 발행 잔여 건수 계산
    
    Args:
        db: 데이터베이스 세션
        user_id: 사용자 ID
        
    Returns:
        잔여 무료 발행 건수
    """
    # 사용된 무료 발행 건수 계산 (TaxInvoiceIssue 테이블에서 발행 성공한 건수)
    used_count = db.query(TaxInvoiceIssue).filter(
        TaxInvoiceIssue.user_id == user_id,
        TaxInvoiceIssue.barobill_result_code > 0  # 발행 성공한 건수만 카운트
    ).count()
    
    # 잔여 건수 계산
    return max(0, FREE_INVOICE_QUOTA - used_count)


class CorpStateService:
    """사업자 상태 조회 관련 비즈니스 로직"""

    @staticmethod
    def get_state_mapping() -> dict:
        """
        사업자 상태 매핑 정보 반환
        
        Returns:
            상태 매핑 딕셔너리
        """
        return {
            0: {"name": "미등록", "description": "사업자등록이 되어있지 않은 상태입니다."},
            1: {"name": "정상", "description": "정상적으로 사업을 운영 중인 상태입니다."},
            2: {"name": "휴업", "description": "일시적으로 사업을 중단한 상태입니다."},
            3: {"name": "폐업", "description": "사업을 종료한 상태입니다."},
            4: {"name": "간이과세", "description": "간이과세자로 등록된 상태입니다."},
            5: {"name": "면세사업자", "description": "부가가치세 면세 사업자입니다."},
            6: {"name": "기타(직권폐업 등)", "description": "직권폐업 등 기타 상태입니다."},
            7: {"name": "조회불가", "description": "사업자 상태를 조회할 수 없습니다."},
        }

    @staticmethod
    def get_invoice_usage_info(db: Session, user_id: int) -> dict:
        """
        발행 사용량 정보 조회 (상태조회 API용)
        
        Args:
            db: 데이터베이스 세션
            user_id: 사용자 ID
            
        Returns:
            {
                "free_invoice_quota": 5,
                "free_invoice_used": used_count,
                "free_invoice_remaining": max(0, 5 - used_count),
                "invoice_issue_is_paid": used_count >= 5
            }
        """
        used_count = db.query(TaxInvoiceIssue).filter(
            TaxInvoiceIssue.user_id == user_id,
            TaxInvoiceIssue.barobill_result_code > 0  # 발행 성공한 건수만 카운트
        ).count()
        
        return {
            "free_invoice_quota": FREE_INVOICE_QUOTA,
            "free_invoice_used": used_count,
            "free_invoice_remaining": max(0, FREE_INVOICE_QUOTA - used_count),
            "invoice_issue_is_paid": used_count >= FREE_INVOICE_QUOTA
        }

    @staticmethod
    def save_corp_state_history(
        db: Session,
        user: User,
        corp_num: str,
        state_value: int,
        state_info: dict,
        corp_name: str = "",
        ceo_name: str = ""
    ):
        """
        사업자 상태 조회 이력 저장 (과금 없음)
        
        Args:
            db: 데이터베이스 세션
            user: User 객체
            corp_num: 사업자번호
            state_value: 상태 값
            state_info: 상태 정보 딕셔너리
            corp_name: 회사명
            ceo_name: 대표자명
        
        Note:
            상태조회는 항상 무료로 제공됩니다.
            과금/차단 로직은 발행 API에서만 적용됩니다.
        """
        try:
            # 조회 이력 저장만 수행 (과금 없음)
            history = CorpStateHistory(
                user_id=user.id,
                corp_num=corp_num,
                state=state_value,
                state_name=state_info["name"],
                corp_name=corp_name,
                ceo_name=ceo_name
            )
            db.add(history)
            db.commit()
        except HTTPException:
            raise
        except Exception:
            db.rollback()
            # 이력 저장 실패해도 조회 결과는 반환

    @staticmethod
    def get_corp_state_history(
        db: Session,
        user_id: int,
        corp_num: str
    ) -> dict:
        """
        사업자 상태 조회 이력 조회
        
        Args:
            db: 데이터베이스 세션
            user_id: 사용자 ID
            corp_num: 사업자번호
            
        Returns:
            조회 이력 정보 딕셔너리
        """
        corp_num_clean = corp_num.replace("-", "").strip()
        
        # 최근 조회 이력 조회
        history = db.query(CorpStateHistory).filter(
            CorpStateHistory.user_id == user_id,
            CorpStateHistory.corp_num == corp_num_clean
        ).order_by(desc(CorpStateHistory.created_at)).first()
        
        if history:
            return {
                "success": True,
                "last_checked_at": history.created_at.isoformat(),
                "state_name": history.state_name,
                "state": history.state,
            }
        
        return {
            "success": False,
            "message": "조회 이력이 없습니다."
        }

