'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { BrandLogo } from '@/components/BrandLogo';
import { Sidebar } from '@/components/Sidebar';
import { AuthSession, clearSession, getSession } from '@/lib/auth';

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSessionState] = useState<AuthSession | null>(null);
  const [ready, setReady] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    const current = getSession();
    if (!current?.accessToken) {
      router.replace('/login');
      return;
    }
    setSessionState(current);
    setReady(true);
  }, [router]);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNavOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [navOpen]);

  function logout() {
    clearSession();
    router.replace('/login');
  }

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-void px-4 text-smoke">
        Carregando sessão…
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh bg-void">
      {navOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          aria-label="Fechar menu"
          onClick={() => setNavOpen(false)}
        />
      ) : null}

      <Sidebar open={navOpen} onNavigate={() => setNavOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-line bg-base/95 px-3 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              className="btn-ghost touch-target px-2.5 lg:hidden"
              aria-expanded={navOpen}
              aria-controls="app-sidebar"
              onClick={() => setNavOpen((v) => !v)}
            >
              <span className="sr-only">Abrir menu</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
                aria-hidden
              >
                <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
            <BrandLogo compact />
          </div>
          <div className="flex shrink-0 items-center gap-2 text-sm text-smoke sm:gap-3">
            <span className="hidden max-w-[12rem] truncate md:inline lg:max-w-xs">
              {session?.tenantSlug ?? 'tenant'} · {session?.userName}
            </span>
            <span className="truncate text-xs md:hidden">{session?.tenantSlug}</span>
            <button type="button" onClick={logout} className="btn-ghost px-3 py-1.5 text-xs">
              Sair
            </button>
          </div>
        </header>
        <main className="page-main">{children}</main>
      </div>
    </div>
  );
}
