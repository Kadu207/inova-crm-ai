export type NavItem = {
  href: string;
  label: string;
  group: string;
};

export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Dashboard', group: 'Principal' },
  { href: '/empresas', label: 'Empresas', group: 'CRM' },
  { href: '/contatos', label: 'Contatos', group: 'CRM' },
  { href: '/leads', label: 'Leads', group: 'CRM' },
  { href: '/funil', label: 'Funil', group: 'CRM' },
  { href: '/oportunidades', label: 'Oportunidades', group: 'CRM' },
  { href: '/agenda', label: 'Agenda', group: 'Operação' },
  { href: '/tarefas', label: 'Tarefas', group: 'Operação' },
  { href: '/produtos', label: 'Produtos', group: 'Catálogo' },
  { href: '/servicos', label: 'Serviços', group: 'Catálogo' },
  { href: '/propostas', label: 'Propostas', group: 'Comercial' },
  { href: '/contratos', label: 'Contratos', group: 'Comercial' },
  { href: '/financeiro', label: 'Financeiro', group: 'Financeiro' },
  { href: '/cobranca', label: 'Cobrança', group: 'Financeiro' },
  { href: '/atendimento', label: 'Atendimento', group: 'Canais' },
  { href: '/relatorios', label: 'Relatórios', group: 'Insights' },
  { href: '/configuracoes', label: 'Configurações', group: 'Sistema' },
  { href: '/usuarios', label: 'Usuários', group: 'Sistema' },
  { href: '/permissoes', label: 'Permissões', group: 'Sistema' },
  { href: '/auditoria', label: 'Auditoria', group: 'Sistema' },
  { href: '/admin', label: 'Admin SaaS', group: 'SaaS' },
];

export const NAV_GROUPS = Array.from(new Set(NAV_ITEMS.map((item) => item.group)));
