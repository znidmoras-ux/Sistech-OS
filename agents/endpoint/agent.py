import argparse
import json
import logging
import platform
import socket
import subprocess
import sys
import tempfile
import time
import uuid
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path

import psutil
import requests

AGENT_VERSION = "0.1.0"
DEFAULT_TENANT_ID = "a0000000-0000-4000-8000-000000000001"
DEFAULT_INTERVAL = 30
LOG_DIR = Path.home() / ".sistech-agent"
LOG_FILE = LOG_DIR / "agent.log"

SUPPORTED_COMMANDS = {"collect_logs", "restart", "cleanup_temp", "update_agent"}


@dataclass
class InventorySnapshot:
    hostname: str
    operating_system: str
    machine: str
    processor: str
    ip_address: str | None
    mac_address: str | None


@dataclass
class TelemetrySnapshot:
    cpu_percent: float
    memory_percent: float
    disk_free_percent: float


class SistechAgent:
    def __init__(
        self,
        api_url: str,
        tenant_id: str,
        interval: int,
        allow_destructive: bool,
    ) -> None:
        self.api_url = api_url.rstrip("/")
        self.tenant_id = tenant_id
        self.interval = interval
        self.allow_destructive = allow_destructive
        self.asset_id: str | None = None
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        LOG_DIR.mkdir(parents=True, exist_ok=True)
        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s [%(levelname)s] %(message)s",
            handlers=[
                logging.FileHandler(LOG_FILE, encoding="utf-8"),
                logging.StreamHandler(sys.stdout),
            ],
        )
        self.logger = logging.getLogger("sistech-agent")

    def run(self) -> None:
        self.logger.info(
            "Agente iniciado | api=%s tenant=%s intervalo=%ss",
            self.api_url,
            self.tenant_id,
            self.interval,
        )
        while True:
            try:
                self.tick()
            except requests.RequestException as error:
                self.logger.error("Falha de comunicacao com a API: %s", error)
            except Exception:
                self.logger.exception("Erro inesperado no ciclo do agente")
            time.sleep(self.interval)

    def tick(self) -> None:
        inventory = collect_inventory()
        asset = self.check_in(inventory)
        self.asset_id = asset["id"]
        self.logger.info(
            "Check-in OK | asset=%s hostname=%s ip=%s",
            self.asset_id,
            inventory.hostname,
            inventory.ip_address,
        )

        telemetry = collect_telemetry()
        self.send_telemetry(telemetry)
        self.logger.info(
            "Telemetria enviada | cpu=%.1f%% mem=%.1f%% disco=%.1f%%",
            telemetry.cpu_percent,
            telemetry.memory_percent,
            telemetry.disk_free_percent,
        )

        pending = self.fetch_pending_commands()
        for command in pending:
            self.process_command(command)

    def check_in(self, inventory: InventorySnapshot) -> dict:
        response = self.session.post(
            f"{self.api_url}/v1/rmm/check-in",
            json={
                "tenant_id": self.tenant_id,
                "hostname": inventory.hostname,
                "operating_system": inventory.operating_system,
                "agent_version": AGENT_VERSION,
                "ip_address": inventory.ip_address,
                "mac_address": inventory.mac_address,
            },
            timeout=20,
        )
        response.raise_for_status()
        return response.json()

    def send_telemetry(self, telemetry: TelemetrySnapshot) -> None:
        if not self.asset_id:
            return
        response = self.session.post(
            f"{self.api_url}/v1/rmm/telemetry",
            json={
                "tenant_id": self.tenant_id,
                "asset_id": self.asset_id,
                "cpu_percent": telemetry.cpu_percent,
                "memory_percent": telemetry.memory_percent,
                "disk_free_percent": telemetry.disk_free_percent,
                "recorded_at": datetime.now(timezone.utc).isoformat(),
            },
            timeout=20,
        )
        response.raise_for_status()

    def fetch_pending_commands(self) -> list[dict]:
        if not self.asset_id:
            return []
        response = self.session.get(
            f"{self.api_url}/v1/rmm/commands/pending",
            params={"asset_id": self.asset_id},
            timeout=20,
        )
        response.raise_for_status()
        return response.json()

    def process_command(self, command: dict) -> None:
        command_id = command["id"]
        command_name = command["command"]
        self.logger.info("Executando comando %s (%s)", command_name, command_id)
        self.update_command(command_id, "running")

        try:
            if command_name not in SUPPORTED_COMMANDS:
                raise ValueError(f"Comando nao suportado: {command_name}")
            result = execute_command(command_name, self.allow_destructive)
            self.update_command(command_id, "completed", result)
            self.logger.info("Comando concluido: %s", result)
        except Exception as error:
            message = str(error)
            self.update_command(command_id, "failed", message)
            self.logger.error("Comando falhou: %s", message)

    def update_command(self, command_id: str, status: str, result_message: str | None = None) -> None:
        payload: dict[str, str] = {"status": status}
        if result_message is not None:
            payload["result_message"] = result_message[:4000]
        response = self.session.patch(
            f"{self.api_url}/v1/rmm/commands/{command_id}",
            json=payload,
            timeout=20,
        )
        response.raise_for_status()


def collect_inventory() -> InventorySnapshot:
    return InventorySnapshot(
        hostname=socket.gethostname(),
        operating_system=f"{platform.system()} {platform.release()}",
        machine=platform.machine(),
        processor=platform.processor() or platform.machine(),
        ip_address=get_primary_ip(),
        mac_address=get_mac_address(),
    )


def collect_telemetry() -> TelemetrySnapshot:
    cpu_percent = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage("/") if platform.system() != "Windows" else psutil.disk_usage("C:\\")
    disk_free_percent = (disk.free / disk.total) * 100 if disk.total else 0
    return TelemetrySnapshot(
        cpu_percent=round(cpu_percent, 1),
        memory_percent=round(memory.percent, 1),
        disk_free_percent=round(disk_free_percent, 1),
    )


def get_primary_ip() -> str | None:
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
            sock.connect(("8.8.8.8", 80))
            return sock.getsockname()[0]
    except OSError:
        return None


def get_mac_address() -> str | None:
    node = uuid.getnode()
    if (node >> 40) & 1:
        return None
    return ":".join(f"{(node >> shift) & 0xFF:02X}" for shift in range(40, -1, -8))


def execute_command(command: str, allow_destructive: bool) -> str:
    if command == "collect_logs":
        return collect_logs()
    if command == "cleanup_temp":
        return cleanup_temp()
    if command == "update_agent":
        return f"Agente atualizado para versao {AGENT_VERSION} (sem pacote remoto configurado)."
    if command == "restart":
        return schedule_restart(allow_destructive)
    raise ValueError(f"Comando desconhecido: {command}")


def collect_logs() -> str:
    lines: list[str] = []
    if LOG_FILE.exists():
        content = LOG_FILE.read_text(encoding="utf-8", errors="replace").splitlines()
        lines.extend(content[-80:])
    lines.append(f"hostname={socket.gethostname()}")
    lines.append(f"os={platform.platform()}")
    lines.append(f"boot_time={datetime.fromtimestamp(psutil.boot_time()).isoformat()}")
    return "\n".join(lines[-100:])


def cleanup_temp() -> str:
    temp_dir = Path(tempfile.gettempdir())
    removed = 0
    freed_bytes = 0
    cutoff = time.time() - (7 * 24 * 60 * 60)

    for entry in temp_dir.iterdir():
        try:
            if not entry.is_file():
                continue
            if entry.stat().st_mtime >= cutoff:
                continue
            size = entry.stat().st_size
            entry.unlink()
            removed += 1
            freed_bytes += size
        except OSError:
            continue

    return f"Limpeza concluida: {removed} arquivos removidos, {human_size(freed_bytes)} liberados."


def schedule_restart(allow_destructive: bool) -> str:
    if not allow_destructive:
        return "Reinicio simulado. Execute o agente com --allow-destructive para reiniciar de verdade."

    if platform.system() == "Windows":
        subprocess.run(["shutdown", "/r", "/t", "60"], check=True)
        return "Reinicio agendado em 60 segundos."
    subprocess.run(["shutdown", "-r", "+1"], check=True)
    return "Reinicio agendado em 1 minuto."


def human_size(num_bytes: int) -> str:
    units = ["B", "KB", "MB", "GB"]
    size = float(num_bytes)
    for unit in units:
        if size < 1024 or unit == units[-1]:
            return f"{size:.1f} {unit}"
        size /= 1024
    return f"{num_bytes} B"


def run_once(api_url: str) -> None:
    snapshot = collect_inventory()
    telemetry = collect_telemetry()
    print(
        json.dumps(
            {
                "api_url": api_url,
                "inventory": asdict(snapshot),
                "telemetry": asdict(telemetry),
            },
            indent=2,
        )
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Sistech OS endpoint agent")
    parser.add_argument("--api-url", default="http://127.0.0.1:8000")
    parser.add_argument("--tenant-id", default=DEFAULT_TENANT_ID)
    parser.add_argument("--interval", type=int, default=DEFAULT_INTERVAL)
    parser.add_argument("--once", action="store_true", help="Coleta local e encerra sem falar com a API")
    parser.add_argument(
        "--allow-destructive",
        action="store_true",
        help="Permite comandos destrutivos como reinicio real",
    )
    args = parser.parse_args()

    if args.once:
        run_once(args.api_url)
        return

    agent = SistechAgent(
        api_url=args.api_url,
        tenant_id=args.tenant_id,
        interval=max(10, args.interval),
        allow_destructive=args.allow_destructive,
    )
    agent.run()


if __name__ == "__main__":
    main()
