type KpiStatProps = {
  label: string;
  value: string;
  hint?: string;
  /** Highlight value with flame (primary metric). */
  accent?: boolean;
};

export function KpiStat({ label, value, hint, accent = false }: KpiStatProps) {
  return (
    <article className="card-panel">
      <p className="text-xs font-medium uppercase tracking-wide text-faint">{label}</p>
      <p
        className={`mt-2 font-display text-3xl tracking-tight ${accent ? 'text-flame' : 'text-bone'}`}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-smoke">{hint}</p> : null}
    </article>
  );
}
