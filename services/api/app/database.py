from collections.abc import Generator
from pathlib import Path

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import settings


class Base(DeclarativeBase):
    pass


def build_engine():
    postgres_engine = create_engine(
        settings.database_url,
        pool_pre_ping=True,
        connect_args={"connect_timeout": 3},
    )
    try:
        with postgres_engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return postgres_engine
    except Exception:
        if settings.environment != "local":
            raise

    local_dir = Path(__file__).resolve().parents[2] / "local"
    local_dir.mkdir(parents=True, exist_ok=True)
    sqlite_path = local_dir / "sistech_os.db"
    return create_engine(
        f"sqlite:///{sqlite_path.as_posix()}",
        connect_args={"check_same_thread": False},
    )


engine = build_engine()
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    from app import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
