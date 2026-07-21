import { CrmPage } from '@/components/CrmPage';

export default function ServicosPage() {
  return (
    <CrmPage
      eyebrow={'Cat\u00e1logo'}
      title={'Servi\u00e7os'}
      description={'Servi\u00e7os recorrentes e projetos para propostas.'}
      resource="services"
      emptyTitle={'Nenhum servi\u00e7o'}
      emptyDescription={
        'Defina servi\u00e7os com SLA e precifica\u00e7\u00e3o para o time comercial.'
      }
      actionLabel={'Novo servi\u00e7o'}
    />
  );
}
