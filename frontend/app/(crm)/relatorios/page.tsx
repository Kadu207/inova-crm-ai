import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';

const REPORTS = [
  { id: 'pipeline', name: 'Pipeline por estágio' },
  { id: 'conversion', name: 'Conversão de leads' },
  { id: 'revenue', name: 'Receita prevista vs. realizada' },
  { id: 'sla', name: 'SLA de atendimento' },
];

export default function RelatoriosPage() {
  return (
    <>
      <PageHeader
        eyebrow="Insights"
        title="Relatórios"
        description="Insights comerciais e operacionais — exportação CSV/PDF na Fase 5+."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {REPORTS.map((report) => (
          <div key={report.id} className="card-panel">
            <h3 className="font-display text-bone">{report.name}</h3>
            <EmptyState
              title="Sem dados"
              description="Execute a API e agregue eventos para popular este relatório."
            />
          </div>
        ))}
      </div>
    </>
  );
}
