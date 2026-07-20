'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandLogo } from '@/components/BrandLogo';
import { NavIcon } from '@/components/NavIcon';
import { isNavActive, NAV_GROUPS, NAV_ITEMS } from '@/lib/navigation';

type SidebarProps = {
  open?: boolean;
  expanded?: boolean;
  onNavigate?: () => void;
  onToggleExpand?: () => void;
};

export function Sidebar({
  open = false,
  expanded = true,
  onNavigate,
  onToggleExpand,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      id="app-sidebar"
      className={[
        'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-line bg-base transition-[width,transform] duration-200 ease-out',
        'w-[min(100%,var(--sidebar-width))]',
        expanded ? 'lg:w-[var(--sidebar-width)]' : 'lg:w-[var(--sidebar-rail)]',
        'lg:static lg:z-auto lg:translate-x-0',
        open
          ? 'translate-x-0'
          : '-translate-x-full pointer-events-none lg:pointer-events-auto lg:translate-x-0',
      ].join(' ')}
    >
      <div
        className={[
          'flex h-14 items-center border-b border-line px-3',
          expanded ? 'justify-between gap-2' : 'lg:justify-center lg:gap-0',
        ].join(' ')}
      >
        <div className={expanded ? 'min-w-0' : 'min-w-0 lg:hidden'}>
          <BrandLogo compact />
        </div>
        {!expanded ? (
          <div className="hidden lg:block">
            <BrandLogo compact />
          </div>
        ) : null}
        <div className="flex items-center gap-1">
          {onToggleExpand ? (
            <button
              type="button"
              className="btn-ghost hidden touch-target px-2 py-1.5 text-xs lg:inline-flex"
              onClick={onToggleExpand}
              aria-label={expanded ? 'Recolher menu' : 'Expandir menu'}
              aria-pressed={expanded}
            >
              {expanded ? '«' : '»'}
            </button>
          ) : null}
          <button
            type="button"
            className="btn-ghost touch-target px-2 py-1.5 text-xs lg:hidden"
            onClick={onNavigate}
            aria-label="Fechar menu"
          >
            Fechar
          </button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto overscroll-contain px-2 py-4" aria-label="Principal">
        {NAV_GROUPS.map((group) => (
          <div key={group} className="mb-5">
            <p
              className={`mb-2 px-2 text-[10px] font-medium uppercase tracking-wider text-faint ${
                expanded ? '' : 'lg:sr-only'
              }`}
            >
              {group}
            </p>
            <ul className="space-y-0.5">
              {NAV_ITEMS.filter((item) => item.group === group).map((item) => {
                const active = isNavActive(pathname, item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      title={item.label}
                      aria-current={active ? 'page' : undefined}
                      className={[
                        'flex items-center gap-3 rounded-md px-2.5 py-2.5 text-sm transition-colors sm:py-2',
                        expanded ? '' : 'lg:justify-center lg:px-2',
                        active
                          ? 'bg-mist font-medium text-flame'
                          : 'text-smoke hover:bg-mist hover:text-bone',
                      ].join(' ')}
                    >
                      <NavIcon name={item.icon} className="h-5 w-5 shrink-0" />
                      <span className={expanded ? 'truncate' : 'truncate lg:hidden'}>
                        {item.label}
                      </span>
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
