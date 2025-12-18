from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path
from typing import Optional


class Settings(BaseSettings):
    # =========================
    # Database (Cloud Run 기준)
    # =========================
    DATABASE_URL: str  # Cloud Run 환경변수에서 반드시 주입

    # =========================
    # App Environment
    # =========================
    ENV: str = "production"
    API_V1_PREFIX: str = "/api/v1"

    # =========================
    # JWT & Security
    # =========================
    SECRET_KEY: str = (
        "your-secret-key-change-in-production"  # Cloud Run 환경변수에서 주입 권장
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = 30

    # =========================
    # 바로빌 파트너 설정 (필수 - 회원가입 시 바로빌 연동에 필요)
    # 파트너 인증키를 사용하여 하위 회원사를 바로빌에 등록/관리
    # =========================
    BAROBILL_CERT_KEY: Optional[str] = (
        None  # 파트너 인증키 (회원가입 시 바로빌 연동에 필요)
    )
    BAROBILL_CORP_NUM: Optional[str] = (
        None  # 파트너 사업자번호 (하이픈 없이, 회원가입 시 바로빌 연동에 필요)
    )
    BAROBILL_USE_TEST_SERVER: bool = (
        False  # 테스트 서버 사용 여부 (운영: false, 테스트: true)
    )

    @property
    def database_url(self) -> str:
        """
        Cloud Run에서는 DATABASE_URL 하나만 사용
        예:
        mysql+pymysql://user:password@IP:3306/dbname
        """
        return self.DATABASE_URL

    model_config = SettingsConfigDict(
        # 로컬 개발용 (.env)
        # Cloud Run에서는 무시됨
        env_file=Path(__file__).resolve().parents[2] / ".env",
        env_file_encoding="utf-8",
        env_ignore_empty=True,
        extra="ignore",
        populate_by_name=True,  # 환경변수 이름 매칭 개선
    )


settings = Settings()
