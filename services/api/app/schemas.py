from datetime import datetime
from enum import StrEnum
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class AssetStatus(StrEnum):
    active = "active"
    offline = "offline"
    maintenance = "maintenance"
    retired = "retired"


class TicketPriority(StrEnum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class TicketStatus(StrEnum):
    open = "open"
    in_progress = "in_progress"
    waiting_customer = "waiting_customer"
    resolved = "resolved"
    closed = "closed"


class Tenant(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    name: str
    slug: str


class Asset(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    tenant_id: UUID
    hostname: str
    internal_name: str | None = None
    ip_address: str | None = None
    mac_address: str | None = None
    operating_system: str | None = None
    status: AssetStatus = AssetStatus.active
    last_seen_at: datetime | None = None


class Ticket(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    tenant_id: UUID
    subject: str
    description: str
    priority: TicketPriority = TicketPriority.medium
    status: TicketStatus = TicketStatus.open
    asset_id: UUID | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AgentCheckIn(BaseModel):
    tenant_id: UUID
    hostname: str
    operating_system: str
    agent_version: str
    ip_address: str | None = None
    mac_address: str | None = None


class TelemetrySample(BaseModel):
    tenant_id: UUID
    asset_id: UUID
    cpu_percent: float = Field(ge=0, le=100)
    memory_percent: float = Field(ge=0, le=100)
    disk_free_percent: float = Field(ge=0, le=100)
    recorded_at: datetime = Field(default_factory=datetime.utcnow)


class RemoteCommand(BaseModel):
    tenant_id: UUID
    asset_id: UUID
    command: str


class CommandStatus(StrEnum):
    queued = "queued"
    running = "running"
    completed = "completed"
    failed = "failed"


class CommandUpdate(BaseModel):
    status: CommandStatus
    result_message: str | None = None


class CommandResult(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    tenant_id: UUID
    asset_id: UUID
    command: str
    status: CommandStatus = CommandStatus.queued
    result_message: str | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    started_at: datetime | None = None
    completed_at: datetime | None = None


class DashboardSummary(BaseModel):
    tenants: int
    assets_total: int
    assets_online: int
    assets_offline: int
    tickets_open: int
    tickets_critical: int
    telemetry_samples: int


class Contract(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    tenant_id: UUID
    customer_name: str
    contract_type: str = "monthly"
    monthly_value: float = 0
    hours_included: float = 0
    hours_used: float = 0
    status: str = "active"


class Opportunity(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    tenant_id: UUID
    company: str
    stage: str = "lead"
    value: float = 0
    owner: str = "Comercial"


class KnowledgeArticle(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    tenant_id: UUID
    title: str
    category: str = "Procedimento"
    status: str = "draft"
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class VaultCredential(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    tenant_id: UUID
    name: str
    username: str
    secret_hint: str = "********"
    access_level: str = "restricted"


class AutomationRule(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    tenant_id: UUID
    name: str
    trigger: str
    action: str
    enabled: bool = True
