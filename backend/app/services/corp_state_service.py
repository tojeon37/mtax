"""
사업자 상태 조회 관련 비즈니스 로직 서비스
"""
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models.corp_state_history import CorpStateHistory
from app.models.user import User
from app.crud.usage import record_usage_log
from app.models.usage_log import UsageType
from app.models.billing_charge import BillingCharge, ChargeType
from fastapi import HTTPException, status


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
    def validate_user_quota(user: User):
        """
        사용자의 무료 건수 및 결제수단 확인
        
        Args:
            user: User 객체
            
        Raises:
            HTTPException: 무료 건수가 없고 결제수단도 없는 경우
        
        Note:
            사업자상태조회는 전자세금계산서 무료 제공 기간 동안만 무료로 제공됩니다.
            전자세금계산서 무료 제공분이 소진되면 사업자상태조회도 유료로 전환됩니다.
        """
        # 전자세금계산서 무료 제공 기간 확인 (사업자상태조회는 전자세금계산서 무료 제공 기간 동안만 무료)
        if user.free_invoice_remaining > 0:
            return  # 전자세금계산서 무료 제공 기간이면 사업자상태조회도 무료로 허용
        
        # 전자세금계산서 무료 제공 기간이 종료되면 결제수단 확인
        if not user.has_payment_method:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="무료 제공 기간이 종료되었습니다. 상태조회는 건당 15원이 과금됩니다. 사용을 위해 결제수단을 먼저 등록해주세요."
            )

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
        사업자 상태 조회 이력 저장 및 과금 처리
        
        Args:
            db: 데이터베이스 세션
            user: User 객체
            corp_num: 사업자번호
            state_value: 상태 값
            state_info: 상태 정보 딕셔너리
            corp_name: 회사명
            ceo_name: 대표자명
        """
        try:
            # 조회 이력 저장
            history = CorpStateHistory(
                user_id=user.id,
                corp_num=corp_num,
                state=state_value,
                state_name=state_info["name"],
                corp_name=corp_name,
                ceo_name=ceo_name
            )
            db.add(history)
            
            # 무료 제공 건수 차감 또는 과금 처리
            # 사업자상태조회는 전자세금계산서 무료 제공 기간 동안만 무료로 제공
            if user.free_invoice_remaining > 0:
                # 전자세금계산서 무료 제공 기간이면 사업자상태조회도 무료로 제공 (건수 차감 없음)
                # 사업자상태조회 무료 제공 건수는 별도로 차감하지 않음
                pass
            else:
                # 결제수단이 등록된 경우 과금 처리
                if user.has_payment_method:
                    # 사용 내역 기록 (후불 청구)
                    record_usage_log(
                        db=db,
                        user_id=user.id,
                        usage_type=UsageType.STATUS_CHECK,
                        quantity=1
                    )
                    # BillingCharge 기록
                    charge = BillingCharge(
                        user_id=user.id,
                        charge_type=ChargeType.STATUS_CHECK,
                        amount=15  # 상태조회 건당 15원
                    )
                    db.add(charge)
            
            # 사용자 정보 업데이트 저장
            db.add(user)
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

