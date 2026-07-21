# Baseline — Inova CRM AI

**Última atualização:** 2026-07-20  
**Quality Gate:** ver `npm run gate` (lefthook pre-push)

## Estado por fase

| Fase     | Escopo                          | Status              |
| -------- | ------------------------------- | ------------------- |
| 0–7 + QA | Fundação até SaaS packing       | DONE                |
| Delivery | VPS Tunnel CRM/API/Chatwoot/n8n | DONE (ops contínuo) |

## Operacional

- **UI Ember Studio:** shell + todas as rotas Crm/stubs (009); Dashboard KPIs (008).
- **Leads:** create modal + detalhe `/leads/[id]` + qualify/convert; Funil HTML5 DnD (010).
- **WhatsApp:** Evolution ativo; Meta **BLOCKED** (sem WABA).
- **Backup:** Postgres + MinIO via `mc` (`setup-minio-mc.sh` + alias no `backup.sh`).
- **SLA / RLS:** check-all multi-tenant; `crm_app` RLS.

## Artefatos-chave

- Specs: `009-ember-studio-remaining`, `010-lead-detail-funil-dnd`
- Design: `docs/design/system.md`
- Gate: `npm run gate`

## Próximo passo

1. Meta Cloud API — BLOCKED até WABA
2. Timeline de atividade no Dashboard
3. CRUD create nas demais entidades (empresas, contatos, …)
