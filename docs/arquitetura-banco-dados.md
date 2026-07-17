# Arquitetura de Banco de Dados — Inova CRM AI

**Volume:** 04  
**Versão:** 0.1 (Fase 0 — skeleton)  
**Status:** em construção

---

## Propósito

Modelo de dados multi-tenant, convenções Prisma, RLS, índices, migrações e estratégia de backup.

---

## Sumário

1. [Propósito](#propósito)
2. [PostgreSQL multi-tenant](#postgresql-multi-tenant)
3. [Convenções Prisma](#convenções-prisma)
4. [RLS (Row Level Security)](#rls-row-level-security)
5. [Entidades principais](#entidades-principais)
6. [Índices e performance](#índices-e-performance)
7. [Migrações](#migrações)
8. [Backup e restore](#backup-e-restore)

---

## PostgreSQL multi-tenant

- Uma instância PostgreSQL dedicada ao stack CRM (compose)
- `tenantId` em toda tabela de domínio
- ADR: [001-tenant-first.md](./adr/001-tenant-first.md)

## Convenções Prisma

- IDs: `@default(cuid())` para strings; `@default(autoincrement())` para legado se necessário
- `createdAt` / `updatedAt` obrigatórios
- `@@index([tenantId])` em tabelas de domínio
- Relations com `@relation` nos dois lados

## RLS (Row Level Security)

```sql
-- Exemplo (expandir por tabela na Fase 4)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON leads
  USING (tenant_id = current_setting('app.tenant_id')::text);
```

## Entidades principais

| Entidade                    | Contexto    |
| --------------------------- | ----------- |
| Tenant, User, Role          | Platform    |
| Lead, Contact, Company      | CRM core    |
| Opportunity, Stage          | Pipeline    |
| Conversation (ref Chatwoot) | Atendimento |
| Proposal, Contract, Invoice | Billing     |

## Índices e performance

- Compostos: `(tenant_id, status)`, `(tenant_id, created_at DESC)`
- Evitar full scan cross-tenant

## Migrações

- `prisma migrate dev` em dev; `migrate deploy` em produção
- Validar no Quality Gate

## Backup e restore

- pg_dump diário; retenção 30 dias; drill documentado em [manual de implantação](./manual-implantacao-producao.md)
