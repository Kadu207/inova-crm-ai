import { CrmPage } from '@/components/CrmPage';

export default function AgendaPage() {
  return (
    <CrmPage
      title="Agenda"
      description="Reuniões, follow-ups e compromissos do time."
      resource="events"
      emptyTitle="Agenda vazia"
      emptyDescription="Sincronize calendário ou agende compromissos no CRM."
      actionLabel="Novo evento"
    />
  );
}
