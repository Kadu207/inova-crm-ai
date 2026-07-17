# Multi-Tenant — Inova CRM AI

**Volume:** 09  
**Versão:** 1.0 (Fase 7 — SaaS packing)  
**Status:** ativo

---

## Propósito

Especifica o modelo SaaS multi-tenant: isolamento de dados, RLS, provisionamento, quotas, admin super-tenant, escala horizontal e testes de vazamento.

---

## Sumário

1. [Modelo tenant-first](#modelo-tenant-first)
2. [Isolamento de dados](#isolamento-de-dados)
3. [Autenticação e contexto](#autenticação-e-contexto)
4. [Onboarding de tenant](#onboarding-de-tenant)
5. [Quotas e planos](#quotas-e-planos)
6. [Admin super-tenant](#admin-super-tenant)
7. [Escala horizontal](#escala-horizontal)
8. [Storage e cache](#storage-e-cache)
9. [Testes de isolamento](#testes-de-isolamento)
10. [ADR](#adr)

---

## Modelo tenant-first

Multi-tenant **desde o dia 1** — não adiar para fase tardia. Toda entidade de domínio carrega `tenantId`.

Cada tenant é um cliente SaaS isolado com:

- Schema lógico compartilhado (PostgreSQL + RLS)
- Buckets/prefixos MinIO dedicados
- Mapeamento Chatwoot `account_id` ↔ `tenantId`
- JWT e `API_TOKEN` com escopo de tenant

## Isolamento de dados

- PostgreSQL RLS por `tenant_id` em todas as tabelas de domínio
- Prisma middleware injeta tenant do JWT — queries sem filtro = bug crítico
- Eventos RabbitMQ rejeitam envelope sem `tenantId`
- Redis: chaves prefixadas `crm:{tenantId}:...`
- Consumers idempotentes com `idempotencyKey`

## Autenticação e contexto

```
JWT → { sub, tenantId, roles } → TenantGuard → request.tenantId
```

`API_TOKEN` de serviço (n8n, workers) vinculado a um tenant ou escopo global auditado.

## Onboarding de tenant

Fluxo de provisionamento (Fase 4 backend + Fase 7 SaaS):

1. **Criar tenant** — `POST /v1/admin/tenants` (super-admin) ou self-service trial
2. **Admin inicial** — convite por e-mail, papel `admin` no tenant
3. **Defaults** — funil padrão, papéis RBAC, timezone `America/Sao_Paulo`
4. **Chatwoot** — criar/vincular `account_id`; webhook → API NestJS
5. **MinIO** — prefixo `{tenantId}/attachments/`, política de bucket
6. **Quotas** — aplicar limites do plano (usuários, leads/mês, storage)
7. **Smoke** — login CRM, health API, evento `tenant.provisioned` no outbox

Estado do tenant: `trial` → `active` → `suspended` → `churned`.

Frontend admin: rota `/admin` (super-tenant) lista tenants e status.

## Quotas e planos

| Plano      | Usuários | Leads/mês | Storage | IA calls/dia |
| ---------- | -------- | --------- | ------- | ------------ |
| trial      | 3        | 500       | 1 GB    | 100          |
| pro        | 25       | 10 000    | 50 GB   | 2 000        |
| enterprise | custom   | custom    | custom  | custom       |

Enforcement:

- API middleware incrementa contadores Redis `crm:{tenantId}:quota:*`
- Resposta `429` com `Retry-After` quando quota excedida
- Worker de billing (Fase 5) consome eventos de uso
- Alertas Grafana quando tenant atinge 80% da quota

## Admin super-tenant

Papel `super_admin` no JWT global (não confundir com `admin` do tenant).

Capacidades auditadas:

- Listar/suspender/reativar tenants (`/v1/admin/tenants`)
- Impersonation com trilha em `audit_logs` (time-boxed, motivo obrigatório)
- Ajuste de quotas e plano
- Visualização agregada de health (sem dados PII cross-tenant)

Proibido:

- Query cross-tenant sem auditoria
- Bypass de RLS em produção sem ADR

## Escala horizontal

| Camada     | Estratégia                                                 |
| ---------- | ---------------------------------------------------------- |
| API NestJS | Réplicas stateless atrás do Tunnel; sessão em Redis        |
| Workers    | Um consumer por domínio; scale por fila RabbitMQ           |
| AI FastAPI | Réplicas stateless; RAG real → pgvector/MinIO por tenant   |
| PostgreSQL | Vertical scale VPS; read replica futura com ADR            |
| Redis      | Single instance Fase 7; cluster quando filas n8n saturarem |
| MinIO      | Single node; distributed mode com ADR em multi-VPS         |

Deploy: `docker compose` com override VPS; portas `9400–9419` reservadas. Ver [runbook-saas.md](./runbook-saas.md).

## Storage e cache

- MinIO: `{tenantId}/attachments/...`
- Redis: `crm:{tenantId}:session:*`, `crm:{tenantId}:quota:*`, `crm:{tenantId}:cache:*`
- Anexos sensíveis: URLs pré-assinadas com TTL curto

## Testes de isolamento

Obrigatório em cada bounded context:

```typescript
it('rejects cross-tenant access', async () => {
  // tenant A token cannot read tenant B lead
});
```

AI services: todo endpoint retorna 400 sem `tenant_id`; RAG nunca mistura documentos entre tenants.

## ADR

[001-tenant-first.md](./adr/001-tenant-first.md)

## Referências

- [runbook-saas.md](./runbook-saas.md)
- [manual-implantacao-producao.md](./manual-implantacao-producao.md)
- Frontend admin: `frontend/app/(crm)/admin/page.tsx`
