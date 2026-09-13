from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_DATABASE_PATH = PROJECT_ROOT / "data" / "expensemate.db"


class Settings(BaseSettings):
    """Application configuration loaded from environment variables or .env."""

    app_name: str = "ExpenseMate"
    database_url: str = f"sqlite:///{DEFAULT_DATABASE_PATH.as_posix()}"

    model_config = SettingsConfigDict(
        env_file=PROJECT_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
