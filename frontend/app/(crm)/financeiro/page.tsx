import { CrmPage } from '@/components/CrmPage';

export default function FinanceiroPage() {
  return (
    <CrmPage
      eyebrow="Financeiro"
      title="Financeiro"
      description="Receitas, despesas e fluxo de caixa do tenant."
      resource="finance"
      emptyTitle={'Sem lan\u00e7amentos'}
      emptyDescription={'Integra\u00e7\u00e3o financeira completa na Fase 5.'}
      actionLabel={'Novo lan\u00e7amento'}
    />
  );
}
