"""특정 사용자와 관련된 모든 데이터 삭제 스크립트"""

import sys
from pathlib import Path

# backend 디렉토리를 Python 경로에 추가
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.db.session import SessionLocal
from app.models.user import User
from app.models.recipient import Recipient
from app.models.supplier import Supplier
from app.models.invoice import Invoice
from app.models.client import Client
from app.models.company import Company
from app.models.billing_charge import BillingCharge
from app.models.usage_log import UsageLog
from app.models.payment_method import PaymentMethod
from app.models.payment import Payment
from app.models.billing_cycle import BillingCycle
from app.models.free_quota import FreeQuota
from app.models.free_quota_history import FreeQuotaHistory
from app.models.corp_state_history import CorpStateHistory
from app.models.device_session import UserDeviceSession
from app.models.user_profile import UserProfile
from app.models.session import UserSession
from app.models.tax_invoice_issue import TaxInvoiceIssue


def delete_user(barobill_id: str):
    """특정 사용자와 관련된 모든 데이터 삭제"""
    db = SessionLocal()
    try:
        # 사용자 찾기
        user = db.query(User).filter(User.barobill_id == barobill_id).first()

        if not user:
            print(f"❌ 사용자 '{barobill_id}'를 찾을 수 없습니다.")
            return

        user_id = user.id
        print(
            f"✓ 사용자 찾음: id={user_id}, barobill_id={user.barobill_id}, email={user.email}"
        )

        # 확인
        print(
            f"\n⚠️  경고: 사용자 '{barobill_id}' (id: {user_id})와 관련된 모든 데이터를 삭제합니다."
        )
        print("삭제될 데이터:")

        # 관련 데이터 확인
        recipients_count = (
            db.query(Recipient).filter(Recipient.user_id == user_id).count()
        )
        suppliers_count = db.query(Supplier).filter(Supplier.user_id == user_id).count()
        invoices_count = db.query(Invoice).filter(Invoice.user_id == user_id).count()
        clients_count = db.query(Client).filter(Client.user_id == user_id).count()
        companies_count = db.query(Company).filter(Company.user_id == user_id).count()
        billing_charges_count = (
            db.query(BillingCharge).filter(BillingCharge.user_id == user_id).count()
        )
        usage_logs_count = (
            db.query(UsageLog).filter(UsageLog.user_id == user_id).count()
        )
        payment_methods_count = (
            db.query(PaymentMethod).filter(PaymentMethod.user_id == user_id).count()
        )
        payments_count = db.query(Payment).filter(Payment.user_id == user_id).count()
        billing_cycles_count = (
            db.query(BillingCycle).filter(BillingCycle.user_id == user_id).count()
        )
        free_quota_count = (
            db.query(FreeQuota).filter(FreeQuota.user_id == user_id).count()
        )
        corp_state_history_count = (
            db.query(CorpStateHistory)
            .filter(CorpStateHistory.user_id == user_id)
            .count()
        )
        device_sessions_count = (
            db.query(UserDeviceSession)
            .filter(UserDeviceSession.user_id == str(user_id))
            .count()
        )
        user_profiles_count = (
            db.query(UserProfile).filter(UserProfile.user_id == user_id).count()
        )
        sessions_count = (
            db.query(UserSession).filter(UserSession.user_id == user_id).count()
        )
        tax_invoice_issues_count = (
            db.query(TaxInvoiceIssue).filter(TaxInvoiceIssue.user_id == user_id).count()
        )

        # FreeQuotaHistory는 user_identifier로 검색 (이메일 또는 사업자번호)
        user_identifier = (
            user.email
            if user.email
            else (user.barobill_corp_num if user.barobill_corp_num else None)
        )
        free_quota_history_count = 0
        if user_identifier:
            free_quota_history_count = (
                db.query(FreeQuotaHistory)
                .filter(FreeQuotaHistory.user_identifier == user_identifier)
                .count()
            )

        print(f"  - 거래처 (recipients): {recipients_count}건")
        print(f"  - 공급자 (suppliers): {suppliers_count}건")
        print(f"  - 세금계산서 (invoices): {invoices_count}건")
        print(f"  - 거래처 (clients): {clients_count}건")
        print(f"  - 우리회사 (companies): {companies_count}건")
        print(f"  - 과금 내역 (billing_charges): {billing_charges_count}건")
        print(f"  - 사용 내역 (usage_logs): {usage_logs_count}건")
        print(f"  - 결제수단 (payment_methods): {payment_methods_count}건")
        print(f"  - 결제 내역 (payments): {payments_count}건")
        print(f"  - 청구 주기 (billing_cycles): {billing_cycles_count}건")
        print(f"  - 무료 쿼터 (free_quota): {free_quota_count}건")
        print(f"  - 무료 쿼터 이력 (free_quota_history): {free_quota_history_count}건")
        print(
            f"  - 사업자 상태 조회 이력 (corp_state_history): {corp_state_history_count}건"
        )
        print(f"  - 디바이스 세션 (device_sessions): {device_sessions_count}건")
        print(f"  - 사용자 프로필 (user_profiles): {user_profiles_count}건")
        print(f"  - 세션 (sessions): {sessions_count}건")
        print(
            f"  - 전자세금계산서 발행 정보 (tax_invoice_issues): {tax_invoice_issues_count}건 (법령에 따라 보관)"
        )
        print(f"  - 사용자 (users): 1건")

        # 사용자 확인 (명령줄 인자로 --force가 있으면 확인 생략)
        force = "--force" in sys.argv
        if not force:
            confirm = input("\n정말 삭제하시겠습니까? (yes/no): ")
            if confirm.lower() != "yes":
                print("❌ 삭제가 취소되었습니다.")
                return

        # 관련 데이터 삭제 (외래키 제약조건 때문에 순서 중요)
        print("\n삭제 중...")

        # 1. UsageLog 삭제 (BillingCycle에 의존할 수 있지만 user_id로 직접 삭제 가능)
        if usage_logs_count > 0:
            db.query(UsageLog).filter(UsageLog.user_id == user_id).delete()
            print(f"✓ 사용 내역 {usage_logs_count}건 삭제 완료")

        # 2. Payment 삭제 (BillingCycle에 의존하지만 user_id로 직접 삭제 가능)
        if payments_count > 0:
            db.query(Payment).filter(Payment.user_id == user_id).delete()
            print(f"✓ 결제 내역 {payments_count}건 삭제 완료")

        # 3. BillingCycle 삭제 (Payment와 UsageLog가 이미 삭제됨)
        if billing_cycles_count > 0:
            db.query(BillingCycle).filter(BillingCycle.user_id == user_id).delete()
            print(f"✓ 청구 주기 {billing_cycles_count}건 삭제 완료")

        # 4. BillingCharge 삭제
        if billing_charges_count > 0:
            db.query(BillingCharge).filter(BillingCharge.user_id == user_id).delete()
            print(f"✓ 과금 내역 {billing_charges_count}건 삭제 완료")

        # 5. PaymentMethod 삭제
        if payment_methods_count > 0:
            db.query(PaymentMethod).filter(PaymentMethod.user_id == user_id).delete()
            print(f"✓ 결제수단 {payment_methods_count}건 삭제 완료")

        # 6. CorpStateHistory 삭제
        if corp_state_history_count > 0:
            db.query(CorpStateHistory).filter(
                CorpStateHistory.user_id == user_id
            ).delete()
            print(f"✓ 사업자 상태 조회 이력 {corp_state_history_count}건 삭제 완료")

        # 7. FreeQuotaHistory 삭제 (user_identifier로 검색)
        if free_quota_history_count > 0 and user_identifier:
            db.query(FreeQuotaHistory).filter(
                FreeQuotaHistory.user_identifier == user_identifier
            ).delete()
            print(f"✓ 무료 쿼터 이력 {free_quota_history_count}건 삭제 완료")

        # 8. FreeQuota 삭제
        if free_quota_count > 0:
            db.query(FreeQuota).filter(FreeQuota.user_id == user_id).delete()
            print(f"✓ 무료 쿼터 {free_quota_count}건 삭제 완료")

        # 9. UserDeviceSession 삭제 (user_id가 String 타입)
        if device_sessions_count > 0:
            db.query(UserDeviceSession).filter(
                UserDeviceSession.user_id == str(user_id)
            ).delete()
            print(f"✓ 디바이스 세션 {device_sessions_count}건 삭제 완료")

        # 10. UserProfile 삭제
        if user_profiles_count > 0:
            db.query(UserProfile).filter(UserProfile.user_id == user_id).delete()
            print(f"✓ 사용자 프로필 {user_profiles_count}건 삭제 완료")

        # 11. UserSession 삭제
        if sessions_count > 0:
            db.query(UserSession).filter(UserSession.user_id == user_id).delete()
            print(f"✓ 세션 {sessions_count}건 삭제 완료")

        # 12. Client 삭제
        if clients_count > 0:
            db.query(Client).filter(Client.user_id == user_id).delete()
            print(f"✓ 거래처 {clients_count}건 삭제 완료")

        # 13. Company 삭제
        if companies_count > 0:
            db.query(Company).filter(Company.user_id == user_id).delete()
            print(f"✓ 우리회사 {companies_count}건 삭제 완료")

        # 14. Invoice 삭제
        if invoices_count > 0:
            db.query(Invoice).filter(Invoice.user_id == user_id).delete()
            print(f"✓ 세금계산서 {invoices_count}건 삭제 완료")

        # 15. Recipient 삭제
        if recipients_count > 0:
            db.query(Recipient).filter(Recipient.user_id == user_id).delete()
            print(f"✓ 거래처 (recipients) {recipients_count}건 삭제 완료")

        # 16. Supplier 삭제
        if suppliers_count > 0:
            db.query(Supplier).filter(Supplier.user_id == user_id).delete()
            print(f"✓ 공급자 {suppliers_count}건 삭제 완료")

        # 17. TaxInvoiceIssue는 법령에 따라 5년 보관 필요하므로 삭제하지 않음
        if tax_invoice_issues_count > 0:
            print(
                f"⚠️  전자세금계산서 발행 정보 {tax_invoice_issues_count}건은 법령에 따라 보관되므로 삭제하지 않습니다."
            )

        # 18. User 삭제 (마지막)
        db.delete(user)
        print(f"✓ 사용자 삭제 완료")

        # 커밋
        db.commit()
        print(f"\n✅ 사용자 '{barobill_id}'와 관련된 모든 데이터가 삭제되었습니다.")
        if tax_invoice_issues_count > 0:
            print(
                f"⚠️  참고: 전자세금계산서 발행 정보 {tax_invoice_issues_count}건은 법령에 따라 보관 중입니다."
            )

    except Exception as e:
        db.rollback()
        print(f"\n❌ 오류 발생: {e}")
        import traceback

        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("사용법: python delete_user.py <barobill_id> [--force]")
        print("예시: python delete_user.py tojoen37")
        print("예시: python delete_user.py tojoen37 --force")
        sys.exit(1)

    barobill_id = sys.argv[1]
    delete_user(barobill_id)
