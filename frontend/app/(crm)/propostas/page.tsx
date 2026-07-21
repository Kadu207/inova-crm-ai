import { CrmPage } from '@/components/CrmPage';

export default function PropostasPage() {
  return (
    <CrmPage
      eyebrow="Comercial"
      title="Propostas"
      description={'Propostas comerciais enviadas e em elabora\u00e7\u00e3o.'}
      resource="proposals"
      emptyTitle="Nenhuma proposta"
      emptyDescription="Gere propostas a partir de oportunidades qualificadas."
      actionLabel="Nova proposta"
    />
  );
}
