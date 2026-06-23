from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models import AssetModel
from app.schemas import AssetStatus

OFFLINE_AFTER = timedelta(minutes=5)


def sync_asset_online_status(asset: AssetModel) -> AssetStatus:
    if asset.last_seen_at is None:
        asset.status = AssetStatus.offline
        return asset.status

    if datetime.utcnow() - asset.last_seen_at <= OFFLINE_AFTER:
        asset.status = AssetStatus.active
    else:
        asset.status = AssetStatus.offline

    return asset.status


def sync_all_asset_statuses(db: Session) -> None:
    assets = db.query(AssetModel).all()
    for asset in assets:
        sync_asset_online_status(asset)
    db.commit()
