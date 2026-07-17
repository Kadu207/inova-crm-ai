'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_GROUPS, NAV_ITEMS } from '@/lib/navigation';

type SidebarProps = {
  open?: boolean;
  onNavigate?: () => void;
};

export function Sidebar({ open = false, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      id="app-sidebar"
      className={[
        'fixed inset-y-0 left-0 z-40 flex w-[min(100%,var(--sidebar-width))] flex-col border-r border-line bg-base transition-transform duration-200 ease-out',
        'lg:static lg:z-auto lg:translate-x-0',
        open
          ? 'translate-x-0'
          : '-translate-x-full pointer-events-none lg:pointer-events-auto lg:translate-x-0',
      ].join(' ')}
    >
      <div className="flex h-14 items-center justify-between border-b border-line px-4 lg:hidden">
        <span className="font-display text-sm text-bone">Menu</span>
        <button
          type="button"
          className="btn-ghost touch-target px-2 py-1.5 text-xs"
          onClick={onNavigate}
          aria-label="Fechar menu"
        >
          Fechar
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-4" aria-label="Principal">
        {NAV_GROUPS.map((group) => (
          <div key={group} className="mb-6">
            <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-faint">
              {group}
            </p>
            <ul className="space-y-1">
              {NAV_ITEMS.filter((item) => item.group === group).map((item) => {
                const active =
                  item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={`block rounded-md px-3 py-2.5 text-sm transition-colors sm:py-2 ${
                        active
                          ? 'bg-mist font-medium text-flame'
                          : 'text-smoke hover:bg-mist hover:text-bone'
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
