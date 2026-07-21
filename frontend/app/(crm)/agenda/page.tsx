import { CrmPage } from '@/components/CrmPage';

export default function AgendaPage() {
  return (
    <CrmPage
      eyebrow={'Opera\u00e7\u00e3o'}
      title="Agenda"
      description={'Reuni\u00f5es, follow-ups e compromissos do time.'}
      resource="events"
      emptyTitle="Agenda vazia"
      emptyDescription={'Sincronize calend\u00e1rio ou agende compromissos no CRM.'}
      actionLabel="Novo evento"
    />
  );
}
