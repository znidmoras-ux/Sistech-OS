import {
  Activity,
  Bell,
  BriefcaseBusiness,
  FileText,
  HardDrive,
  LockKeyhole,
  TicketCheck,
  Users,
} from "lucide-react";

const indicators = [
  { label: "Equipamentos online", value: "0", tone: "text-action" },
  { label: "Equipamentos offline", value: "0", tone: "text-warning" },
  { label: "Chamados abertos", value: "0", tone: "text-ink" },
  { label: "SLA violado", value: "0", tone: "text-red-700" },
];

const modules = [
  { name: "RMM", icon: Activity, text: "Telemetria, alertas e comandos remotos." },
  { name: "Inventario", icon: HardDrive, text: "Ativos, garantia, rede e patrimonio." },
  { name: "Help Desk", icon: TicketCheck, text: "Chamados, SLA, anexos e horas tecnicas." },
  { name: "Contratos", icon: BriefcaseBusiness, text: "Horas, renovacoes e acordos de SLA." },
  { name: "CRM", icon: Users, text: "Leads, propostas, follow-up e historico." },
  { name: "Documentacao", icon: FileText, text: "Procedimentos, artigos e permissoes." },
  { name: "Cofre", icon: LockKeyhole, text: "Credenciais, tokens e auditoria de acesso." },
  { name: "Automacoes", icon: Bell, text: "Alertas, escalonamento e notificacoes." },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-action">Sistech OS</p>
            <h1 className="text-2xl font-semibold text-ink">Centro operacional MSP</h1>
          </div>
          <button className="rounded-md bg-action px-4 py-2 text-sm font-semibold text-white">
            Novo chamado
          </button>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[240px_1fr]">
        <aside className="border-r border-slate-200 pr-6">
          <nav className="grid gap-1 text-sm font-medium text-slate-700">
            {["Dashboard", "RMM", "Inventario", "Help Desk", "Clientes", "Financeiro"].map(
              (item) => (
                <a
                  className="rounded-md px-3 py-2 hover:bg-white hover:text-ink"
                  href="#"
                  key={item}
                >
                  {item}
                </a>
              ),
            )}
          </nav>
        </aside>

        <section className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-4">
            {indicators.map((indicator) => (
              <div className="rounded-md border border-slate-200 bg-white p-4" key={indicator.label}>
                <p className="text-sm text-slate-600">{indicator.label}</p>
                <p className={`mt-2 text-3xl font-semibold ${indicator.tone}`}>{indicator.value}</p>
              </div>
            ))}
          </div>

          <div>
            <h2 className="text-lg font-semibold text-ink">Modulos planejados</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {modules.map((module) => {
                const Icon = module.icon;
                return (
                  <article
                    className="rounded-md border border-slate-200 bg-white p-4"
                    key={module.name}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-teal-50 text-action">
                      <Icon aria-hidden size={20} />
                    </div>
                    <h3 className="mt-3 font-semibold text-ink">{module.name}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{module.text}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
