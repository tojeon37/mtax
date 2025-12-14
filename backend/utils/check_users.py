"""데이터베이스에 저장된 사용자 정보 확인 스크립트"""
import sys
from pathlib import Path

# backend 디렉토리를 Python 경로에 추가
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.db.session import SessionLocal
from app.models.user import User

def check_users():
    """데이터베이스에 저장된 사용자 정보 확인"""
    print("데이터베이스 연결 시도 중...")
    db = SessionLocal()
    try:
        print("사용자 조회 중...")
        users = db.query(User).all()
        
        if not users:
            print("\n⚠ 데이터베이스에 사용자가 없습니다.")
            print("회원가입을 먼저 진행해주세요.")
            return
        
        print("\n" + "=" * 60)
        print("데이터베이스에 저장된 사용자 정보")
        print("=" * 60)
        
        for user in users:
            print(f"\n사용자 ID: {user.id}")
            print(f"바로빌 아이디: {user.barobill_id}")
            print(f"비즈니스명: {user.biz_name}")
            print(f"이메일: {user.email or '(없음)'}")
            print(f"활성화 상태: {user.is_active}")
            print(f"잔액: {user.balance or 0}원")
            print(f"생성일: {user.created_at}")
            print(f"비밀번호 해시: {user.password_hash[:30]}... (보안상 일부만 표시)")
            print("-" * 60)
        
        print(f"\n총 {len(users)}명의 사용자가 등록되어 있습니다.")
        print("\n⚠ 비밀번호는 해시로 저장되어 있어 원본을 확인할 수 없습니다.")
        print("비밀번호를 잊으셨다면 회원가입을 다시 진행하거나 비밀번호 재설정 기능을 사용하세요.")
        
    except Exception as e:
        print(f"\n❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()
        print("\n데이터베이스 연결 종료.")

if __name__ == "__main__":
    try:
        check_users()
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

