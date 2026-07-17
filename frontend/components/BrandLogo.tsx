import Link from 'next/link';

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="font-display text-lg tracking-tight text-bone">
      Inova<span className="font-bold text-flame">CRM</span>
      {!compact && <span className="text-smoke"> AI</span>}
    </Link>
  );
}
