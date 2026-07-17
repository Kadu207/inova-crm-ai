import { CrmPage } from '@/components/CrmPage';

export default function EmpresasPage() {
  return (
    <CrmPage
      title="Empresas"
      description="Contas e organizações vinculadas ao tenant."
      resource="companies"
      emptyTitle="Nenhuma empresa cadastrada"
      emptyDescription="Cadastre empresas para vincular contatos, oportunidades e contratos."
      actionLabel="Nova empresa"
    />
  );
}
