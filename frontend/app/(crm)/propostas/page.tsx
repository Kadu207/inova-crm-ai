import { CrmPage } from '@/components/CrmPage';

export default function PropostasPage() {
  return (
    <CrmPage
      eyebrow="Comercial"
      title="Propostas"
      description="Propostas comerciais enviadas e em elaboração."
      resource="proposals"
      emptyTitle="Nenhuma proposta"
      emptyDescription="Gere propostas a partir de oportunidades qualificadas."
      actionLabel="Nova proposta"
    />
  );
}
