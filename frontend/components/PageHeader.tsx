type PageHeaderProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <h1 className="font-display text-xl text-bone sm:text-2xl">{title}</h1>
        <p className="mt-1 text-sm text-smoke">{description}</p>
      </div>
      {action ? (
        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row [&_.btn-primary]:w-full sm:[&_.btn-primary]:w-auto [&_.btn-ghost]:w-full sm:[&_.btn-ghost]:w-auto">
          {action}
        </div>
      ) : null}
    </div>
  );
}
