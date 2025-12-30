from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# =========================
# Database Engine
# =========================
engine = create_engine(
    settings.database_url,
    # ✅ Cloud Run / Cloud SQL 안정 옵션
    pool_pre_ping=True,  # 죽은 커넥션 자동 감지
    pool_recycle=1800,  # 30분마다 커넥션 재생성 (Cloud SQL idle timeout 대응)
    # ✅ Serverless 환경 권장 설정
    pool_size=5,  # 기본값보다 명시적으로 작게
    max_overflow=2,  # 순간 트래픽 여유
    pool_timeout=2,  # 커넥션 대기 최대 시간 (2초로 단축 - 느린 서버 즉시 실패)
    # 연결 타임아웃 설정 (느린 서버 즉시 실패)
    connect_args={"connect_timeout": 2},
    # 디버그용
    echo=False,
    future=True,  # SQLAlchemy 2.0 스타일
)

# =========================
# Session Factory
# =========================
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

# =========================
# Base for Models
# =========================
Base = declarative_base()


# =========================
# Dependency
# =========================
def get_db():
    """FastAPI DB dependency"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# =========================
# Connection Test (optional)
# =========================
def test_db_connection() -> bool:
    """Database connection test"""
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True
    except Exception as e:
        print("DB connection test failed:", e)
        return False
