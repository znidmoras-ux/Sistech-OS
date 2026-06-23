"use client";

import {
  Activity,
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  HardDrive,
  LockKeyhole,
  Plus,
  RefreshCw,
  Send,
  TicketCheck,
  Users,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

const API_URL = "http://127.0.0.1:8000";

type Tenant = {
  id: string;
  name: string;
  slug: string;
};

type Asset = {
  id: string;
  tenant_id: string;
  hostname: string;
  internal_name?: string | null;
  ip_address?: string | null;
  mac_address?: string | null;
  operating_system?: string | null;
  status: "active" | "offline" | "maintenance" | "retired";
  last_seen_at?: string | null;
};

type Ticket = {
  id: string;
  tenant_id: string;
  subject: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "in_progress" | "waiting_customer" | "resolved" | "closed";
  asset_id?: string | null;
  created_at: string;
};

type DashboardSummary = {
  tenants: number;
  assets_total: number;
  assets_online: number;
  assets_offline: number;
  tickets_open: number;
  tickets_critical: number;
  telemetry_samples: number;
};

type CommandResult = {
  id: string;
  asset_id: string;
  command: string;
  status: "queued" | "running" | "completed" | "failed";
  result_message?: string | null;
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
};

type TelemetrySample = {
  tenant_id: string;
  asset_id: string;
  cpu_percent: number;
  memory_percent: number;
  disk_free_percent: number;
  recorded_at: string;
};

type Contract = {
  id: string;
  tenant_id: string;
  customer_name: string;
  contract_type: string;
  monthly_value: number;
  hours_included: number;
  hours_used: number;
  status: string;
};

type Opportunity = {
  id: string;
  tenant_id: string;
  company: string;
  stage: string;
  value: number;
  owner: string;
};

type KnowledgeArticle = {
  id: string;
  tenant_id: string;
  title: string;
  category: string;
  status: string;
  updated_at: string;
};

type VaultCredential = {
  id: string;
  tenant_id: string;
  name: string;
  username: string;
  secret_hint: string;
  access_level: string;
};

type AutomationRule = {
  id: string;
  tenant_id: string;
  name: string;
  trigger: string;
  action: string;
  enabled: boolean;
};

const modules = [
  { id: "dashboard", name: "Dashboard", icon: Activity },
  { id: "rmm", name: "RMM", icon: RefreshCw },
  { id: "inventory", name: "Inventario", icon: HardDrive },
  { id: "tickets", name: "Help Desk", icon: TicketCheck },
  { id: "contracts", name: "Contratos", icon: BriefcaseBusiness },
  { id: "crm", name: "CRM", icon: Users },
  { id: "docs", name: "Documentacao", icon: FileText },
  { id: "vault", name: "Cofre", icon: LockKeyhole },
  { id: "automation", name: "Automacoes", icon: Bell },
];

const commandOptions = ["collect_logs", "restart", "cleanup_temp", "update_agent"];

export default function Home() {
  const [activeModule, setActiveModule] = useState("dashboard");
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [commands, setCommands] = useState<CommandResult[]>([]);
  const [telemetry, setTelemetry] = useState<TelemetrySample[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [credentials, setCredentials] = useState<VaultCredential[]>([]);
  const [automations, setAutomations] = useState<AutomationRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("Conectando com a API...");
  const [assetForm, setAssetForm] = useState({ hostname: "", operating_system: "", ip_address: "" });
  const [ticketForm, setTicketForm] = useState({ subject: "", description: "", priority: "medium" });
  const [commandForm, setCommandForm] = useState({ asset_id: "", command: commandOptions[0] });
  const [contractForm, setContractForm] = useState({ customer_name: "", monthly_value: "", hours_included: "" });
  const [opportunityForm, setOpportunityForm] = useState({ company: "", value: "", owner: "" });
  const [articleForm, setArticleForm] = useState({ title: "", category: "" });
  const [credentialForm, setCredentialForm] = useState({ name: "", username: "" });
  const [automationForm, setAutomationForm] = useState({ name: "", trigger: "", action: "" });

  const tenantId = tenants[0]?.id;

  async function loadData() {
    setIsLoading(true);
    try {
      const [
        summaryData,
        tenantData,
        assetData,
        ticketData,
        commandData,
        contractData,
        opportunityData,
        articleData,
        credentialData,
        automationData,
        telemetryData,
      ] = await Promise.all([
        request<DashboardSummary>("/v1/dashboard"),
        request<Tenant[]>("/v1/tenants"),
        request<Asset[]>("/v1/assets"),
        request<Ticket[]>("/v1/tickets"),
        request<CommandResult[]>("/v1/rmm/commands"),
        request<Contract[]>("/v1/contracts"),
        request<Opportunity[]>("/v1/crm/opportunities"),
        request<KnowledgeArticle[]>("/v1/docs/articles"),
        request<VaultCredential[]>("/v1/vault/credentials"),
        request<AutomationRule[]>("/v1/automations"),
        request<TelemetrySample[]>("/v1/rmm/telemetry?limit=100"),
      ]);

      setSummary(summaryData);
      setTenants(tenantData);
      setAssets(assetData);
      setTickets(ticketData);
      setCommands(commandData);
      setTelemetry(telemetryData);
      setContracts(contractData);
      setOpportunities(opportunityData);
      setArticles(articleData);
      setCredentials(credentialData);
      setAutomations(automationData);
      setCommandForm((current) => ({ ...current, asset_id: current.asset_id || assetData[0]?.id || "" }));
      setMessage("API conectada. Dados operacionais carregados.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao carregar dados da API.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeModule !== "rmm") return;
    const timer = setInterval(() => {
      loadData();
    }, 15000);
    return () => clearInterval(timer);
  }, [activeModule]);

  const latestTelemetryByAsset = useMemo(() => {
    const map = new Map<string, TelemetrySample>();
    for (const sample of telemetry) {
      const current = map.get(sample.asset_id);
      if (!current || sample.recorded_at > current.recorded_at) {
        map.set(sample.asset_id, sample);
      }
    }
    return map;
  }, [telemetry]);

  const assetById = useMemo(() => new Map(assets.map((asset) => [asset.id, asset])), [assets]);

  async function createAsset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!tenantId || !assetForm.hostname.trim()) return;

    await request<Asset>("/v1/assets", {
      method: "POST",
      body: JSON.stringify({
        tenant_id: tenantId,
        hostname: assetForm.hostname,
        operating_system: assetForm.operating_system,
        ip_address: assetForm.ip_address,
        status: "active",
      }),
    });

    setAssetForm({ hostname: "", operating_system: "", ip_address: "" });
    setMessage("Ativo cadastrado com sucesso.");
    await loadData();
  }

  async function createTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!tenantId || !ticketForm.subject.trim()) return;

    await request<Ticket>("/v1/tickets", {
      method: "POST",
      body: JSON.stringify({
        tenant_id: tenantId,
        subject: ticketForm.subject,
        description: ticketForm.description,
        priority: ticketForm.priority,
      }),
    });

    setTicketForm({ subject: "", description: "", priority: "medium" });
    setMessage("Chamado aberto com sucesso.");
    await loadData();
  }

  async function sendCommand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!tenantId || !commandForm.asset_id) return;

    await request<CommandResult>("/v1/rmm/commands", {
      method: "POST",
      body: JSON.stringify({
        tenant_id: tenantId,
        asset_id: commandForm.asset_id,
        command: commandForm.command,
      }),
    });

    setMessage("Comando RMM enviado para a fila.");
    await loadData();
  }

  async function createContract(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!tenantId || !contractForm.customer_name.trim()) return;
    await request<Contract>("/v1/contracts", {
      method: "POST",
      body: JSON.stringify({
        tenant_id: tenantId,
        customer_name: contractForm.customer_name,
        monthly_value: Number(contractForm.monthly_value || 0),
        hours_included: Number(contractForm.hours_included || 0),
        hours_used: 0,
        contract_type: "monthly",
      }),
    });
    setContractForm({ customer_name: "", monthly_value: "", hours_included: "" });
    setMessage("Contrato cadastrado com sucesso.");
    await loadData();
  }

  async function createOpportunity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!tenantId || !opportunityForm.company.trim()) return;
    await request<Opportunity>("/v1/crm/opportunities", {
      method: "POST",
      body: JSON.stringify({
        tenant_id: tenantId,
        company: opportunityForm.company,
        value: Number(opportunityForm.value || 0),
        owner: opportunityForm.owner || "Comercial",
        stage: "lead",
      }),
    });
    setOpportunityForm({ company: "", value: "", owner: "" });
    setMessage("Oportunidade criada no CRM.");
    await loadData();
  }

  async function createArticle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!tenantId || !articleForm.title.trim()) return;
    await request<KnowledgeArticle>("/v1/docs/articles", {
      method: "POST",
      body: JSON.stringify({
        tenant_id: tenantId,
        title: articleForm.title,
        category: articleForm.category || "Procedimento",
        status: "draft",
      }),
    });
    setArticleForm({ title: "", category: "" });
    setMessage("Artigo criado na base de conhecimento.");
    await loadData();
  }

  async function createCredential(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!tenantId || !credentialForm.name.trim()) return;
    await request<VaultCredential>("/v1/vault/credentials", {
      method: "POST",
      body: JSON.stringify({
        tenant_id: tenantId,
        name: credentialForm.name,
        username: credentialForm.username,
        secret_hint: "********",
        access_level: "restricted",
      }),
    });
    setCredentialForm({ name: "", username: "" });
    setMessage("Credencial salva no cofre com segredo mascarado.");
    await loadData();
  }

  async function createAutomation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!tenantId || !automationForm.name.trim()) return;
    await request<AutomationRule>("/v1/automations", {
      method: "POST",
      body: JSON.stringify({
        tenant_id: tenantId,
        name: automationForm.name,
        trigger: automationForm.trigger || "manual",
        action: automationForm.action || "notify_team",
        enabled: true,
      }),
    });
    setAutomationForm({ name: "", trigger: "", action: "" });
    setMessage("Automacao criada e ativada.");
    await loadData();
  }

  const indicators = [
    { label: "Equipamentos online", value: summary?.assets_online ?? 0, tone: "text-action" },
    { label: "Equipamentos offline", value: summary?.assets_offline ?? 0, tone: "text-warning" },
    { label: "Chamados abertos", value: summary?.tickets_open ?? 0, tone: "text-ink" },
    { label: "Criticos", value: summary?.tickets_critical ?? 0, tone: "text-red-700" },
  ];

  return (
    <main className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="text-sm font-semibold uppercase text-action">Sistech OS</p>
            <h1 className="text-2xl font-semibold text-ink">Centro operacional MSP</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {message}
            </span>
            <button
              className="inline-flex items-center gap-2 rounded-md bg-action px-4 py-2 text-sm font-semibold text-white"
              onClick={loadData}
              type="button"
            >
              <RefreshCw size={16} />
              Atualizar
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[240px_1fr]">
        <aside className="border-r border-slate-200 pr-6">
          <nav className="grid gap-1 text-sm font-medium text-slate-700">
            {modules.map((module) => {
              const Icon = module.icon;
              const selected = activeModule === module.id;
              return (
                <button
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-left ${
                    selected ? "bg-white text-ink shadow-sm" : "hover:bg-white hover:text-ink"
                  }`}
                  key={module.id}
                  onClick={() => setActiveModule(module.id)}
                  type="button"
                >
                  <Icon size={16} />
                  {module.name}
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="grid gap-6">
          {activeModule === "dashboard" && (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                {indicators.map((indicator) => (
                  <div className="rounded-md border border-slate-200 bg-white p-4" key={indicator.label}>
                    <p className="text-sm text-slate-600">{indicator.label}</p>
                    <p className={`mt-2 text-3xl font-semibold ${indicator.tone}`}>{indicator.value}</p>
                  </div>
                ))}
              </div>
              <div className="grid gap-4 xl:grid-cols-2">
                <Panel title="Ativos recentes">
                  <AssetTable assets={assets} />
                </Panel>
                <Panel title="Chamados em aberto">
                  <TicketTable assetById={assetById} tickets={tickets} />
                </Panel>
              </div>
            </>
          )}

          {activeModule === "inventory" && (
            <Panel title="Inventario de TI">
              <form className="mb-5 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]" onSubmit={createAsset}>
                <input
                  className="rounded-md border border-slate-300 px-3 py-2"
                  onChange={(event) => setAssetForm({ ...assetForm, hostname: event.target.value })}
                  placeholder="Hostname"
                  value={assetForm.hostname}
                />
                <input
                  className="rounded-md border border-slate-300 px-3 py-2"
                  onChange={(event) => setAssetForm({ ...assetForm, operating_system: event.target.value })}
                  placeholder="Sistema operacional"
                  value={assetForm.operating_system}
                />
                <input
                  className="rounded-md border border-slate-300 px-3 py-2"
                  onChange={(event) => setAssetForm({ ...assetForm, ip_address: event.target.value })}
                  placeholder="IP"
                  value={assetForm.ip_address}
                />
                <ActionButton label="Cadastrar" icon={Plus} />
              </form>
              <AssetTable assets={assets} />
            </Panel>
          )}

          {activeModule === "tickets" && (
            <Panel title="Help Desk">
              <form className="mb-5 grid gap-3" onSubmit={createTicket}>
                <div className="grid gap-3 md:grid-cols-[1fr_180px]">
                  <input
                    className="rounded-md border border-slate-300 px-3 py-2"
                    onChange={(event) => setTicketForm({ ...ticketForm, subject: event.target.value })}
                    placeholder="Assunto"
                    value={ticketForm.subject}
                  />
                  <select
                    className="rounded-md border border-slate-300 px-3 py-2"
                    onChange={(event) => setTicketForm({ ...ticketForm, priority: event.target.value })}
                    value={ticketForm.priority}
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                    <option value="critical">Critica</option>
                  </select>
                </div>
                <textarea
                  className="min-h-24 rounded-md border border-slate-300 px-3 py-2"
                  onChange={(event) => setTicketForm({ ...ticketForm, description: event.target.value })}
                  placeholder="Descricao"
                  value={ticketForm.description}
                />
                <div>
                  <ActionButton label="Abrir chamado" icon={Plus} />
                </div>
              </form>
              <TicketTable assetById={assetById} tickets={tickets} />
            </Panel>
          )}

          {activeModule === "rmm" && (
            <>
              <Panel title="Monitoramento em tempo real">
                <p className="mb-4 text-sm text-slate-600">
                  Telemetria atualizada automaticamente a cada 15 segundos. Equipamentos sem check-in nos ultimos 5
                  minutos ficam offline.
                </p>
                <div className="overflow-hidden rounded-md border border-slate-200">
                  <table className="w-full border-collapse bg-white text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-4 py-3">Hostname</th>
                        <th className="px-4 py-3">IP</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">CPU</th>
                        <th className="px-4 py-3">RAM</th>
                        <th className="px-4 py-3">Disco livre</th>
                        <th className="px-4 py-3">Ultimo sinal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assets.map((asset) => {
                        const sample = latestTelemetryByAsset.get(asset.id);
                        return (
                          <tr className="border-t border-slate-200" key={asset.id}>
                            <td className="px-4 py-3 font-medium text-ink">{asset.hostname}</td>
                            <td className="px-4 py-3">{asset.ip_address || "-"}</td>
                            <td className="px-4 py-3">
                              <StatusBadge status={asset.status} />
                            </td>
                            <td className="px-4 py-3">{sample ? `${sample.cpu_percent.toFixed(1)}%` : "-"}</td>
                            <td className="px-4 py-3">{sample ? `${sample.memory_percent.toFixed(1)}%` : "-"}</td>
                            <td className="px-4 py-3">
                              {sample ? `${sample.disk_free_percent.toFixed(1)}%` : "-"}
                            </td>
                            <td className="px-4 py-3">{formatDateTime(asset.last_seen_at)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Panel>

              <Panel title="Comandos remotos">
                {tenantId && (
                  <div className="mb-4 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    <p className="font-medium text-ink">Instalar agente nesta maquina</p>
                    <p className="mt-1">
                      <code className="rounded bg-white px-1 py-0.5">
                        python agent.py --api-url http://127.0.0.1:8000 --tenant-id {tenantId}
                      </code>
                    </p>
                  </div>
                )}
                <form className="mb-5 grid gap-3 md:grid-cols-[1fr_220px_auto]" onSubmit={sendCommand}>
                  <select
                    className="rounded-md border border-slate-300 px-3 py-2"
                    onChange={(event) => setCommandForm({ ...commandForm, asset_id: event.target.value })}
                    value={commandForm.asset_id}
                  >
                    {assets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.hostname} ({asset.status})
                      </option>
                    ))}
                  </select>
                  <select
                    className="rounded-md border border-slate-300 px-3 py-2"
                    onChange={(event) => setCommandForm({ ...commandForm, command: event.target.value })}
                    value={commandForm.command}
                  >
                    {commandOptions.map((command) => (
                      <option key={command} value={command}>
                        {command}
                      </option>
                    ))}
                  </select>
                  <ActionButton label="Enviar" icon={Send} />
                </form>
                <div className="overflow-hidden rounded-md border border-slate-200">
                  <table className="w-full border-collapse bg-white text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-4 py-3">Equipamento</th>
                        <th className="px-4 py-3">Comando</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Resultado</th>
                        <th className="px-4 py-3">Enviado em</th>
                      </tr>
                    </thead>
                    <tbody>
                      {commands.map((command) => (
                        <tr className="border-t border-slate-200" key={command.id}>
                          <td className="px-4 py-3">
                            {assetById.get(command.asset_id)?.hostname ?? command.asset_id}
                          </td>
                          <td className="px-4 py-3">{command.command}</td>
                          <td className="px-4 py-3">
                            <StatusBadge status={command.status} />
                          </td>
                          <td className="max-w-xs truncate px-4 py-3 text-slate-600">
                            {command.result_message || "-"}
                          </td>
                          <td className="px-4 py-3">{formatDateTime(command.created_at)}</td>
                        </tr>
                      ))}
                      {commands.length === 0 && (
                        <tr>
                          <td className="px-4 py-6 text-slate-500" colSpan={5}>
                            Nenhum comando enviado ainda.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Panel>
            </>
          )}

          {activeModule === "contracts" && (
            <Panel title="Contratos">
              <QuickForm onSubmit={createContract}>
                <TextInput onChange={(value) => setContractForm({ ...contractForm, customer_name: value })} placeholder="Cliente" value={contractForm.customer_name} />
                <TextInput onChange={(value) => setContractForm({ ...contractForm, monthly_value: value })} placeholder="Mensalidade" value={contractForm.monthly_value} />
                <TextInput onChange={(value) => setContractForm({ ...contractForm, hours_included: value })} placeholder="Horas contratadas" value={contractForm.hours_included} />
                <ActionButton label="Cadastrar" icon={Plus} />
              </QuickForm>
              <SimpleTable
                columns={["Cliente", "Tipo", "Mensalidade", "Horas", "Status"]}
                rows={contracts.map((contract) => [
                  contract.customer_name,
                  contract.contract_type,
                  currency(contract.monthly_value),
                  `${contract.hours_used}/${contract.hours_included}`,
                  contract.status,
                ])}
              />
            </Panel>
          )}

          {activeModule === "crm" && (
            <Panel title="CRM">
              <QuickForm onSubmit={createOpportunity}>
                <TextInput onChange={(value) => setOpportunityForm({ ...opportunityForm, company: value })} placeholder="Empresa" value={opportunityForm.company} />
                <TextInput onChange={(value) => setOpportunityForm({ ...opportunityForm, value: value })} placeholder="Valor estimado" value={opportunityForm.value} />
                <TextInput onChange={(value) => setOpportunityForm({ ...opportunityForm, owner: value })} placeholder="Responsavel" value={opportunityForm.owner} />
                <ActionButton label="Criar" icon={Plus} />
              </QuickForm>
              <SimpleTable
                columns={["Empresa", "Etapa", "Valor", "Responsavel"]}
                rows={opportunities.map((opportunity) => [
                  opportunity.company,
                  opportunity.stage,
                  currency(opportunity.value),
                  opportunity.owner,
                ])}
              />
            </Panel>
          )}

          {activeModule === "docs" && (
            <Panel title="Documentacao">
              <QuickForm onSubmit={createArticle}>
                <TextInput onChange={(value) => setArticleForm({ ...articleForm, title: value })} placeholder="Titulo do artigo" value={articleForm.title} />
                <TextInput onChange={(value) => setArticleForm({ ...articleForm, category: value })} placeholder="Categoria" value={articleForm.category} />
                <ActionButton label="Criar artigo" icon={Plus} />
              </QuickForm>
              <SimpleTable
                columns={["Titulo", "Categoria", "Status"]}
                rows={articles.map((article) => [article.title, article.category, article.status])}
              />
            </Panel>
          )}

          {activeModule === "vault" && (
            <Panel title="Cofre de Credenciais">
              <QuickForm onSubmit={createCredential}>
                <TextInput onChange={(value) => setCredentialForm({ ...credentialForm, name: value })} placeholder="Nome" value={credentialForm.name} />
                <TextInput onChange={(value) => setCredentialForm({ ...credentialForm, username: value })} placeholder="Usuario" value={credentialForm.username} />
                <ActionButton label="Salvar" icon={Plus} />
              </QuickForm>
              <SimpleTable
                columns={["Nome", "Usuario", "Segredo", "Acesso"]}
                rows={credentials.map((credential) => [
                  credential.name,
                  credential.username,
                  credential.secret_hint,
                  credential.access_level,
                ])}
              />
            </Panel>
          )}

          {activeModule === "automation" && (
            <Panel title="Automacoes">
              <QuickForm onSubmit={createAutomation}>
                <TextInput onChange={(value) => setAutomationForm({ ...automationForm, name: value })} placeholder="Nome da automacao" value={automationForm.name} />
                <TextInput onChange={(value) => setAutomationForm({ ...automationForm, trigger: value })} placeholder="Gatilho" value={automationForm.trigger} />
                <TextInput onChange={(value) => setAutomationForm({ ...automationForm, action: value })} placeholder="Acao" value={automationForm.action} />
                <ActionButton label="Ativar" icon={CheckCircle2} />
              </QuickForm>
              <SimpleTable
                columns={["Nome", "Gatilho", "Acao", "Status"]}
                rows={automations.map((automation) => [
                  automation.name,
                  automation.trigger,
                  automation.action,
                  automation.enabled ? "enabled" : "disabled",
                ])}
              />
            </Panel>
          )}

          {isLoading && <p className="text-sm text-slate-500">Carregando...</p>}
        </section>
      </div>
    </main>
  );
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API retornou ${response.status} em ${path}`);
  }

  return response.json() as Promise<T>;
}

function Panel({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-5">
      <h2 className="mb-4 text-lg font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
}

function ActionButton({ icon: Icon, label }: { icon: typeof Plus; label: string }) {
  return (
    <button
      className="inline-flex items-center justify-center gap-2 rounded-md bg-action px-4 py-2 font-semibold text-white"
      type="submit"
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

function QuickForm({ children, onSubmit }: { children: React.ReactNode; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <form className="mb-5 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]" onSubmit={onSubmit}>
      {children}
    </form>
  );
}

function TextInput({
  onChange,
  placeholder,
  value,
}: {
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <input
      className="rounded-md border border-slate-300 px-3 py-2"
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      value={value}
    />
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-md bg-teal-50 px-2 py-1 text-xs font-semibold text-action">
      {children}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700",
    offline: "bg-amber-50 text-amber-700",
    maintenance: "bg-blue-50 text-blue-700",
    retired: "bg-slate-100 text-slate-600",
    queued: "bg-slate-100 text-slate-700",
    running: "bg-blue-50 text-blue-700",
    completed: "bg-emerald-50 text-emerald-700",
    failed: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${styles[status] ?? "bg-slate-100 text-slate-700"}`}
    >
      {status}
    </span>
  );
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function AssetTable({ assets }: { assets: Asset[] }) {
  return (
    <div className="overflow-hidden rounded-md border border-slate-200">
      <table className="w-full border-collapse bg-white text-left text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="px-4 py-3">Hostname</th>
            <th className="px-4 py-3">Sistema</th>
            <th className="px-4 py-3">IP</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset) => (
            <tr className="border-t border-slate-200" key={asset.id}>
              <td className="px-4 py-3 font-medium text-ink">{asset.hostname}</td>
              <td className="px-4 py-3">{asset.operating_system || "-"}</td>
              <td className="px-4 py-3">{asset.ip_address || "-"}</td>
              <td className="px-4 py-3">
                <StatusBadge status={asset.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TicketTable({ assetById, tickets }: { assetById: Map<string, Asset>; tickets: Ticket[] }) {
  return (
    <div className="overflow-hidden rounded-md border border-slate-200">
      <table className="w-full border-collapse bg-white text-left text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="px-4 py-3">Assunto</th>
            <th className="px-4 py-3">Prioridade</th>
            <th className="px-4 py-3">Ativo</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr className="border-t border-slate-200" key={ticket.id}>
              <td className="px-4 py-3 font-medium text-ink">{ticket.subject}</td>
              <td className="px-4 py-3">{ticket.priority}</td>
              <td className="px-4 py-3">
                {ticket.asset_id ? assetById.get(ticket.asset_id)?.hostname ?? "-" : "-"}
              </td>
              <td className="px-4 py-3">
                <Badge>{ticket.status}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SimpleTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return (
    <div className="overflow-hidden rounded-md border border-slate-200">
      <table className="w-full border-collapse bg-white text-left text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            {columns.map((column) => (
              <th className="px-4 py-3" key={column}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr className="border-t border-slate-200" key={`${row[0]}-${rowIndex}`}>
              {row.map((cell, cellIndex) => (
                <td className="px-4 py-3" key={`${cell}-${cellIndex}`}>
                  {cellIndex === row.length - 1 ? <Badge>{cell}</Badge> : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function currency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(value);
}
