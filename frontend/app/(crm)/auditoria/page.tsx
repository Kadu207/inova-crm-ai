import { CrmPage } from '@/components/CrmPage';

export default function AuditoriaPage() {
  return (
    <CrmPage
      eyebrow="Sistema"
      title="Auditoria"
      description={'Trilha de auditoria \u2014 worker-crm-audit e eventos de dom\u00ednio.'}
      resource="audit-logs"
      emptyTitle="Nenhum evento auditado"
      emptyDescription={
        'A\u00e7\u00f5es sens\u00edveis e acessos cross-tenant s\u00e3o registrados aqui.'
      }
    />
  );
}
