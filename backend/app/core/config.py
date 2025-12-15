from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DB_USER: str
    DB_PASSWORD: str
    DB_NAME: str

    # TCP용
    DB_HOST: str | None = None
    DB_PORT: str | None = None

    # Cloud SQL Socket용
    INSTANCE_CONNECTION_NAME: str | None = None

    ENV: str = "prod"
    API_V1_PREFIX: str = "/api/v1"

    @property
    def database_url(self) -> str:
        # ✅ TCP 방식
        if self.DB_HOST:
            return (
                f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
                f"@{self.DB_HOST}:{self.DB_PORT or 3306}/{self.DB_NAME}"
            )

        # ✅ Cloud SQL Unix Socket 방식
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
