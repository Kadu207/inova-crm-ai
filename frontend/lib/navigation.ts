export type NavItem = {
  href: string;
  label: string;
  group: string;
  /** Lucide-like icon key for rail / bottom nav */
  icon: NavIconKey;
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
  { href: '/financeiro', label: 'Financeiro', group: 'Financeiro', icon: 'wallet' },
  { href: '/cobranca', label: 'Cobrança', group: 'Financeiro', icon: 'receipt' },
  { href: '/atendimento', label: 'Atendimento', group: 'Canais', icon: 'chat' },
  { href: '/relatorios', label: 'Relatórios', group: 'Insights', icon: 'chart' },
  { href: '/configuracoes', label: 'Configurações', group: 'Sistema', icon: 'settings' },
  { href: '/usuarios', label: 'Usuários', group: 'Sistema', icon: 'user' },
  { href: '/permissoes', label: 'Permissões', group: 'Sistema', icon: 'shield' },
  { href: '/auditoria', label: 'Auditoria', group: 'Sistema', icon: 'audit' },
  { href: '/admin', label: 'Admin SaaS', group: 'SaaS', icon: 'admin' },
];

/** Bottom nav P0 — 4 destinos + Mais (abre drawer). */
export const BOTTOM_NAV_HREFS = ['/', '/leads', '/funil', '/atendimento'] as const;

export const BOTTOM_NAV_ITEMS: NavItem[] = BOTTOM_NAV_HREFS.map((href) =>
  NAV_ITEMS.find((item) => item.href === href)!,
);

export const NAV_GROUPS = Array.from(new Set(NAV_ITEMS.map((item) => item.group)));

export function isNavActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}
