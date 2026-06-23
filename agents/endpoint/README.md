# Agente Endpoint

Agente RMM real do Sistech OS para Windows e Linux.

## O que faz

- Registra o equipamento na API (`POST /v1/rmm/check-in`).
- Envia telemetria periodica de CPU, memoria e disco.
- Consulta comandos pendentes e executa com retorno de status.
- Grava logs locais em `%USERPROFILE%\.sistech-agent\agent.log` (Windows) ou `~/.sistech-agent/agent.log` (Linux).

## Instalacao

```bash
cd agents/endpoint
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Execucao

Com a API e o PostgreSQL rodando:

```bash
python agent.py --api-url http://127.0.0.1:8000 --tenant-id a0000000-0000-4000-8000-000000000001
```

Parametros uteis:

- `--interval 30` intervalo entre ciclos em segundos (minimo 10).
- `--once` apenas exibe inventario/telemetria local, sem enviar para a API.
- `--allow-destructive` habilita reinicio real quando o comando `restart` for enviado.

## Comandos suportados

| Comando | Acao |
|---------|------|
| `collect_logs` | Envia ultimas linhas do log do agente + info do sistema |
| `cleanup_temp` | Remove arquivos temporarios com mais de 7 dias |
| `update_agent` | Confirma versao atual do agente |
| `restart` | Simulado por padrao; real com `--allow-destructive` |

## Tenant demo

Use o tenant seed da API:

`a0000000-0000-4000-8000-000000000001`

Ao iniciar, o agente registra o hostname real da maquina e passa a aparecer no painel RMM.
