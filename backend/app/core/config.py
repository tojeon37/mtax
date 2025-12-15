from pydantic_settings import BaseSettings
from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_FILE = BASE_DIR / ".env"


class Settings(BaseSettings):
    # =====================
    # DB 설정
    # =====================
    DB_USER: str = ""
    DB_PASSWORD: str = ""
    DB_NAME: str = "invoice_db"

    # Cloud Run / Cloud SQL
    INSTANCE_CONNECTION_NAME: str | None = None

    # 로컬용 (fallback)
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306

    # =====================
    # 기타 설정
    # =====================
    API_V1_PREFIX: str = "/api/v1"
    ENV: str = "local"

    model_config = {
        "env_file": str(ENV_FILE) if ENV_FILE.exists() else None,
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
        "extra": "ignore",
    }

    @property
    def database_url(self) -> str:
        """
        Cloud Run + Cloud SQL → unix_socket
        Local 개발 → TCP
        """
        if self.INSTANCE_CONNECTION_NAME:
            return (
                f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
                f"@localhost/{self.DB_NAME}"
                f"?unix_socket=/cloudsql/{self.INSTANCE_CONNECTION_NAME}"
            )

        # 로컬 개발용
        return (
            f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )


settings = Settings()
