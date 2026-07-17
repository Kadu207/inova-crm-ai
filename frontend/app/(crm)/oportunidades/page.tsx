import { CrmPage } from '@/components/CrmPage';

export default function OportunidadesPage() {
  return (
    <CrmPage
      title="Oportunidades"
      description="Deals em andamento com valor, estágio e responsável."
      resource="opportunities"
      emptyTitle="Nenhuma oportunidade"
      emptyDescription="Converta leads qualificados ou crie oportunidades manualmente."
      actionLabel="Nova oportunidade"
    />
  );
}
