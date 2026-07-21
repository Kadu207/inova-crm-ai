import { CrmPage } from '@/components/CrmPage';

export default function AuditoriaPage() {
  return (
    <CrmPage
      eyebrow="Sistema"
      title="Auditoria"
      description="Trilha de auditoria — worker-crm-audit e eventos de domínio."
      resource="audit-logs"
      emptyTitle="Nenhum evento auditado"
      emptyDescription="Ações sensíveis e acessos cross-tenant são registrados aqui."
    />
  );
}
