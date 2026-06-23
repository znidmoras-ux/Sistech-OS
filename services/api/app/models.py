from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Enum, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.schemas import AssetStatus, CommandStatus


class TenantModel(Base):
    __tablename__ = "tenants"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)

    assets: Mapped[list["AssetModel"]] = relationship(back_populates="tenant")


class AssetModel(Base):
    __tablename__ = "assets"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    tenant_id: Mapped[UUID] = mapped_column(ForeignKey("tenants.id"), nullable=False, index=True)
    hostname: Mapped[str] = mapped_column(String(255), nullable=False)
    internal_name: Mapped[str | None] = mapped_column(String(255))
    ip_address: Mapped[str | None] = mapped_column(String(64))
    mac_address: Mapped[str | None] = mapped_column(String(64))
    operating_system: Mapped[str | None] = mapped_column(String(255))
    status: Mapped[AssetStatus] = mapped_column(Enum(AssetStatus), default=AssetStatus.active)
    last_seen_at: Mapped[datetime | None] = mapped_column(DateTime)
    agent_version: Mapped[str | None] = mapped_column(String(64))

    tenant: Mapped[TenantModel] = relationship(back_populates="assets")
    telemetry_samples: Mapped[list["TelemetryModel"]] = relationship(back_populates="asset")
    commands: Mapped[list["CommandModel"]] = relationship(back_populates="asset")


class TelemetryModel(Base):
    __tablename__ = "telemetry_samples"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    tenant_id: Mapped[UUID] = mapped_column(ForeignKey("tenants.id"), nullable=False, index=True)
    asset_id: Mapped[UUID] = mapped_column(ForeignKey("assets.id"), nullable=False, index=True)
    cpu_percent: Mapped[float] = mapped_column(Float, nullable=False)
    memory_percent: Mapped[float] = mapped_column(Float, nullable=False)
    disk_free_percent: Mapped[float] = mapped_column(Float, nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    asset: Mapped[AssetModel] = relationship(back_populates="telemetry_samples")


class CommandModel(Base):
    __tablename__ = "rmm_commands"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    tenant_id: Mapped[UUID] = mapped_column(ForeignKey("tenants.id"), nullable=False, index=True)
    asset_id: Mapped[UUID] = mapped_column(ForeignKey("assets.id"), nullable=False, index=True)
    command: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[CommandStatus] = mapped_column(Enum(CommandStatus), default=CommandStatus.queued)
    result_message: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    started_at: Mapped[datetime | None] = mapped_column(DateTime)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime)

    asset: Mapped[AssetModel] = relationship(back_populates="commands")
