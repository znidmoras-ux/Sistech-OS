# Agente Endpoint

Base do agente RMM do Sistech OS.

## Responsabilidades

- Registrar o equipamento na API.
- Coletar inventario de hardware, software e rede.
- Enviar telemetria periodica.
- Receber comandos remotos autorizados.
- Reportar logs, falhas e status de antivirus/backup.

## Execucao local

```bash
python agent.py --api-url http://127.0.0.1:8000
```
