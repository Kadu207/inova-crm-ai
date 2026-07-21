# Baseline — Inova CRM AI

**Última atualização:** 2026-07-21  
**Quality Gate:** ver `npm run gate` (lefthook pre-push)

## Estado por fase

| Fase     | Escopo                          | Status              |
| -------- | ------------------------------- | ------------------- |
| 0–7 + QA | Fundação até SaaS packing       | DONE                |
| Delivery | VPS Tunnel CRM/API/Chatwoot/n8n | DONE (ops contínuo) |
| 013      | CodeRabbit + Security P0        | DONE                |

## Operacional

- **UI Ember Studio:** Dashboard KPIs + timeline (011); leads/empresas/contatos create+detail.
- **Security P0:** Helmet, Throttler (+ Redis se `REDIS_URL`), Swagger gate, error filter, Next CSP/headers, gitleaks CI, CodeRabbit YAML.
- **WhatsApp:** Evolution ativo; Meta **BLOCKED** (sem WABA).
- **Backup:** Postgres + MinIO via `mc`.

## Artefatos-chave

- Specs: `013-coderabbit-security`
- CodeRabbit: `.coderabbit.yaml` + `docs/security/coderabbit.md`
- Gate: `npm run gate`

## Próximo passo

1. Instalar GitHub App CodeRabbit no repo (ação humana)
2. Meta Cloud API — BLOCKED até WABA
3. CRUD create produtos/serviços/tarefas (padrão 010/012)
4. Edit/patch nas entidades com detalhe
