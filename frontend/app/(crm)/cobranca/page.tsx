import { CrmPage } from '@/components/CrmPage';

export default function CobrancaPage() {
  return (
    <CrmPage
      title="Cobrança"
      description="Faturas, boletos e inadimplência."
      resource="invoices"
      emptyTitle="Nenhuma cobrança"
      emptyDescription="Faturas são geradas a partir de contratos e eventos invoice.*."
      actionLabel="Nova cobrança"
    />
  );
}
