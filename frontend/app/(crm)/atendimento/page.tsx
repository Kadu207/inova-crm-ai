import { CrmPage } from '@/components/CrmPage';

export default function AtendimentoPage() {
  return (
    <CrmPage
      title="Atendimento"
      description="Conversas sincronizadas via Chatwoot — canais omnichannel."
      resource="conversations"
      emptyTitle="Nenhuma conversa"
      emptyDescription="As conversas do Chatwoot aparecerão aqui após a integração Fase 2."
      actionLabel="Abrir Chatwoot"
    />
  );
}
