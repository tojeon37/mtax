from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    DB_USER: str
    DB_PASSWORD: str
    DB_NAME: str
    DB_HOST: Optional[str] = None
    DB_PORT: Optional[int] = 3306
    INSTANCE_CONNECTION_NAME: Optional[str] = None
    ENV: str = "prod"

    API_V1_PREFIX: str = "/api/v1"

    @property
    def database_url(self) -> str:
        """
        TCP 연결 방식 (Public IP)
        """
        if self.DB_HOST:
            # TCP 연결 사용
            return (
                f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
                f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
            )
        else:
            # Unix Socket 연결 사용
            return (
                f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
                f"@/{self.DB_NAME}"
                f"?unix_socket=/cloudsql/{self.INSTANCE_CONNECTION_NAME}"
            )

    model_config = {
        "env_ignore_empty": True,
        "extra": "ignore",
    }


settings = Settings()
print("DATABASE_URL =", settings.database_url)
