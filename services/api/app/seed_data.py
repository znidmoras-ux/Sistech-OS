from datetime import datetime, timedelta
from uuid import UUID

from sqlalchemy.orm import Session

from app.models import AssetModel, CommandModel, TelemetryModel, TenantModel
from app.schemas import AssetStatus, CommandStatus

DEMO_TENANT_ID = UUID("a0000000-0000-4000-8000-000000000001")
DEMO_ASSET_SRV = UUID("a0000000-0000-4000-8000-000000000101")
DEMO_ASSET_NOTE = UUID("a0000000-0000-4000-8000-000000000102")
DEMO_ASSET_PDV = UUID("a0000000-0000-4000-8000-000000000103")


def seed_demo_data(db: Session) -> None:
    if db.query(TenantModel).first():
        return

    tenant = TenantModel(
        id=DEMO_TENANT_ID,
        name="Empresa Demo",
        slug="empresa-demo",
    )
    db.add(tenant)

    now = datetime.utcnow()
    assets = [
        AssetModel(
            id=DEMO_ASSET_SRV,
            tenant_id=DEMO_TENANT_ID,
            hostname="SRV-DC-01",
            internal_name="Servidor dominio",
            ip_address="10.0.0.10",
            mac_address="00-15-5D-00-10-01",
            operating_system="Windows Server 2022",
            status=AssetStatus.active,
            last_seen_at=now - timedelta(minutes=2),
            agent_version="0.1.0",
        ),
        AssetModel(
            id=DEMO_ASSET_NOTE,
            tenant_id=DEMO_TENANT_ID,
            hostname="NOTE-FIN-07",
            internal_name="Notebook financeiro",
            ip_address="10.0.8.47",
            mac_address="44-85-00-A1-B2-C3",
            operating_system="Windows 11 Pro",
            status=AssetStatus.active,
            last_seen_at=now - timedelta(minutes=1),
            agent_version="0.1.0",
        ),
        AssetModel(
            id=DEMO_ASSET_PDV,
            tenant_id=DEMO_TENANT_ID,
            hostname="PDV-LOJA-03",
            internal_name="PDV loja centro",
            ip_address="10.3.0.21",
            mac_address="70-4D-7B-22-10-03",
            operating_system="Ubuntu 24.04 LTS",
            status=AssetStatus.offline,
            last_seen_at=now - timedelta(hours=6),
            agent_version="0.1.0",
        ),
    ]
    db.add_all(assets)

    db.add_all(
        [
            TelemetryModel(
                tenant_id=DEMO_TENANT_ID,
                asset_id=DEMO_ASSET_SRV,
                cpu_percent=87,
                memory_percent=72,
                disk_free_percent=18,
                recorded_at=now - timedelta(minutes=2),
            ),
            TelemetryModel(
                tenant_id=DEMO_TENANT_ID,
                asset_id=DEMO_ASSET_NOTE,
                cpu_percent=34,
                memory_percent=61,
                disk_free_percent=42,
                recorded_at=now - timedelta(minutes=1),
            ),
        ]
    )

    db.add(
        CommandModel(
            tenant_id=DEMO_TENANT_ID,
            asset_id=DEMO_ASSET_NOTE,
            command="collect_logs",
            status=CommandStatus.completed,
            result_message="Logs coletados com sucesso (demo).",
            created_at=now - timedelta(hours=1),
            started_at=now - timedelta(hours=1),
            completed_at=now - timedelta(hours=1),
        )
    )

    db.commit()
