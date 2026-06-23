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
