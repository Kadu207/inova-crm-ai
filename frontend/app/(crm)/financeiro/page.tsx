import { CrmPage } from '@/components/CrmPage';

export default function FinanceiroPage() {
  return (
    <CrmPage
      eyebrow="Financeiro"
      title="Financeiro"
      description="Receitas, despesas e fluxo de caixa do tenant."
      resource="finance"
      emptyTitle="Sem lançamentos"
      emptyDescription="Integração financeira completa na Fase 5."
      actionLabel="Novo lançamento"
    />
  );
}
