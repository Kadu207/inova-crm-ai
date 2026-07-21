import { CrmPage } from '@/components/CrmPage';

export default function EmpresasPage() {
  return (
    <CrmPage
      eyebrow="CRM"
      title="Empresas"
      description={'Contas e organiza\u00e7\u00f5es vinculadas ao tenant.'}
      resource="companies"
      emptyTitle="Nenhuma empresa cadastrada"
      emptyDescription="Cadastre empresas para vincular contatos, oportunidades e contratos."
      actionLabel="Nova empresa"
    />
  );
}
