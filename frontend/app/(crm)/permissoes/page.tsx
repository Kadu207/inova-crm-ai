import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';

const ROLES = [
  { name: 'admin', description: 'Acesso total ao tenant', tone: 'flame' as const },
  { name: 'vendas', description: 'Leads, funil e propostas', tone: 'ok' as const },
  { name: 'atendimento', description: 'Conversas e tarefas', tone: 'warn' as const },
  { name: 'financeiro', description: 'Faturas e cobranca', tone: 'neutral' as const },
  { name: 'readonly', description: 'Somente leitura', tone: 'neutral' as const },
];

export default function PermissoesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Sistema"
        title={'Permiss\u00f5es'}
        description={'Pap\u00e9is RBAC por tenant \u2014 sincronizado com JWT claims.'}
      />
      <div className="card-panel space-y-4">
        {ROLES.map((role) => (
          <div
            key={role.name}
            className="flex items-center justify-between border-b border-line pb-4 last:border-0 last:pb-0"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-bone">{role.name}</p>
                <StatusBadge label={role.name} tone={role.tone} />
              </div>
              <p className="mt-1 text-sm text-smoke">{role.description}</p>
            </div>
            <button type="button" className="btn-ghost text-xs">
              Editar
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
