import { CrmPage } from '@/components/CrmPage';

export default function AtendimentoPage() {
  return (
    <CrmPage
      title="Atendimento"
      description="Conversas sincronizadas via Chatwoot — canais omnichannel."
      resource="conversations"
      emptyTitle="Nenhuma conversa"
      emptyDescription="Mensagens no Chatwoot disparam sync-conversation (n8n) e aparecem aqui."
      actionLabel="Abrir Chatwoot"
    />
  );
}
