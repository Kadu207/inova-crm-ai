/** Roles alinhados ao enum Prisma `UserRole` (API NestJS). */
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'SALES' | 'SUPPORT' | 'VIEWER';

export const ALL_ROLES: UserRole[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'MANAGER',
  'SALES',
  'SUPPORT',
  'VIEWER',
];

/** Admin tenant + gestores (config, usuários, auditoria, bulk, financeiro). */
export const ADMIN_MANAGER_ROLES: UserRole[] = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'];

/** Relatórios comerciais (API: ADMIN + SALES). */
export const REPORTS_ROLES: UserRole[] = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SALES'];

export type NavItem = {
  href: string;
  label: string;
  group: string;
  /** Lucide-like icon key for rail / bottom nav */
  icon: NavIconKey;
  /**
   * Papéis que veem o item. Omitido = todos autenticados.
   * Spec 030 — alinhar aos `@Roles` da API.
   */
  roles?: UserRole[];
};

export type NavIconKey =
  | 'home'
  | 'building'
  | 'users'
  | 'leads'
  | 'funnel'
  | 'target'
  | 'calendar'
  | 'check'
  | 'box'
  | 'wrench'
  | 'file'
  | 'contract'
  | 'wallet'
  | 'receipt'
  | 'chat'
  | 'chart'
  | 'settings'
  | 'user'
  | 'shield'
  | 'audit'
  | 'admin'
  | 'more';

export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Dashboard', group: 'Principal', icon: 'home' },
  { href: '/empresas', label: 'Empresas', group: 'CRM', icon: 'building' },
  { href: '/contatos', label: 'Contatos', group: 'CRM', icon: 'users' },
  { href: '/leads', label: 'Leads', group: 'CRM', icon: 'leads' },
  { href: '/funil', label: 'Funil', group: 'CRM', icon: 'funnel' },
  { href: '/oportunidades', label: 'Oportunidades', group: 'CRM', icon: 'target' },
  { href: '/agenda', label: 'Agenda', group: 'Operação', icon: 'calendar' },
  { href: '/tarefas', label: 'Tarefas', group: 'Operação', icon: 'check' },
  { href: '/produtos', label: 'Produtos', group: 'Catálogo', icon: 'box' },
  { href: '/servicos', label: 'Serviços', group: 'Catálogo', icon: 'wrench' },
  { href: '/propostas', label: 'Propostas', group: 'Comercial', icon: 'file' },
  { href: '/contratos', label: 'Contratos', group: 'Comercial', icon: 'contract' },
  {
    href: '/financeiro',
    label: 'Financeiro',
    group: 'Financeiro',
    icon: 'wallet',
    roles: ADMIN_MANAGER_ROLES,
  },
  {
    href: '/cobranca',
    label: 'Cobrança',
    group: 'Financeiro',
    icon: 'receipt',
    roles: ADMIN_MANAGER_ROLES,
  },
  { href: '/atendimento', label: 'Atendimento', group: 'Canais', icon: 'chat' },
  {
    href: '/relatorios',
    label: 'Relatórios',
    group: 'Insights',
    icon: 'chart',
    roles: REPORTS_ROLES,
  },
  {
    href: '/configuracoes',
    label: 'Configurações',
    group: 'Sistema',
    icon: 'settings',
    roles: ADMIN_MANAGER_ROLES,
  },
  {
    href: '/usuarios',
    label: 'Usuários',
    group: 'Sistema',
    icon: 'user',
    roles: ADMIN_MANAGER_ROLES,
  },
  {
    href: '/permissoes',
    label: 'Permissões',
    group: 'Sistema',
    icon: 'shield',
    roles: ADMIN_MANAGER_ROLES,
  },
  {
    href: '/auditoria',
    label: 'Auditoria',
    group: 'Sistema',
    icon: 'audit',
    roles: ADMIN_MANAGER_ROLES,
  },
  {
    href: '/bulk',
    label: 'Import/Export',
    group: 'Sistema',
    icon: 'file',
    roles: ADMIN_MANAGER_ROLES,
  },
  {
    href: '/admin',
    label: 'Admin SaaS',
    group: 'SaaS',
    icon: 'admin',
    roles: ['SUPER_ADMIN'],
  },
];

/** Bottom nav P0 — 4 destinos + Mais (abre drawer). */
export const BOTTOM_NAV_HREFS = ['/', '/leads', '/funil', '/atendimento'] as const;

export function normalizeRole(role: string | null | undefined): UserRole | null {
  if (!role) return null;
  const upper = role.trim().toUpperCase();
  return (ALL_ROLES as string[]).includes(upper) ? (upper as UserRole) : null;
}

export function canAccessNavItem(item: NavItem, role: string | null | undefined): boolean {
  const normalized = normalizeRole(role);
  if (!normalized) return false;
  const allowed = item.roles ?? ALL_ROLES;
  return allowed.includes(normalized);
}

export function filterNavItems(role: string | null | undefined): NavItem[] {
  return NAV_ITEMS.filter((item) => canAccessNavItem(item, role));
}

export function navGroupsForRole(role: string | null | undefined): string[] {
  return Array.from(new Set(filterNavItems(role).map((item) => item.group)));
}

/**
 * Resolve o item de nav mais específico que cobre o pathname
 * (ex.: `/leads/abc` → `/leads`). Sem match → rota livre (só auth).
 */
export function findNavItemForPath(pathname: string): NavItem | undefined {
  const sorted = [...NAV_ITEMS].sort((a, b) => b.href.length - a.href.length);
  return sorted.find((item) => isNavActive(pathname, item.href));
}

export function canAccessPath(pathname: string, role: string | null | undefined): boolean {
  const item = findNavItemForPath(pathname);
  if (!item) return Boolean(normalizeRole(role));
  return canAccessNavItem(item, role);
}

export const BOTTOM_NAV_ITEMS: NavItem[] = BOTTOM_NAV_HREFS.map((href) =>
  NAV_ITEMS.find((item) => item.href === href)!,
);

export const NAV_GROUPS = Array.from(new Set(NAV_ITEMS.map((item) => item.group)));

export function isNavActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}
