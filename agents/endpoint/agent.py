import argparse
import json
import platform
import socket
from dataclasses import asdict, dataclass


@dataclass
class InventorySnapshot:
    hostname: str
    operating_system: str
    machine: str
    processor: str


def collect_inventory() -> InventorySnapshot:
    return InventorySnapshot(
        hostname=socket.gethostname(),
        operating_system=f"{platform.system()} {platform.release()}",
        machine=platform.machine(),
        processor=platform.processor(),
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Sistech OS endpoint agent")
    parser.add_argument("--api-url", default="http://127.0.0.1:8000")
    args = parser.parse_args()

    snapshot = collect_inventory()
    print(json.dumps({"api_url": args.api_url, "inventory": asdict(snapshot)}, indent=2))


if __name__ == "__main__":
    main()
