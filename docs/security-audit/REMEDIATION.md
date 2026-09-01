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

```bash
# SSH :65022 → /opt/inova-crm-ai
# 1) Rotacionar SEED_ADMIN_PASSWORD / senhas admin se ainda forem defaults históricos
# 2) bash infrastructure/scripts/seed-tenant-webhook-secrets.sh
# 3) Após load images: smoke VIEWER 403 nos GETs privilegiados; API_TOKEN ok em /lgpd/purge
```
