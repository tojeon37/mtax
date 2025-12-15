from pydantic_settings import BaseSettings
from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_FILE = BASE_DIR / ".env"


class Settings(BaseSettings):
    # DB 기본 정보
    DB_USER: str = ""
    DB_PASSWORD: str = ""
    DB_NAME: str = ""

    # Cloud Run 전용
    INSTANCE_CONNECTION_NAME: str = ""
    ENV: str = "local"  # local | prod

    API_V1_PREFIX: str = "/api/v1"

    model_config = {
        "env_file": str(ENV_FILE) if ENV_FILE.exists() else None,
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
    }

    @property
    def database_url(self) -> str:
        """
        Cloud Run (prod): unix_socket 사용
        Local (dev): localhost TCP
        """
        if self.ENV == "prod":
            return (
                f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}@/"
                f"{self.DB_NAME}"
                f"?unix_socket=/cloudsql/{self.INSTANCE_CONNECTION_NAME}"
            )

        # local
        return (
            f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@localhost:3306/{self.DB_NAME}"
        )


settings = Settings()
