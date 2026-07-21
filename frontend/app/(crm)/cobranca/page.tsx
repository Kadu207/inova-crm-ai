import { CrmPage } from '@/components/CrmPage';

export default function CobrancaPage() {
  return (
    <CrmPage
      eyebrow="Financeiro"
      title={'Cobran\u00e7a'}
      description={'Faturas, boletos e inadimpl\u00eancia.'}
      resource="invoices"
      emptyTitle={'Nenhuma cobran\u00e7a'}
      emptyDescription="Faturas sao geradas a partir de contratos e eventos invoice.*"
      actionLabel={'Nova cobran\u00e7a'}
    />
  );
}
