import { CrmPage } from '@/components/CrmPage';

export default function ContratosPage() {
  return (
    <CrmPage
      eyebrow="Comercial"
      title="Contratos"
      description="Contratos assinados e vigência por cliente."
      resource="contracts"
      emptyTitle="Nenhum contrato"
      emptyDescription="Converta propostas aceitas em contratos com anexos no MinIO."
      actionLabel="Novo contrato"
    />
  );
}
