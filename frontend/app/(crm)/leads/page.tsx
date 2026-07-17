import { CrmPage } from '@/components/CrmPage';

export default function LeadsPage() {
  return (
    <CrmPage
      title="Leads"
      description="Entrada do funil — qualificação e scoring via IA (Fase 6)."
      resource="leads"
      emptyTitle="Nenhum lead"
      emptyDescription="Leads chegam via Chatwoot, formulários ou importação CSV."
      actionLabel="Novo lead"
    />
  );
}
