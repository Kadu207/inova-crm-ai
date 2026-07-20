import { KpiStat } from '@/components/KpiStat';
import { PageHeader } from '@/components/PageHeader';
import { getApiBaseUrl } from '@/lib/api';

const KPI_STUBS = [
  { label: 'Leads ativos', value: '—', hint: 'via API', accent: true },
  { label: 'Oportunidades abertas', value: '—', hint: 'via API', accent: false },
  { label: 'Conversas hoje', value: '—', hint: 'Chatwoot sync', accent: false },
  { label: 'Receita prevista', value: '—', hint: 'funil', accent: false },
];

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        eyebrow="Principal"
        title="Dashboard"
        description={`Visão geral do tenant — API: ${getApiBaseUrl()}`}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPI_STUBS.map((kpi) => (
          <KpiStat
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            hint={kpi.hint}
            accent={kpi.accent}
          />
        ))}
      </div>
      <section className="mt-6 card-panel">
        <h2 className="font-display text-lg text-bone">Atividade recente</h2>
        <p className="mt-2 text-sm text-smoke">
          Nenhuma atividade ainda. Os eventos de domínio aparecerão aqui quando a API e os workers
          estiverem conectados.
        </p>
      </section>
    </>
  );
}
