import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  description: string;
  action?: ReactNode;
  eyebrow?: string;
};

export function PageHeader({ title, description, action, eyebrow }: PageHeaderProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-faint">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display text-xl tracking-tight text-bone sm:text-2xl">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-smoke">{description}</p>
      </div>
      {action ? (
        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row [&_.btn-primary]:w-full sm:[&_.btn-primary]:w-auto [&_.btn-ghost]:w-full sm:[&_.btn-ghost]:w-auto">
          {action}
        </div>
      ) : null}
    </div>
  );
}
