import { CrmPage } from '@/components/CrmPage';

export default function ProdutosPage() {
  return (
    <CrmPage
      eyebrow={'Cat\u00e1logo'}
      title="Produtos"
      description={'Cat\u00e1logo de produtos para propostas e contratos.'}
      resource="products"
      emptyTitle={'Cat\u00e1logo vazio'}
      emptyDescription={'Cadastre produtos com pre\u00e7o e SKU para uso comercial.'}
      actionLabel="Novo produto"
    />
  );
}
