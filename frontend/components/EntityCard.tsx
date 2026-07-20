import type { ReactNode } from 'react';

type EntityCardProps = {
  title: string;
  meta?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
};

export function EntityCard({ title, meta, badge, actions }: EntityCardProps) {
  return (
    <article className="card-panel space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 break-words font-display text-base text-bone">{title}</h3>
        {badge}
      </div>
      {meta ? <div className="text-xs text-smoke">{meta}</div> : null}
      {actions ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">{actions}</div>
      ) : null}
    </article>
  );
}
