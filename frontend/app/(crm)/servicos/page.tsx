import { CrmPage } from '@/components/CrmPage';

export default function ServicosPage() {
  return (
    <CrmPage
      title="Serviços"
      description="Serviços recorrentes e projetos para propostas."
      resource="services"
      emptyTitle="Nenhum serviço"
      emptyDescription="Defina serviços com SLA e precificação para o time comercial."
      actionLabel="Novo serviço"
    />
  );
}
