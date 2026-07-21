import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';

const REPORTS = [
  { id: 'pipeline', name: 'Pipeline por estagio' },
  { id: 'conversion', name: 'Conversao de leads' },
  { id: 'revenue', name: 'Receita prevista vs. realizada' },
  { id: 'sla', name: 'SLA de atendimento' },
];

export default function RelatoriosPage() {
  return (
    <>
      <PageHeader
        eyebrow="Insights"
        title={'Relat\u00f3rios'}
        description={
          'Insights comerciais e operacionais \u2014 exporta\u00e7\u00e3o CSV/PDF na Fase 5+.'
        }
      />
      <div className="grid gap-4 md:grid-cols-2">
        {REPORTS.map((report) => (
          <div key={report.id} className="card-panel">
            <h3 className="font-display text-bone">{report.name}</h3>
            <EmptyState
              title="Sem dados"
              description={'Execute a API e agregue eventos para popular este relat\u00f3rio.'}
            />
          </div>
        ))}
      </div>
    </>
  );
}
