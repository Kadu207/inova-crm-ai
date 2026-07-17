import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { PageHeader } from '@/components/PageHeader';
import { fetchListStub } from '@/lib/api';

type CrmPageProps = {
  title: string;
  description: string;
  resource: string;
  emptyTitle: string;
  emptyDescription: string;
  actionLabel?: string;
};

export async function CrmPage({
  title,
  description,
  resource,
  emptyTitle,
  emptyDescription,
  actionLabel = 'Criar registro',
}: CrmPageProps) {
  const result = await fetchListStub<{ id: string; name?: string }>(resource);

  if (!result.ok) {
    return (
      <>
        <PageHeader title={title} description={description} />
        <ErrorState message={result.error.message} />
      </>
    );
  }

  const items = result.data;

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        action={<button className="btn-primary">{actionLabel}</button>}
      />
      {items.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="card-panel">
          <ul className="divide-y divide-line">
            {items.map((item) => (
              <li key={item.id} className="break-words py-3 text-sm text-bone">
                {item.name ?? item.id}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

export function CrmPageLoading() {
  return <LoadingState />;
}
