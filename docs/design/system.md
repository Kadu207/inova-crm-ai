# Design System — Ember Studio (Inova CRM AI)

**Versão:** 1.0  
**Modelo:** B — Ember Studio  
**Tema:** dark only  
**Piloto:** Dashboard · Leads · Funil

Tokens base: [tokens.md](./tokens.md)

---

## Princípios

1. **Densidade média** — informação clara sem clutter de marketing.
2. **Flame com parcimônia** — CTA primário, rota ativa, KPI principal, focus.
3. **Mobile-first** — touch ≥ 44px; bottom nav P0; drawer para o restante.
4. **Estados unificados** — Loading / Empty / Error em todo módulo.
5. **Sem purple/cream** — identidade Inova TI only.

---

## Breakpoints

| Token | Largura  | Comportamento                              |
| ----- | -------- | ------------------------------------------ |
| `sm`  | ≥ 640px  | cards → grid 2; ações em row               |
| `md`  | ≥ 768px  | tenant no topbar; tabelas confortáveis     |
| `lg`  | ≥ 1024px | sidebar/rail permanente; bottom nav oculto |
| `xl`  | ≥ 1280px | KPI 4 colunas; kanban grid                 |

---

## Shell — híbrido

### Desktop (`lg+`)

- **Rail** 4rem (ícones) expandível para 16rem (ícone + label) via pin/hover.
- Topbar: logo compacto, breadcrumb implícito via PageHeader, tenant · user, Sair.
- Conteúdo: `page-main` com padding responsivo.

### Mobile / tablet (`< lg`)

- Topbar + hamburger → **drawer** com navegação completa agrupada.
- **Bottom nav P0** (5 slots): Dashboard · Leads · Funil · Atendimento · Mais (abre drawer).
- Conteúdo com `padding-bottom` para não cobrir a bottom nav + safe-area.

---

## Tipografia

| Uso              | Fonte    | Classe                                                        |
| ---------------- | -------- | ------------------------------------------------------------- |
| Título de página | Sora     | `font-display text-xl sm:text-2xl text-bone`                  |
| Seção            | Sora     | `font-display text-lg text-bone`                              |
| KPI valor        | Sora     | `font-display text-3xl text-flame` (principal) ou `text-bone` |
| Corpo / tabela   | IBM Plex | `font-body text-sm text-bone`                                 |
| Label / meta     | IBM Plex | `text-xs uppercase tracking-wide text-faint`                  |

---

## Componentes canônicos

| Componente                  | Uso                                      |
| --------------------------- | ---------------------------------------- |
| `PageHeader`                | título + descrição + actions             |
| `KpiStat`                   | card KPI (label, value, hint, `accent?`) |
| `StatusBadge`               | status semântico (ok/warn/bad/neutral)   |
| `BottomNav`                 | navegação P0 mobile                      |
| `Sidebar`                   | drawer mobile + rail desktop             |
| `card-panel`                | superfície padrão                        |
| `btn-primary` / `btn-ghost` | ações                                    |
| `EntityCard`                | card de lista mobile (leads / deals)     |

---

## Responsividade por superfície

### Dashboard

- KPI: 1 → 2 (`sm`) → 4 (`xl`) colunas.
- Atividade: `card-panel` full width.

### Leads

- `≥ md`: tabela em `card-panel`.
- `< md`: `EntityCard` stack com ações full-width.

### Funil

- Horizontal snap (`kanban-board`) no mobile.
- Grid de colunas no `lg+`.
- Card deal: título, status badge, SLA badge, ações ghost/primary compactas.

---

## Acessibilidade

- Focus: `2px solid var(--inova-flame)` offset 2px.
- Status nunca só por cor (`StatusBadge` inclui texto).
- Bottom nav: `aria-current="page"` no item ativo.
- Drawer: Escape fecha; overlay fecha; `aria-expanded` no menu.

---

## Checklist visual (piloto)

- [ ] 375px — bottom nav + drawer + cards
- [ ] 768px — tabela leads + kanban scroll
- [ ] 1280px — rail + KPI 4 + kanban grid
- [ ] Dark only — sem toggle light
