# Arquitetura Frontend — Inova CRM AI

**Volume:** 02  
**Versão:** 0.1 (Fase 0 — skeleton)  
**Status:** em construção

---

## Propósito

Define stack, estrutura de pastas, design system, roteamento e padrões de consumo da API no frontend Next.js.

---

## Sumário

1. [Propósito](#propósito)
2. [Stack](#stack)
3. [Estrutura de pastas](#estrutura-de-pastas)
4. [Design system](#design-system)
5. [Autenticação e tenant](#autenticação-e-tenant)
6. [Módulos UI](#módulos-ui)
7. [Testes e Quality Gate](#testes-e-quality-gate)

---

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- React Query / fetch tipado via OpenAPI client

## Estrutura de pastas

```
frontend/
  app/           # rotas App Router
  components/    # UI compartilhada
  lib/           # api client, auth, utils
  styles/        # tokens globais
```

## Design system

- Tokens: [design/tokens.md](./design/tokens.md)
- System (Ember Studio): [design/system.md](./design/system.md)
- Prompts Claude Design: [design/prompts-claude-design.md](./design/prompts-claude-design.md)
- **Marca Inova TI** — flame/void/bone; **não** usar defaults purple/cream de AI

## Autenticação e tenant

- JWT em cookie httpOnly ou header Bearer
- Tenant derivado do token — nunca de query param manipulável
- Redirect 401 → login

## Módulos UI

Dashboard, Leads, Funil Kanban, Contatos, Oportunidades, Atendimento, Configurações — ver [regras de negócio](./regras-negocio-crm.md).

### Rotas CRM (App Router)

| Rota             | Cliente               | Notas                                             |
| ---------------- | --------------------- | ------------------------------------------------- |
| `/` (dashboard)  | `DashboardClient`     | KPIs + `GET /dashboard/activity` timeline         |
| `/leads`         | `LeadsClient`         | Lista + modal create (`POST /leads`)              |
| `/leads/[id]`    | `LeadDetailClient`    | Detalhe, qualificar, converter                    |
| `/empresas`      | `CompaniesClient`     | Lista + modal create (`POST /companies`)          |
| `/empresas/[id]` | `CompanyDetailClient` | Detalhe                                           |
| `/contatos`      | `ContactsClient`      | Lista + modal create (`POST /contacts`)           |
| `/contatos/[id]` | `ContactDetailClient` | Detalhe                                           |
| `/funil`         | `FunilClient`         | Kanban HTML5 DnD → `POST /opportunities/:id/move` |

Shell Ember: `CrmPage` + `eyebrow` em todas as rotas; stubs Sistema/SaaS/Insights com `PageHeader` + `StatusBadge`.

## Testes e Quality Gate

- Vitest + Testing Library
- Playwright e2e nas rotas críticas
- `npm run gate` antes de merge
