import { CrmPage } from '@/components/CrmPage';

export default function UsuariosPage() {
  return (
    <CrmPage
      eyebrow="Sistema"
      title="Usuários"
      description="Membros do tenant e convites pendentes."
      resource="users"
      emptyTitle="Nenhum usuário"
      emptyDescription="Convide membros do time e atribua papéis."
      actionLabel="Convidar usuário"
    />
  );
}
