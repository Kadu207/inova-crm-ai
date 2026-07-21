import { CrmPage } from '@/components/CrmPage';

export default function ProdutosPage() {
  return (
    <CrmPage
      eyebrow="Cat?logo"
      title="Produtos"
      description="Cat?logo de produtos para propostas e contratos."
      resource="products"
      emptyTitle="Cat?logo vazio"
      emptyDescription="Cadastre produtos com pre?o e SKU para uso comercial."
      actionLabel="Novo produto"
    />
  );
}
