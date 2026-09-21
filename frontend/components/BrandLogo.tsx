import Image from 'next/image';
import Link from 'next/link';

type BrandLogoProps = {
  compact?: boolean;
  /** Show flame mark (default true) */
  mark?: boolean;
};

export function BrandLogo({ compact = false, mark = true }: BrandLogoProps) {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 font-display text-lg tracking-tight text-bone"
      aria-label="Inova CRM AI — início"
    >
      {mark ? (
        <Image
          src="/icons/icon-192.png"
          alt=""
          width={28}
          height={28}
          className="h-7 w-7 rounded-md"
          priority
        />
      ) : null}
      <span>
        Inova<span className="font-bold text-flame">CRM</span>
        {!compact && <span className="text-smoke"> AI</span>}
      </span>
    </Link>
  );
}
