from pydantic_settings import BaseSettings
from pathlib import Path
from typing import Optional
import os

# backend 기준 루트
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_FILE = BASE_DIR / ".env"


class Settings(BaseSettings):
    """애플리케이션 설정"""

    # =====================
    # 실행 환경
    # =====================
    ENV: str = "local"  # local | prod

    # =====================
    # DB 설정
    # =====================
    DB_USER: str = ""
    DB_PASSWORD: str = ""
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_NAME: str = "invoice_db"

    # Cloud SQL 전용
    CLOUD_SQL_CONNECTION_NAME: Optional[str] = None
    USE_CLOUD_SQL: bool = False

    # =====================
    # API 설정
    # =====================
    API_V1_PREFIX: str = "/api/v1"

    # =====================
    # 바로빌 설정
    # =====================
    BAROBILL_CERT_KEY: str = ""
    BAROBILL_CORP_NUM: str = ""
    BAROBILL_USE_TEST_SERVER: bool = False

    # =====================
    # JWT
    # =====================
    SECRET_KEY: str = ""
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 90

    # =====================
    # Email
    # =====================
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    SMTP_FROM_NAME: str = "계발이"

    FRONTEND_URL: str = "http://localhost:5173"
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = 60

    model_config = {
        "env_file": str(ENV_FILE) if ENV_FILE.exists() else None,
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
        "env_ignore_empty": True,
        "extra": "ignore",
    }

    @property
    def database_url(self) -> str:
        """
        DB 연결 URL 생성
        - 로컬: TCP
        - Cloud Run: unix_socket (/cloudsql)
        """
        if self.USE_CLOUD_SQL and self.CLOUD_SQL_CONNECTION_NAME:
            return (
                f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
                f"@/{self.DB_NAME}"
                f"?unix_socket=/cloudsql/{self.CLOUD_SQL_CONNECTION_NAME}"
            )

        # 로컬 개발용
        return (
            f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )


settings = Settings()
