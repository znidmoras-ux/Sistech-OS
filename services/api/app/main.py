from datetime import datetime
from uuid import UUID, uuid4

from fastapi import FastAPI, HTTPException

from app.config import settings
from app.schemas import AgentCheckIn, Asset, TelemetrySample, Tenant, Ticket

app = FastAPI(title=settings.project_name, version="0.1.0")

tenant_id = uuid4()
demo_tenants: dict[UUID, Tenant] = {
    tenant_id: Tenant(id=tenant_id, name="Empresa Demo", slug="empresa-demo")
}
demo_assets: dict[UUID, Asset] = {}
demo_tickets: dict[UUID, Ticket] = {}
demo_telemetry: list[TelemetrySample] = []


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
