export function LoadingState({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-smoke">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-flame"
        role="status"
        aria-label={label}
      />
      <p>{label}</p>
    </div>
  );
}
