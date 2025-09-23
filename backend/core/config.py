# backend/core/config.py
import secrets
from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://user:pass@localhost/glade"
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 0

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # Security
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Federation
    INSTANCE_DOMAIN: str = "localhost"
    INSTANCE_NAME: str = "Glade Local"
    INSTANCE_DESCRIPTION: str = "A privacy-focused local community"
    FEDERATION_ENABLED: bool = True

    # Privacy
    DEFAULT_LOCATION_RADIUS: int = 1000  # meters
    MAX_LOCATION_RADIUS: int = 50000  # 50km
    LOCATION_FUZZING_RADIUS: int = 100  # ±100m

    # External Services
    ALLOWED_HOSTS: List[str] = ["localhost", "127.0.0.1"]

    # File Upload
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_MEDIA_TYPES: List[str] = ["image/jpeg", "image/png", "image/gif"]

    class Config:
        env_file = ".env"


settings = Settings()
