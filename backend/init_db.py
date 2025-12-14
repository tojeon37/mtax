"""
데이터베이스 테이블 초기화 스크립트

사용법:
    python init_db.py
"""
from app.db.session import Base, engine
from app.models import user, invoice, supplier, recipient, charge

def init_db():
    """데이터베이스 테이블 생성"""
    try:
        print("데이터베이스 테이블 생성 중...")
        Base.metadata.create_all(bind=engine)
        print("✓ 데이터베이스 테이블 생성 완료")
        print("\n생성된 테이블:")
        for table in Base.metadata.tables:
            print(f"  - {table}")
    except Exception as e:
        print(f"✗ 데이터베이스 테이블 생성 실패: {e}")
        raise

if __name__ == "__main__":
    init_db()



