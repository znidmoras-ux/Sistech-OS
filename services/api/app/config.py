from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    project_name: str = "Sistech OS"
    environment: str = "local"
    database_url: str = "postgresql+psycopg://sistech:change-me@localhost:5432/sistech_os"
    redis_url: str = "redis://localhost:6379/0"
    rabbitmq_url: str = "amqp://sistech:change-me@localhost:5672/"
    jwt_issuer: str = "sistech-os"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
