from contextlib import asynccontextmanager
from datetime import datetime
from uuid import UUID, uuid4

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db, init_db
from app.models import AssetModel, CommandModel, TelemetryModel, TenantModel
from app.rmm import sync_all_asset_statuses, sync_asset_online_status
from app.schemas import (
    AgentCheckIn,
    Asset,
    AssetStatus,
    AutomationRule,
    CommandResult,
    CommandStatus,
    CommandUpdate,
    Contract,
    DashboardSummary,
    KnowledgeArticle,
    Opportunity,
    RemoteCommand,
    TelemetrySample,
    Tenant,
    Ticket,
    TicketPriority,
    VaultCredential,
)
from app.seed_data import (
    DEMO_ASSET_NOTE,
    DEMO_ASSET_PDV,
    DEMO_ASSET_SRV,
    DEMO_TENANT_ID,
    seed_demo_data,
)

AGENT_VERSION = "0.1.0"


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    db = next(get_db())
    try:
        seed_demo_data(db)
    finally:
        db.close()
    yield


app = FastAPI(title=settings.project_name, version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:3000", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ticket_a = uuid4()
ticket_b = uuid4()
demo_tickets: dict[UUID, Ticket] = {
    ticket_a: Ticket(
        id=ticket_a,
        tenant_id=DEMO_TENANT_ID,
        subject="CPU alta no servidor de dominio",
        description="Monitoramento apontou CPU acima de 90% por mais de 10 minutos.",
        priority=TicketPriority.high,
        asset_id=DEMO_ASSET_SRV,
    ),
    ticket_b: Ticket(
        id=ticket_b,
        tenant_id=DEMO_TENANT_ID,
        subject="PDV offline",
        description="Equipamento sem check-in recente e sem resposta de ping.",
        priority=TicketPriority.critical,
        asset_id=DEMO_ASSET_PDV,
    ),
}
contract_a = uuid4()
demo_contracts: dict[UUID, Contract] = {
    contract_a: Contract(
        id=contract_a,
        tenant_id=DEMO_TENANT_ID,
        customer_name="Empresa Demo",
        contract_type="monthly",
        monthly_value=4500,
        hours_included=40,
        hours_used=18,
    )
}
opportunity_a = uuid4()
demo_opportunities: dict[UUID, Opportunity] = {
    opportunity_a: Opportunity(
        id=opportunity_a,
        tenant_id=DEMO_TENANT_ID,
        company="Clínica Norte",
        stage="proposal",
        value=8200,
        owner="Ana",
    )
}
article_a = uuid4()
demo_articles: dict[UUID, KnowledgeArticle] = {
    article_a: KnowledgeArticle(
        id=article_a,
        tenant_id=DEMO_TENANT_ID,
        title="Procedimento de reset de senha Microsoft 365",
        category="Microsoft 365",
        status="published",
    )
}
credential_a = uuid4()
demo_credentials: dict[UUID, VaultCredential] = {
    credential_a: VaultCredential(
        id=credential_a,
        tenant_id=DEMO_TENANT_ID,
        name="Firewall matriz",
        username="admin",
        secret_hint="********",
    )
}
automation_a = uuid4()
demo_automations: dict[UUID, AutomationRule] = {
    automation_a: AutomationRule(
        id=automation_a,
        tenant_id=DEMO_TENANT_ID,
        name="Abrir chamado para equipamento offline",
        trigger="asset_offline_10min",
        action="create_critical_ticket",
    )
}


def tenant_to_schema(tenant: TenantModel) -> Tenant:
    return Tenant(id=tenant.id, name=tenant.name, slug=tenant.slug)


def asset_to_schema(asset: AssetModel) -> Asset:
    return Asset(
        id=asset.id,
        tenant_id=asset.tenant_id,
        hostname=asset.hostname,
        internal_name=asset.internal_name,
        ip_address=asset.ip_address,
        mac_address=asset.mac_address,
        operating_system=asset.operating_system,
        status=asset.status,
        last_seen_at=asset.last_seen_at,
    )


def telemetry_to_schema(sample: TelemetryModel) -> TelemetrySample:
    return TelemetrySample(
        tenant_id=sample.tenant_id,
        asset_id=sample.asset_id,
        cpu_percent=sample.cpu_percent,
        memory_percent=sample.memory_percent,
        disk_free_percent=sample.disk_free_percent,
        recorded_at=sample.recorded_at,
    )


def command_to_schema(command: CommandModel) -> CommandResult:
    return CommandResult(
        id=command.id,
        tenant_id=command.tenant_id,
        asset_id=command.asset_id,
        command=command.command,
        status=command.status,
        result_message=command.result_message,
        created_at=command.created_at,
        started_at=command.started_at,
        completed_at=command.completed_at,
    )


def get_tenant_or_404(db: Session, tenant_id: UUID) -> TenantModel:
    tenant = db.get(TenantModel, tenant_id)
    if tenant is None:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant


def get_asset_or_404(db: Session, asset_id: UUID) -> AssetModel:
    asset = db.get(AssetModel, asset_id)
    if asset is None:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "api",
        "environment": settings.environment,
    }


@app.get("/v1/tenants")
def list_tenants(db: Session = Depends(get_db)) -> list[Tenant]:
    return [tenant_to_schema(tenant) for tenant in db.query(TenantModel).all()]


@app.get("/v1/dashboard")
def dashboard_summary(db: Session = Depends(get_db)) -> DashboardSummary:
    sync_all_asset_statuses(db)
    assets = db.query(AssetModel).all()
    open_tickets = [ticket for ticket in demo_tickets.values() if ticket.status != "closed"]
    telemetry_count = db.query(TelemetryModel).count()

    return DashboardSummary(
        tenants=db.query(TenantModel).count(),
        assets_total=len(assets),
        assets_online=sum(1 for asset in assets if asset.status == AssetStatus.active),
        assets_offline=sum(1 for asset in assets if asset.status == AssetStatus.offline),
        tickets_open=len(open_tickets),
        tickets_critical=sum(1 for ticket in open_tickets if ticket.priority == TicketPriority.critical),
        telemetry_samples=telemetry_count,
    )


@app.get("/v1/assets")
def list_assets(db: Session = Depends(get_db)) -> list[Asset]:
    assets = db.query(AssetModel).order_by(AssetModel.hostname).all()
    for asset in assets:
        sync_asset_online_status(asset)
    db.commit()
    return [asset_to_schema(asset) for asset in assets]


@app.post("/v1/assets", status_code=201)
def create_asset(asset: Asset, db: Session = Depends(get_db)) -> Asset:
    get_tenant_or_404(db, asset.tenant_id)
    model = AssetModel(
        id=asset.id,
        tenant_id=asset.tenant_id,
        hostname=asset.hostname,
        internal_name=asset.internal_name,
        ip_address=asset.ip_address,
        mac_address=asset.mac_address,
        operating_system=asset.operating_system,
        status=asset.status,
        last_seen_at=asset.last_seen_at,
    )
    db.add(model)
    db.commit()
    db.refresh(model)
    return asset_to_schema(model)


@app.get("/v1/tickets")
def list_tickets() -> list[Ticket]:
    return list(demo_tickets.values())


@app.post("/v1/tickets", status_code=201)
def create_ticket(ticket: Ticket, db: Session = Depends(get_db)) -> Ticket:
    get_tenant_or_404(db, ticket.tenant_id)
    demo_tickets[ticket.id] = ticket
    return ticket


@app.post("/v1/rmm/check-in", status_code=202)
def rmm_check_in(payload: AgentCheckIn, db: Session = Depends(get_db)) -> Asset:
    get_tenant_or_404(db, payload.tenant_id)

    asset = (
        db.query(AssetModel)
        .filter(
            AssetModel.tenant_id == payload.tenant_id,
            AssetModel.hostname == payload.hostname,
        )
        .first()
    )

    now = datetime.utcnow()
    if asset:
        asset.operating_system = payload.operating_system
        asset.ip_address = payload.ip_address
        asset.mac_address = payload.mac_address
        asset.agent_version = payload.agent_version
        asset.last_seen_at = now
        asset.status = AssetStatus.active
    else:
        asset = AssetModel(
            tenant_id=payload.tenant_id,
            hostname=payload.hostname,
            operating_system=payload.operating_system,
            ip_address=payload.ip_address,
            mac_address=payload.mac_address,
            agent_version=payload.agent_version,
            last_seen_at=now,
            status=AssetStatus.active,
        )
        db.add(asset)

    db.commit()
    db.refresh(asset)
    return asset_to_schema(asset)


@app.post("/v1/rmm/telemetry", status_code=202)
def receive_telemetry(payload: TelemetrySample, db: Session = Depends(get_db)) -> dict[str, str]:
    asset = get_asset_or_404(db, payload.asset_id)
    if asset.tenant_id != payload.tenant_id:
        raise HTTPException(status_code=404, detail="Asset not found")

    sample = TelemetryModel(
        tenant_id=payload.tenant_id,
        asset_id=payload.asset_id,
        cpu_percent=payload.cpu_percent,
        memory_percent=payload.memory_percent,
        disk_free_percent=payload.disk_free_percent,
        recorded_at=payload.recorded_at,
    )
    asset.last_seen_at = datetime.utcnow()
    asset.status = AssetStatus.active
    db.add(sample)
    db.commit()
    return {"status": "accepted"}


@app.get("/v1/rmm/telemetry")
def list_telemetry(
    asset_id: UUID | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
) -> list[TelemetrySample]:
    query = db.query(TelemetryModel).order_by(TelemetryModel.recorded_at.desc())
    if asset_id is not None:
        query = query.filter(TelemetryModel.asset_id == asset_id)
    samples = query.limit(limit).all()
    return [telemetry_to_schema(sample) for sample in samples]


@app.post("/v1/rmm/commands", status_code=202)
def queue_command(payload: RemoteCommand, db: Session = Depends(get_db)) -> CommandResult:
    get_tenant_or_404(db, payload.tenant_id)
    get_asset_or_404(db, payload.asset_id)

    command = CommandModel(
        tenant_id=payload.tenant_id,
        asset_id=payload.asset_id,
        command=payload.command,
        status=CommandStatus.queued,
    )
    db.add(command)
    db.commit()
    db.refresh(command)
    return command_to_schema(command)


@app.get("/v1/rmm/commands")
def list_commands(
    asset_id: UUID | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[CommandResult]:
    query = db.query(CommandModel).order_by(CommandModel.created_at.desc())
    if asset_id is not None:
        query = query.filter(CommandModel.asset_id == asset_id)
    return [command_to_schema(command) for command in query.all()]


@app.get("/v1/rmm/commands/pending")
def list_pending_commands(
    asset_id: UUID = Query(...),
    db: Session = Depends(get_db),
) -> list[CommandResult]:
    get_asset_or_404(db, asset_id)
    commands = (
        db.query(CommandModel)
        .filter(
            CommandModel.asset_id == asset_id,
            CommandModel.status == CommandStatus.queued,
        )
        .order_by(CommandModel.created_at.asc())
        .all()
    )
    return [command_to_schema(command) for command in commands]


@app.patch("/v1/rmm/commands/{command_id}")
def update_command(
    command_id: UUID,
    payload: CommandUpdate,
    db: Session = Depends(get_db),
) -> CommandResult:
    command = db.get(CommandModel, command_id)
    if command is None:
        raise HTTPException(status_code=404, detail="Command not found")

    now = datetime.utcnow()
    command.status = payload.status
    if payload.result_message is not None:
        command.result_message = payload.result_message

    if payload.status == CommandStatus.running and command.started_at is None:
        command.started_at = now
    if payload.status in {CommandStatus.completed, CommandStatus.failed}:
        command.completed_at = now

    db.commit()
    db.refresh(command)
    return command_to_schema(command)


@app.get("/v1/contracts")
def list_contracts() -> list[Contract]:
    return list(demo_contracts.values())


@app.post("/v1/contracts", status_code=201)
def create_contract(contract: Contract, db: Session = Depends(get_db)) -> Contract:
    get_tenant_or_404(db, contract.tenant_id)
    demo_contracts[contract.id] = contract
    return contract


@app.get("/v1/crm/opportunities")
def list_opportunities() -> list[Opportunity]:
    return list(demo_opportunities.values())


@app.post("/v1/crm/opportunities", status_code=201)
def create_opportunity(opportunity: Opportunity, db: Session = Depends(get_db)) -> Opportunity:
    get_tenant_or_404(db, opportunity.tenant_id)
    demo_opportunities[opportunity.id] = opportunity
    return opportunity


@app.get("/v1/docs/articles")
def list_articles() -> list[KnowledgeArticle]:
    return list(demo_articles.values())


@app.post("/v1/docs/articles", status_code=201)
def create_article(article: KnowledgeArticle, db: Session = Depends(get_db)) -> KnowledgeArticle:
    get_tenant_or_404(db, article.tenant_id)
    demo_articles[article.id] = article
    return article


@app.get("/v1/vault/credentials")
def list_credentials() -> list[VaultCredential]:
    return list(demo_credentials.values())


@app.post("/v1/vault/credentials", status_code=201)
def create_credential(credential: VaultCredential, db: Session = Depends(get_db)) -> VaultCredential:
    get_tenant_or_404(db, credential.tenant_id)
    credential.secret_hint = "********"
    demo_credentials[credential.id] = credential
    return credential


@app.get("/v1/automations")
def list_automations() -> list[AutomationRule]:
    return list(demo_automations.values())


@app.post("/v1/automations", status_code=201)
def create_automation(automation: AutomationRule, db: Session = Depends(get_db)) -> AutomationRule:
    get_tenant_or_404(db, automation.tenant_id)
    demo_automations[automation.id] = automation
    return automation
