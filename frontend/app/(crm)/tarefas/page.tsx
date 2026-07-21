import { CrmPage } from '@/components/CrmPage';

export default function TarefasPage() {
  return (
    <CrmPage
      eyebrow={'Opera\u00e7\u00e3o'}
      title="Tarefas"
      description={'Atividades pendentes por usu\u00e1rio e oportunidade.'}
      resource="tasks"
      emptyTitle="Nenhuma tarefa"
      emptyDescription={'Crie tarefas a partir de leads, oportunidades ou atendimento.'}
      actionLabel="Nova tarefa"
    />
  );
}
