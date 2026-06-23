# API

Backend FastAPI do Sistech OS.

## Comandos

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -e .[dev]
uvicorn app.main:app --reload
```

## Rotas iniciais

- `GET /health`
- `GET /v1/tenants`
- `GET /v1/assets`
- `POST /v1/assets`
- `GET /v1/tickets`
- `POST /v1/tickets`
- `POST /v1/rmm/check-in`
- `POST /v1/rmm/telemetry`
- `GET /v1/rmm/telemetry`
- `POST /v1/rmm/commands`
- `GET /v1/rmm/commands`
- `GET /v1/rmm/commands/pending`
- `PATCH /v1/rmm/commands/{command_id}`

## Banco

A API persiste tenants, ativos, telemetria e comandos RMM no PostgreSQL configurado em `DATABASE_URL`.
Na primeira execucao, cria as tabelas e insere o tenant demo `a0000000-0000-4000-8000-000000000001`.

Se o PostgreSQL nao estiver disponivel em `ENVIRONMENT=local`, a API usa SQLite em `local/sistech_os.db`.
