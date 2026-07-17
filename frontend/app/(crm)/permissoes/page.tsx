import { PageHeader } from '@/components/PageHeader';

const ROLES = [
  { name: 'admin', description: 'Acesso total ao tenant' },
  { name: 'vendas', description: 'Leads, funil e propostas' },
  { name: 'atendimento', description: 'Conversas e tarefas' },
  { name: 'financeiro', description: 'Faturas e cobrança' },
  { name: 'readonly', description: 'Somente leitura' },
];

export default function PermissoesPage() {
  return (
    <>
      <PageHeader
        title="Permissões"
        description="Papéis RBAC por tenant — sincronizado com JWT claims."
      />
      <div className="card-panel space-y-4">
        {ROLES.map((role) => (
          <div
            key={role.name}
            className="flex items-center justify-between border-b border-line pb-4 last:border-0 last:pb-0"
          >
            <div>
              <p className="font-medium text-bone">{role.name}</p>
              <p className="text-sm text-smoke">{role.description}</p>
            </div>
            <button className="btn-ghost text-xs">Editar</button>
          </div>
        ))}
      </div>
    </>
  );
}
