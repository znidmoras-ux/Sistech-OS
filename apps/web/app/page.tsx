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
  status: string;
  created_at: string;
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
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("Conectando com a API...");
  const [assetForm, setAssetForm] = useState({ hostname: "", operating_system: "", ip_address: "" });
  const [ticketForm, setTicketForm] = useState({ subject: "", description: "", priority: "medium" });
  const [commandForm, setCommandForm] = useState({ asset_id: "", command: commandOptions[0] });

  const tenantId = tenants[0]?.id;

  async function loadData() {
    setIsLoading(true);
    try {
      const [summaryData, tenantData, assetData, ticketData, commandData] = await Promise.all([
        request<DashboardSummary>("/v1/dashboard"),
        request<Tenant[]>("/v1/tenants"),
        request<Asset[]>("/v1/assets"),
        request<Ticket[]>("/v1/tickets"),
        request<CommandResult[]>("/v1/rmm/commands"),
      ]);

      setSummary(summaryData);
      setTenants(tenantData);
      setAssets(assetData);
      setTickets(ticketData);
      setCommands(commandData);
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
            <Panel title="RMM">
              <form className="mb-5 grid gap-3 md:grid-cols-[1fr_220px_auto]" onSubmit={sendCommand}>
                <select
                  className="rounded-md border border-slate-300 px-3 py-2"
                  onChange={(event) => setCommandForm({ ...commandForm, asset_id: event.target.value })}
                  value={commandForm.asset_id}
                >
                  {assets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.hostname}
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
                    </tr>
                  </thead>
                  <tbody>
                    {commands.map((command) => (
                      <tr className="border-t border-slate-200" key={command.id}>
                        <td className="px-4 py-3">{assetById.get(command.asset_id)?.hostname ?? command.asset_id}</td>
                        <td className="px-4 py-3">{command.command}</td>
                        <td className="px-4 py-3">
                          <Badge>{command.status}</Badge>
                        </td>
                      </tr>
                    ))}
                    {commands.length === 0 && (
                      <tr>
                        <td className="px-4 py-6 text-slate-500" colSpan={3}>
                          Nenhum comando enviado ainda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}

          {!["dashboard", "inventory", "tickets", "rmm"].includes(activeModule) && (
            <Panel title={modules.find((module) => module.id === activeModule)?.name ?? "Modulo"}>
              <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 text-slate-700">
                <CheckCircle2 className="text-action" size={20} />
                Modulo mapeado no produto e pronto para receber as proximas telas do MVP.
              </div>
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

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-md bg-teal-50 px-2 py-1 text-xs font-semibold text-action">
      {children}
    </span>
  );
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
                <Badge>{asset.status}</Badge>
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
