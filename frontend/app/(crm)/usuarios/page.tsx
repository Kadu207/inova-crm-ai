import { CrmPage } from '@/components/CrmPage';

export default function UsuariosPage() {
  return (
    <CrmPage
      eyebrow="Sistema"
      title={'Usu\u00e1rios'}
      description="Membros do tenant e convites pendentes."
      resource="users"
      emptyTitle={'Nenhum usu\u00e1rio'}
      emptyDescription={'Convide membros do time e atribua pap\u00e9is.'}
      actionLabel={'Convidar usu\u00e1rio'}
    />
  );
}
