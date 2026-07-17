import { CrmPage } from '@/components/CrmPage';

export default function TarefasPage() {
  return (
    <CrmPage
      title="Tarefas"
      description="Atividades pendentes por usuário e oportunidade."
      resource="tasks"
      emptyTitle="Nenhuma tarefa"
      emptyDescription="Crie tarefas a partir de leads, oportunidades ou atendimento."
      actionLabel="Nova tarefa"
    />
  );
}
