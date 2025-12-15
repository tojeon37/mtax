from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DB_USER: str
    DB_PASSWORD: str
    DB_NAME: str
    INSTANCE_CONNECTION_NAME: str
    ENV: str = "prod"

    API_V1_PREFIX: str = "/api/v1"

    @property
    def database_url(self) -> str:
        """
        Cloud Run + Cloud SQL (Unix Socket)
        """
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
