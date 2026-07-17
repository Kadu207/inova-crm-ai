type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = 'Não foi possível carregar',
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="card-panel border-bad/30 bg-bad/5">
      <h3 className="font-display text-lg text-bad">{title}</h3>
      <p className="mt-2 text-sm text-smoke">{message}</p>
      {onRetry && (
        <button type="button" className="btn-ghost mt-4" onClick={onRetry}>
          Tentar novamente
        </button>
      )}
    </div>
  );
}
