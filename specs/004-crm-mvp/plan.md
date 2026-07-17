# Plano de implementação: CRM MVP — Backend Phase 4

**Spec:** `004-crm-mvp` → [spec.md](./spec.md)  
**Status:** em execução  
**Autor:** Inova CRM AI  
**Data:** 2026-07-14

---

## 1. Resumo executivo

Scaffold NestJS modular com Prisma tenant-first, módulos CRM, financeiro (Phase 5 prep), outbox RabbitMQ e workers. Validação via Jest unit tests e Quality Gate.

**Entrega mínima (MVP):**  
API funcional com auth, leads CRUD, health, Swagger, 5 workers registrados.

---

## 2. Alinhamento com a constituição

| Princípio         | Como este plano respeita                     |
| ----------------- | -------------------------------------------- |
| Tenant-first      | `tenantId` + guards em todos os módulos      |
| API/toolbelt only | ai-toolbelt expõe endpoints HTTP             |
| n8n orquestrador  | Webhooks inbound apenas                      |
| TDD               | Tests leads, finance, auth, tenancy, workers |
| Quality Gate      | Gate PASS antes de DONE                      |

---

## 3. Fases de implementação

### Fase A — Fundação backend (concluída scaffold)

1. package.json, tsconfig, nest-cli, jest
2. Prisma schema completo
3. PrismaModule, Health, Auth, Tenancy

### Fase B — Módulos CRM

1. companies, contacts, leads, pipeline, opportunities
2. tasks, products, services, conversations
3. config, audit, identity

### Fase C — Financeiro + integrações

1. proposals, contracts, finance, billing
2. webhooks, events/outbox, ai-toolbelt, saas stubs
3. Workers package + consumers

### Fase D — Validação

1. `npm run test:unit` backend + workers
2. `npm run typecheck`
3. `npm run gate` — Quality Gate PASS

---

## 4. Critérios de gate

- [ ] `prisma validate` PASS
- [ ] `tsc --noEmit` PASS
- [ ] Jest ≥ 3 testes significativos PASS
- [ ] Swagger `/docs` acessível
- [ ] Dockerfile backend + workers build OK

---

## Histórico

| Versão | Data       | Alteração     |
| ------ | ---------- | ------------- |
| 0.1    | 2026-07-14 | Plano inicial |
