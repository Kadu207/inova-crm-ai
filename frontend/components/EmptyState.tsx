type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="card-panel flex flex-col items-center px-4 text-center sm:px-6">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-mist text-flame">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="h-6 w-6"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      </div>
      <h3 className="font-display text-lg text-bone">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-smoke">{description}</p>
      {actionLabel && onAction && (
        <button type="button" className="btn-primary mt-6" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
