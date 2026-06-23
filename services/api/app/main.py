from datetime import datetime
from uuid import UUID, uuid4

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.schemas import (
    AgentCheckIn,
    Asset,
    AssetStatus,
    CommandResult,
    DashboardSummary,
    RemoteCommand,
    TelemetrySample,
    Tenant,
    Ticket,
    TicketPriority,
)

app = FastAPI(title=settings.project_name, version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:3000", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

tenant_id = uuid4()
demo_tenants: dict[UUID, Tenant] = {
    tenant_id: Tenant(id=tenant_id, name="Empresa Demo", slug="empresa-demo")
}
asset_a = uuid4()
asset_b = uuid4()
asset_c = uuid4()
demo_assets: dict[UUID, Asset] = {
    asset_a: Asset(
        id=asset_a,
        tenant_id=tenant_id,
        hostname="SRV-DC-01",
        internal_name="Servidor dominio",
        ip_address="10.0.0.10",
        mac_address="00-15-5D-00-10-01",
        operating_system="Windows Server 2022",
        status=AssetStatus.active,
        last_seen_at=datetime.utcnow(),
    ),
    asset_b: Asset(
        id=asset_b,
        tenant_id=tenant_id,
        hostname="NOTE-FIN-07",
        internal_name="Notebook financeiro",
        ip_address="10.0.8.47",
        mac_address="44-85-00-A1-B2-C3",
        operating_system="Windows 11 Pro",
        status=AssetStatus.active,
        last_seen_at=datetime.utcnow(),
    ),
    asset_c: Asset(
        id=asset_c,
        tenant_id=tenant_id,
        hostname="PDV-LOJA-03",
        internal_name="PDV loja centro",
        ip_address="10.3.0.21",
        mac_address="70-4D-7B-22-10-03",
        operating_system="Ubuntu 24.04 LTS",
        status=AssetStatus.offline,
    ),
}
ticket_a = uuid4()
ticket_b = uuid4()
demo_tickets: dict[UUID, Ticket] = {
    ticket_a: Ticket(
        id=ticket_a,
        tenant_id=tenant_id,
        subject="CPU alta no servidor de dominio",
        description="Monitoramento apontou CPU acima de 90% por mais de 10 minutos.",
        priority=TicketPriority.high,
        asset_id=asset_a,
    ),
    ticket_b: Ticket(
        id=ticket_b,
        tenant_id=tenant_id,
        subject="PDV offline",
        description="Equipamento sem check-in recente e sem resposta de ping.",
        priority=TicketPriority.critical,
        asset_id=asset_c,
    ),
}
demo_telemetry: list[TelemetrySample] = [
    TelemetrySample(tenant_id=tenant_id, asset_id=asset_a, cpu_percent=87, memory_percent=72, disk_free_percent=18),
    TelemetrySample(tenant_id=tenant_id, asset_id=asset_b, cpu_percent=34, memory_percent=61, disk_free_percent=42),
]
demo_commands: list[CommandResult] = []


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "api",
        "environment": settings.environment,
    }


@app.get("/v1/tenants")
def list_tenants() -> list[Tenant]:
    return list(demo_tenants.values())


@app.get("/v1/dashboard")
def dashboard_summary() -> DashboardSummary:
    open_tickets = [ticket for ticket in demo_tickets.values() if ticket.status != "closed"]
    return DashboardSummary(
        tenants=len(demo_tenants),
        assets_total=len(demo_assets),
        assets_online=sum(1 for asset in demo_assets.values() if asset.status == AssetStatus.active),
        assets_offline=sum(1 for asset in demo_assets.values() if asset.status == AssetStatus.offline),
        tickets_open=len(open_tickets),
        tickets_critical=sum(1 for ticket in open_tickets if ticket.priority == TicketPriority.critical),
        telemetry_samples=len(demo_telemetry),
    )


@app.get("/v1/assets")
def list_assets() -> list[Asset]:
    return list(demo_assets.values())


@app.post("/v1/assets", status_code=201)
def create_asset(asset: Asset) -> Asset:
    if asset.tenant_id not in demo_tenants:
        raise HTTPException(status_code=404, detail="Tenant not found")
    demo_assets[asset.id] = asset
    return asset


@app.get("/v1/tickets")
def list_tickets() -> list[Ticket]:
    return list(demo_tickets.values())


@app.post("/v1/tickets", status_code=201)
def create_ticket(ticket: Ticket) -> Ticket:
    if ticket.tenant_id not in demo_tenants:
        raise HTTPException(status_code=404, detail="Tenant not found")
    demo_tickets[ticket.id] = ticket
    return ticket


@app.post("/v1/rmm/check-in", status_code=202)
def rmm_check_in(payload: AgentCheckIn) -> Asset:
    if payload.tenant_id not in demo_tenants:
        raise HTTPException(status_code=404, detail="Tenant not found")

    existing = next(
        (asset for asset in demo_assets.values() if asset.hostname == payload.hostname),
        None,
    )
    if existing:
        existing.operating_system = payload.operating_system
        existing.ip_address = payload.ip_address
        existing.mac_address = payload.mac_address
        existing.last_seen_at = datetime.utcnow()
        return existing

    asset = Asset(
        tenant_id=payload.tenant_id,
        hostname=payload.hostname,
        operating_system=payload.operating_system,
        ip_address=payload.ip_address,
        mac_address=payload.mac_address,
        last_seen_at=datetime.utcnow(),
    )
    demo_assets[asset.id] = asset
    return asset


@app.post("/v1/rmm/telemetry", status_code=202)
def receive_telemetry(payload: TelemetrySample) -> dict[str, str]:
    if payload.asset_id not in demo_assets:
        raise HTTPException(status_code=404, detail="Asset not found")
    demo_telemetry.append(payload)
    return {"status": "accepted"}


@app.post("/v1/rmm/commands", status_code=202)
def queue_command(payload: RemoteCommand) -> CommandResult:
    if payload.tenant_id not in demo_tenants:
        raise HTTPException(status_code=404, detail="Tenant not found")
    if payload.asset_id not in demo_assets:
        raise HTTPException(status_code=404, detail="Asset not found")
    result = CommandResult(
        tenant_id=payload.tenant_id,
        asset_id=payload.asset_id,
        command=payload.command,
    )
    demo_commands.append(result)
    return result


@app.get("/v1/rmm/commands")
def list_commands() -> list[CommandResult]:
    return demo_commands
