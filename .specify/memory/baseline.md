# Baseline — Inova CRM AI

**Última atualização:** 2026-07-20  
**Quality Gate:** ver `npm run gate` (lefthook pre-push)

## Estado por fase

| Fase     | Escopo                          | Status              |
| -------- | ------------------------------- | ------------------- |
| 0–7 + QA | Fundação até SaaS packing       | DONE                |
| Delivery | VPS Tunnel CRM/API/Chatwoot/n8n | DONE (ops contínuo) |

## Operacional

- **UI Ember Studio:** shell + rotas Crm/stubs (009); Dashboard KPIs + timeline (008/011).
- **Leads:** create/detail + Funil DnD (010).
- **Empresas / Contatos:** create modal + detalhe (012).
- **WhatsApp:** Evolution ativo; Meta **BLOCKED** (sem WABA).
- **Backup:** Postgres + MinIO via `mc`.

## Artefatos-chave

- Specs: `011-dashboard-activity`, `012-company-contact-create`
- Design: `docs/design/system.md`
- Gate: `npm run gate`

## Próximo passo

1. Meta Cloud API — BLOCKED até WABA
2. CRUD create produtos/serviços/tarefas (mesmo padrão 010/012)
3. Edit/patch nas entidades com detalhe
