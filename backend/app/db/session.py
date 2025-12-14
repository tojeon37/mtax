from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# 데이터베이스 엔진 생성
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,  # 연결 유효성 검사
    pool_recycle=3600,   # 1시간마다 연결 재생성
    echo=False  # SQL 쿼리 로깅 (개발 시 True로 변경 가능)
)

# 세션 팩토리 생성
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base 클래스 (모델들이 상속받을 클래스)
Base = declarative_base()


def get_db():
    """데이터베이스 세션 의존성"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_db_connection():
    """데이터베이스 연결 테스트"""
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True
    except Exception:
        return False

