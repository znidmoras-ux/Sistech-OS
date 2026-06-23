# Arquitetura

## Stack base

- Frontend: Next.js, TypeScript e Tailwind CSS.
- Backend: FastAPI e Python.
- Banco: PostgreSQL.
- Cache: Redis.
- Filas: RabbitMQ.
- Infraestrutura: Docker, com caminho futuro para Kubernetes.
- Monitoramento: Prometheus e Grafana.
- Armazenamento: S3 compativel.
- Autenticacao: JWT, MFA e OAuth2.

## Monorepo

```text
apps/
  web/
services/
  api/
agents/
  endpoint/
infra/
docs/
shared/
local/
```

## Tenancy

O sistema deve isolar dados por `tenant_id` em todas as entidades de negocio.

Regras iniciais:

- Toda requisicao autenticada deve carregar tenant ativo.
- APIs administrativas globais devem ser separadas das APIs do tenant.
- Consultas sempre filtram por `tenant_id`, exceto rotas explicitamente globais.
- Auditoria registra tenant, usuario, acao, recurso e data.

## Componentes

### Web

Interface operacional para:

- Dashboard executivo.
- Help desk.
- Inventario.
- Clientes e contratos.
- Financeiro.
- CRM.
- Documentacao.
- Configuracoes.

### API

Responsavel por:

- Autenticacao e autorizacao.
- Regras multi-tenant.
- CRUD dos modulos.
- Recebimento de telemetria dos agentes.
- Abertura automatica de alertas e chamados.
- Webhooks e integracoes.

### Agente

Processo instalado no endpoint para:

- Registrar equipamento.
- Coletar inventario.
- Enviar metricas.
- Receber comandos remotos.
- Reportar logs e falhas.

### Workers

Processos assicronos para:

- Alertas.
- Automacoes.
- Relatorios.
- Notificacoes.
- Integracoes externas.

## Seguranca

- JWT com expiracao curta e refresh token.
- MFA para usuarios administrativos.
- Criptografia em repouso para credenciais.
- Segredos sempre fora do Git.
- Logs de auditoria para acessos sensiveis.
- Permissoes por papel e por tenant.

## API inicial

Rotas planejadas para o primeiro MVP:

- `GET /health`
- `GET /v1/tenants`
- `GET /v1/assets`
- `POST /v1/assets`
- `GET /v1/tickets`
- `POST /v1/tickets`
- `POST /v1/rmm/check-in`
- `POST /v1/rmm/telemetry`
