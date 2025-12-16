from pydantic_settings import BaseSettings
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

    @property
    def database_url(self) -> str:
        """
        Cloud Run에서는 DATABASE_URL 하나만 사용
        예:
        mysql+pymysql://user:password@IP:3306/dbname
        """
        return self.DATABASE_URL

    model_config = {
        # 로컬 개발용 (.env)
        # Cloud Run에서는 무시됨
        "env_file": Path(__file__).resolve().parents[2] / ".env",
        "env_file_encoding": "utf-8",
        "env_ignore_empty": True,
        "extra": "ignore",
    }


settings = Settings()
