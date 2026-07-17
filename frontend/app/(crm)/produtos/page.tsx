import { CrmPage } from '@/components/CrmPage';

export default function ProdutosPage() {
  return (
    <CrmPage
      title="Produtos"
      description="Catálogo de produtos para propostas e contratos."
      resource="products"
      emptyTitle="Catálogo vazio"
      emptyDescription="Cadastre produtos com preço e SKU para uso comercial."
      actionLabel="Novo produto"
    />
  );
}
