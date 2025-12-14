from pydantic_settings import BaseSettings
from pathlib import Path
from typing import Optional

# .env 파일 경로 설정 (backend 디렉토리 기준)
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_FILE = BASE_DIR / ".env"


class Settings(BaseSettings):
    """애플리케이션 설정"""

    # DB 설정
    DB_USER: str = ""
    DB_PASSWORD: str = ""
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_NAME: str = "invoice_db"

    # API 설정
    API_V1_PREFIX: str = "/api/v1"

    # 바로빌 설정
    BAROBILL_CERT_KEY: str = ""
    BAROBILL_CORP_NUM: str = ""
    BAROBILL_USE_TEST_SERVER: bool = False  # 실전 서버 사용

    # JWT 설정
    SECRET_KEY: str = ""
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 90  # Refresh token 만료 시간 (일)

    # 이메일 설정 (SMTP)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""  # 이메일 주소
    SMTP_PASSWORD: str = ""  # 앱 비밀번호 (Gmail의 경우)
    SMTP_FROM_EMAIL: str = ""  # 발신자 이메일
    SMTP_FROM_NAME: str = "계발이"

    # 프론트엔드 URL (비밀번호 재설정 링크용)
    FRONTEND_URL: str = "http://localhost:5173"

    # 비밀번호 재설정 토큰 만료 시간 (분)
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = 60

    model_config = {
        "env_file": str(ENV_FILE) if ENV_FILE.exists() else None,
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
        "env_ignore_empty": True,
        "extra": "ignore",  # .env 파일에 있는 추가 필드(사용하지 않는 Supabase 설정 등) 무시
    }

    @property
    def database_url(self) -> str:
        """데이터베이스 URL 생성"""
        return f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"


settings = Settings()
