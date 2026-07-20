type StatusTone = 'ok' | 'warn' | 'bad' | 'neutral' | 'flame';

const TONE_CLASS: Record<StatusTone, string> = {
  ok: 'bg-ok/15 text-ok',
  warn: 'bg-warn/15 text-warn',
  bad: 'bg-bad/15 text-bad',
  neutral: 'bg-mist text-smoke',
  flame: 'bg-flame/15 text-flame',
};

type StatusBadgeProps = {
  label: string;
  tone?: StatusTone;
  className?: string;
};

export function StatusBadge({ label, tone = 'neutral', className = '' }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium ${TONE_CLASS[tone]} ${className}`}
    >
      {label}
    </span>
  );
}

export function leadStatusTone(status: string): StatusTone {
  switch (status) {
    case 'QUALIFIED':
    case 'CONVERTED':
      return 'ok';
    case 'NEW':
    case 'CONTACTED':
      return 'warn';
    case 'LOST':
      return 'bad';
    default:
      return 'neutral';
  }
}
