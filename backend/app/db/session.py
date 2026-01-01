from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# =========================
# Database Engine
# =========================
# SQLite용 설정 (connect_timeout 제거)
if settings.database_url.startswith("sqlite"):
    engine = create_engine(
        settings.database_url,
        connect_args={"check_same_thread": False},
        echo=False,
        future=True,
    )
else:
    # MySQL/PostgreSQL용 설정
    engine = create_engine(
        settings.database_url,
        pool_pre_ping=True,
        pool_recycle=1800,
        pool_size=5,
        max_overflow=2,
        pool_timeout=2,
        connect_args={"connect_timeout": 2},
        echo=False,
        future=True,
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
