# Especificação: Security hardening P0 (RLS + secrets + JWT/AI auth)

**ID:** `029-security-hardening-p0`  
**Status:** implementado (P0) · P1 aberto  
**Autor:** Squad Spec / Build  
**Data:** 2026-08-18  
**Fase do roadmap:** pós-fase (segurança contínua)

---

## 1. Contexto e problema

Auditoria de segurança (padrões clássicos de app gerado por IA) encontrou gaps P0 em defesa em profundidade: três tabelas de domínio sem RLS, senhas de prod/demo commitadas em scripts ops, fallback `JWT_SECRET=dev-secret`, e FastAPI AI sem autenticação apesar de `AI_API_TOKEN` no compose.

**Problema:** isolamento e autenticação incompletos em camadas que a constituição exige desde o dia 1.

**Impacto se não resolver:** vazamento cross-tenant nas tabelas sem RLS se o filtro app falhar; forge de JWT em misconfig; abuso público do AI; credenciais reais no git.

---

## 2. Objetivo

Fechar o **P0 de hardening**: RLS nas 3 tabelas faltantes, scrub de senhas nos scripts, fail-fast de `JWT_SECRET` em produção, e Bearer auth no `ai-services`.

### Fora de escopo P0 (P1 — implementado nesta pasta; gate pendente)

- [~] Travar `/auth/register` em produção (`ALLOW_PUBLIC_REGISTER`)
- [~] Bloquear assignment de `SUPER_ADMIN` via identity DTO
- [~] `@Roles` em mutações CRM
- [~] Webhook secret por tenant (`TenantConfig` + fallback env)
- [~] LGPD purge explícito por tenant (`withTenant`)
- [~] `where: { id, tenantId }` / `updateMany` pós-`findOne`

---

## 3. Usuários e papéis

| Ator             | Papel                | Interesse                                     |
| ---------------- | -------------------- | --------------------------------------------- |
| Ops / Delivery   | serviço              | Scripts sem secrets no git; AI só com token   |
| API NestJS       | serviço              | JWT forte; RLS cobrindo bulk/webhooks/custom  |
| Tenant admin     | `admin`              | Dados isolados mesmo sob bug de filtro app    |
| Integração / n8n | `API_TOKEN` / Bearer | Continuar chamando AI/API com credenciais env |

**Tenant:** RLS + `app.tenant_id` — [multi-tenant](../../docs/multi-tenant.md) · ADR-001.

---

## 4. Requisitos funcionais

### RF-01 — RLS nas tabelas Spec 022/024/025

**Como** sistema, **quero** `ENABLE` + `FORCE` RLS + policy `tenant_isolation` em `webhook_subscriptions`, `bulk_jobs`, `custom_field_definitions`, **para** isolamento no Postgres.

**Critérios de aceite:**

- [x] Migration SQL aplica ENABLE, FORCE e policy com `app.tenant_id` (mesmo padrão de `blueprint_transitions`)
- [x] Teste unitário de migration SQL cobre as 3 tabelas
- [x] Nenhuma mudança de schema Prisma (só policies)

### RF-02 — Remover senhas hardcoded dos scripts

**Como** ops, **quero** scripts que leem `SEED_ADMIN_PASSWORD` (ou equivalente) do ambiente, **para** não versionar credenciais.

**Critérios de aceite:**

- [x] Zero ocorrências de senhas literais conhecidas (`InovaCrm#…`, `E6qfm…`, `ClienteDemo#…`, `InovaDemo@…`) em `infrastructure/scripts/*` como valor de login/seed
- [x] Scripts de login/smoke falham com mensagem clara se env ausente
- [x] Doc breve no README/script header: variáveis exigidas

### RF-03 — Fail-fast `JWT_SECRET` em produção

**Como** API, **quero** recusar boot se `JWT_SECRET` estiver ausente/fraco em `NODE_ENV=production`, **para** impedir JWT forgeável.

**Critérios de aceite:**

- [x] Helper compartilhado usado por `JwtStrategy` e `AuthModule`
- [x] Produção: min 32 chars; rejeita defaults fracos (`dev-secret`, placeholders de `.env.example`)
- [x] Dev/test: fallback local explícito permitido; testes unitários cobrem fail e ok

### RF-04 — Auth Bearer no AI FastAPI

**Como** serviço AI, **quero** exigir `Authorization: Bearer <AI_API_TOKEN>` em rotas `/v1/*`, **para** bloquear abuso público.

**Critérios de aceite:**

- [x] `/health` permanece público
- [x] Sem token / token errado → 401
- [x] Sem `AI_API_TOKEN` configurado em produção → 503 nas rotas protegidas (fail-closed)
- [x] Testes pytest atualizados; compose já injeta `AI_API_TOKEN`

---

## 5. Requisitos não funcionais

| ID     | Categoria    | Requisito                                         |
| ------ | ------------ | ------------------------------------------------- |
| RNF-01 | Multi-tenant | RLS nas 3 tabelas; FORCE mesmo para owner         |
| RNF-02 | Segurança    | Sem secrets no git; JWT/AI fail-closed em prod    |
| RNF-03 | Ops          | Scripts idempotentes com env obrigatório          |
| RNF-04 | Quality Gate | `npm run gate` PASS antes de marcar tasks P0 DONE |

---

## 6. Integrações e camadas afetadas

- [ ] **Frontend**
- [x] **Backend API** (`backend/`)
- [ ] **Workers**
- [x] **AI** (`ai-services/`)
- [ ] **n8n**
- [ ] **Chatwoot**
- [x] **Infra** (`infrastructure/scripts/`, migration)

**Endpoints / eventos envolvidos:**

| Nome      | Método / tipo | Descrição                   |
| --------- | ------------- | --------------------------- |
| `/health` | GET (AI)      | Público                     |
| `/v1/*`   | POST (AI)     | Exige Bearer `AI_API_TOKEN` |
| —         | migration RLS | Sem mudança de API HTTP     |

---

## 7. Guardrails e aprovações

- [ ] Requer humano no loop? Não (hardening)
- [ ] Novos eventos RabbitMQ? Não
- [x] n8n apenas orquestra? N/A
- [x] Quality Gate PASS antes de marcar implementado?

**Ops pós-merge (humano):** rotacionar senha admin se a literal antiga já esteve em prod/git; garantir `AI_API_TOKEN` e `JWT_SECRET` fortes no `.env` da VPS.

---

## 8. Dados e modelo

Migration SQL only — sem alteração de `schema.prisma`.

```sql
-- webhook_subscriptions, bulk_jobs, custom_field_definitions
ALTER TABLE ... ENABLE ROW LEVEL SECURITY;
ALTER TABLE ... FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON ...
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), ''))
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), ''));
```

---

## 9. Cenários de teste (TDD)

1. Migration SQL contém ENABLE/FORCE/policy para as 3 tabelas
2. `resolveJwtSecret` em production sem secret → throw; com secret ≥32 → ok
3. AI `/v1/qualify-lead` sem Bearer → 401; com token → 200
4. Scripts: grep CI/gate opcional ou checklist — zero literais de senha

---

## 10. Dependências

| Dependência                 | Spec / componente  | Status |
| --------------------------- | ------------------ | ------ |
| RLS original                | migration 20260720 | DONE   |
| Tabelas webhook/bulk/custom | Specs 022/024/025  | DONE   |
| `AI_API_TOKEN` no compose   | infrastructure     | DONE   |

---

## 11. Referências

- [Constituição](../../.specify/memory/constitution.md)
- [multi-tenant](../../docs/multi-tenant.md)
- [ADR-001](../../docs/adr/001-tenant-first.md)
- Auditoria sessão 2026-08-18 (5 falhas clássicas)

---

## Histórico de revisões

| Versão | Data       | Autor       | Alteração                                 |
| ------ | ---------- | ----------- | ----------------------------------------- |
| 0.1    | 2026-08-18 | Squad Spec  | Rascunho inicial                          |
| 1.0    | 2026-08-18 | Squad Spec  | Aprovado P0                               |
| 1.1    | 2026-08-18 | Squad Build | P1 T-40…T-45 implementado (gate pendente) |
