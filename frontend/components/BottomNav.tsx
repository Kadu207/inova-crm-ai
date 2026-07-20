'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavIcon } from '@/components/NavIcon';
import { BOTTOM_NAV_ITEMS, isNavActive } from '@/lib/navigation';

type BottomNavProps = {
  onMore: () => void;
};

export function BottomNav({ onMore }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-base/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      aria-label="Navegação rápida"
    >
      <ul className="grid h-16 grid-cols-5">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const active = isNavActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex h-full flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium ${
                  active ? 'text-flame' : 'text-smoke'
                }`}
              >
                <NavIcon name={item.icon} className="h-5 w-5" />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            onClick={onMore}
            className="flex h-full w-full flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium text-smoke"
            aria-label="Mais módulos"
          >
            <NavIcon name="more" className="h-5 w-5" />
            <span>Mais</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
