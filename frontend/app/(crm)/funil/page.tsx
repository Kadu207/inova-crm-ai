import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';

const COLUMNS = ['Prospecção', 'Qualificação', 'Proposta', 'Negociação', 'Fechado'];

export default function FunilPage() {
  return (
    <>
      <PageHeader
        title="Funil"
        description="Kanban de oportunidades por estágio — dados via API pipeline."
        action={<button className="btn-primary">Nova oportunidade</button>}
      />
      <div className="kanban-board lg:grid lg:grid-cols-5 lg:overflow-visible lg:pb-0 lg:snap-none">
        {COLUMNS.map((column) => (
          <div
            key={column}
            className="kanban-column card-panel min-h-[240px] lg:w-auto lg:min-h-[280px]"
          >
            <h3 className="font-display text-sm text-bone">{column}</h3>
            <div className="mt-4">
              <EmptyState title="Vazio" description={`Nenhum deal em ${column.toLowerCase()}.`} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-faint lg:hidden">
        Deslize horizontalmente para ver os estágios.
      </p>
    </>
  );
}
