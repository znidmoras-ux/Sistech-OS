# Sistech OS

SaaS multi-tenant para empresas de TI, MSP, help desk e monitoramento remoto.

## Objetivo

Centralizar RMM, inventario, chamados, ordens de servico, manutencao, contratos,
financeiro, CRM, documentacao, cofre de credenciais, automacoes e IA em uma
plataforma unica.

## Estrutura

- `apps/web`: frontend Next.js.
- `services/api`: backend FastAPI.
- `agents/endpoint`: base do agente RMM para endpoints.
- `infra`: arquivos de infraestrutura local.
- `docs`: produto, arquitetura, roadmap e colaboracao.
- `shared`: arquivos compartilhados versionados.
- `local`: arquivos locais ignorados pelo Git.

## Primeiros passos

1. Copie `.env.example` para `.env`.
2. Ajuste as variaveis locais no `.env`.
3. Leia `docs/COLABORACAO.md`.
4. Suba a infraestrutura local:

```bash
docker compose -f infra/docker-compose.yml up -d
```

5. Suba a API:

```bash
cd services/api
python -m venv .venv
.venv\Scripts\activate
pip install -e .[dev]
uvicorn app.main:app --reload
```

6. Suba o frontend:

```bash
cd apps/web
npm install
npm run dev
```

## Documentos principais

- [Produto](docs/PRODUCT_SPEC.md)
- [Arquitetura](docs/ARCHITECTURE.md)
- [Roadmap](docs/ROADMAP.md)
- [Colaboracao](docs/COLABORACAO.md)
