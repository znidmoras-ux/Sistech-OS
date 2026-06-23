# Especificacao do Produto

## Visao geral

O Sistech OS sera uma plataforma SaaS moderna, multiempresa e API-first para
empresas de suporte tecnico, consultorias de TI, MSPs, assistencias tecnicas
corporativas e departamentos internos de TI.

O sistema deve reunir operacao tecnica, atendimento, gestao de ativos,
monitoramento remoto, contratos, financeiro, CRM, documentacao, automacoes e IA.

## Modulos

### RMM

Agente leve para Windows e Linux, com macOS previsto para fase futura.

Coleta automatica:

- Nome do computador, hostname e usuario logado.
- IP, MAC, gateway, DNS e VLAN.
- Sistema operacional, CPU, RAM, discos, GPU e impressoras.
- Programas instalados, servicos ativos, antivirus e status de atualizacoes.

Monitoramento:

- CPU, memoria, disco, temperatura, rede, ping e disponibilidade.

Alertas:

- Offline, CPU alta, RAM alta, disco baixo, temperatura elevada.
- Servico parado, falha de backup e antivirus desatualizado.

Acoes remotas:

- Reiniciar, desligar, executar scripts, coletar logs, atualizar agente e limpar
  arquivos temporarios.

### Inventario de TI

Cadastro automatico de equipamentos quando o agente for instalado.

Dados principais:

- Nome interno, codigo do ativo, patrimonio, serial, fabricante, modelo e status.
- Valor de aquisicao, compra, garantia, fornecedor e centro de custo.
- IP, MAC, gateway, DNS e VLAN.

### Help Desk

Portal do cliente para abertura e acompanhamento de chamados.

Recursos:

- Assunto, descricao, categoria, subcategoria, anexos e equipamento relacionado.
- Prioridades baixa, media, alta e critica.
- SLA de primeira resposta, resolucao e tempo em espera.
- Comentarios internos e publicos, historico, upload, horas tecnicas e aprovacao.

### Ordens de Servico

- Abertura de OS, assinatura digital, fotos, checklist, pecas, custos e tempo.

### Manutencao

Preventiva:

- Limpeza fisica, atualizacao de sistema, antivirus, SMART, backup e nobreak.

Corretiva:

- Falha, causa raiz, solucao aplicada, custos e pecas substituidas.

### Contratos

- Contrato mensal, por horas e sob demanda.
- Horas contratadas, utilizadas, excedentes, SLA e renovacao.

### Financeiro

Receitas:

- Mensalidades, contratos, servicos e venda de equipamentos.

Despesas:

- Licencas, ferramentas, infraestrutura e tecnicos.

Relatorios:

- Fluxo de caixa, DRE, lucro por cliente e lucro por contrato.

### CRM

- Funil: lead, qualificacao, proposta, negociacao e fechado.
- Agenda, tarefas, follow-up e historico de contatos.

### Documentacao

- Base de conhecimento com artigos, procedimentos, tutoriais, FAQs e manuais.
- Versoes, aprovacao e permissoes.

### Senhas e Credenciais

- Cofre para senhas, tokens, chaves SSH e licencas.
- Criptografia, MFA e logs de acesso.

### Dashboard Executivo

Indicadores:

- Equipamentos online e offline.
- Chamados abertos por prioridade.
- SLA cumprido e violado.
- Receita mensal, clientes ativos, tecnicos ativos.
- Garantias e equipamentos proximos do fim da vida util.

### IA Integrada

- Classificacao automatica de chamados.
- Sugestao de prioridade e solucoes.
- Respostas automaticas.
- Relatorios gerenciais.
- Deteccao de padroes de falhas.

### Mobile

Tecnicos:

- Receber chamados, atualizar status, assinar OS, tirar fotos e registrar atendimento.

Clientes:

- Abrir chamados, consultar status, aprovar servicos e visualizar equipamentos.

### Automacoes

- Abertura automatica de chamados.
- Alertas por WhatsApp, e-mail e push.
- Escalonamento automatico.
- Cobranca recorrente.
- Renovacao automatica de contratos.

## Diferenciais

- Multiempresa, multiunidade e multiusuario.
- API REST e webhooks.
- Portal do cliente e portal do tecnico.
- RMM, Help Desk, CRM e financeiro proprios.
- Mobile, IA, QR Code, etiquetas, assinatura digital e auditoria completa.
