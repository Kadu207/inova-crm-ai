# Remediação auditoria 2026-09-01

Referência: [`relatorio-auditoria-seguranca.pdf`](./relatorio-auditoria-seguranca.pdf)

## Status

| ID   | Severidade | Status   | Mudança                                                                       |
| ---- | ---------- | -------- | ----------------------------------------------------------------------------- |
| F-10 | crítica    | **CODE** | `JwtAuthGuard` rejeita JWT em `@PlatformApi`                                  |
| F-01 | crítica    | **CODE** | `@Roles` nos GETs + `secretMasked`                                            |
| F-02 | alta       | **CODE** | `@Roles(ADMIN,MANAGER)` em GET invoices                                       |
| F-03 | alta       | **CODE** | `@Roles` em GET bulk jobs/download                                            |
| F-04 | média      | **CODE** | `@Roles` em GET `/users/:id`                                                  |
| F-05 | média      | **CODE** | Prisma fail-closed sem ALS (exceto `Tenant`); outbox/SLA usam `runWithTenant` |
| F-06 | alta       | **OPS**  | Rotacionar senhas/tokens históricos na VPS (não reescrever git)               |
| F-07 | média      | **CODE** | Seed exige `SEED_ADMIN_PASSWORD` em production; não loga senha                |
| F-08 | média      | **CODE** | Evolution compose `${VAR:?required}` sem `change_me_*`                        |
| F-09 | baixa      | **CODE** | Reports API inclui MANAGER + SUPER_ADMIN                                      |

## Ops VPS (F-06 + smoke)

> **2026-09-22:** deploy **fechado** — imagens prod em `SHA.txt` = `42048a5842e9` (run `35556316644`; inclui remediação `3d2145c`). n8n com `API_BASE_URL=http://api:3000` e `API_TOKEN` alinhado à API.  
> Evolution `crm-whatsapp` → `state: open` (reconnect QR; sincronizando).  
> F-06 (rotação humana de senhas históricas) permanece checklist — não automatizado.  
> Smoke VIEWER (403 em invoices/bulk/webhooks) — opcional; criar VIEWER só via API (`POST /users`, não pela UI CrmPage).

```bash
# SSH :65025 → /opt/inova-crm-ai
# 1) Após CI: baixar artifacts e load
#    docs/operations/ci-docker-images.md Passos 2–5
# 2) Rotacionar secrets webhook por tenant (se novos tenants ACTIVE)
bash infrastructure/scripts/seed-tenant-webhook-secrets.sh

# 3) Smoke RBAC (substitua TOKEN_VIEWER / API_TOKEN / TENANT)
API=https://api-crm.inovatitech.com.br/api/v1
# VIEWER deve 403:
curl -sS -o /dev/null -w '%{http_code}\n' -H "Authorization: Bearer $TOKEN_VIEWER" -H "x-tenant-id: $TENANT" "$API/invoices"
curl -sS -o /dev/null -w '%{http_code}\n' -H "Authorization: Bearer $TOKEN_VIEWER" -H "x-tenant-id: $TENANT" "$API/bulk/jobs"
curl -sS -o /dev/null -w '%{http_code}\n' -H "Authorization: Bearer $TOKEN_VIEWER" -H "x-tenant-id: $TENANT" "$API/webhook-subscriptions"
curl -sS -o /dev/null -w '%{http_code}\n' -H "Authorization: Bearer $TOKEN_VIEWER" -H "x-tenant-id: $TENANT" "$API/lgpd/purge" -X POST
# API_TOKEN platform OK (não 401):
curl -sS -o /dev/null -w '%{http_code}\n' -H "Authorization: Bearer $API_TOKEN" -X POST "$API/lgpd/purge"

# 4) Se senhas históricas pré-029 ainda autenticam → trocar admin imediatamente
```
