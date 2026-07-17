import { CrmPage } from '@/components/CrmPage';

export default function ContatosPage() {
  return (
    <CrmPage
      title="Contatos"
      description="Pessoas e decisores do pipeline comercial."
      resource="contacts"
      emptyTitle="Nenhum contato"
      emptyDescription="Importe contatos ou crie manualmente para iniciar o relacionamento."
      actionLabel="Novo contato"
    />
  );
}
