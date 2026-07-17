import { PageHeader } from '@/components/PageHeader';
import { getApiBaseUrl } from '@/lib/api';

const KPI_STUBS = [
  { label: 'Leads ativos', value: '—', hint: 'via API' },
  { label: 'Oportunidades abertas', value: '—', hint: 'via API' },
  { label: 'Conversas hoje', value: '—', hint: 'Chatwoot sync' },
  { label: 'Receita prevista', value: '—', hint: 'funil' },
];

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Visão geral do tenant — API: ${getApiBaseUrl()}`}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPI_STUBS.map((kpi) => (
          <div key={kpi.label} className="card-panel">
            <p className="text-xs uppercase tracking-wide text-faint">{kpi.label}</p>
            <p className="mt-2 font-display text-3xl text-flame">{kpi.value}</p>
            <p className="mt-1 text-xs text-smoke">{kpi.hint}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 card-panel">
        <h2 className="font-display text-lg text-bone">Atividade recente</h2>
        <p className="mt-2 text-sm text-smoke">
          Nenhuma atividade ainda. Os eventos de domínio aparecerão aqui quando a API e os workers
          estiverem conectados.
        </p>
      </div>
    </>
  );
}
