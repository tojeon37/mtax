from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DB_USER: str
    DB_PASSWORD: str
    DB_NAME: str
    INSTANCE_CONNECTION_NAME: str | None = None

    ENV: str = "prod"
    API_V1_PREFIX: str = "/api/v1"

    @property
    def database_url(self) -> str:
        """
        Database URL
        - Cloud Run: Cloud SQL Unix Socket (PyMySQL requires host)
        - Local: TCP localhost
        """
        # Cloud Run
        if self.INSTANCE_CONNECTION_NAME:
            return (
                f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
                f"@localhost/{self.DB_NAME}"
                f"?unix_socket=/cloudsql/{self.INSTANCE_CONNECTION_NAME}"
            )

        # Local
        return (
            f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@localhost:3306/{self.DB_NAME}"
        )

    model_config = {
        "env_ignore_empty": True,
        "extra": "ignore",
    }


settings = Settings()
print("DATABASE_URL =", settings.database_url)
