# Plano de implementação: Relatórios comerciais e métricas de funil

**Spec:** [`028-commercial-reports-funnel`](./spec.md)  
**Status:** em execução  
**Autor:** Squad Build  
**Data:** 2026-08-02

---

## 1. Resumo executivo

Criar módulo Nest `reports` com agregações read-only (Prisma `groupBy` / count / sum), testes de isolamento tenant, e popular `frontend/app/(crm)/relatorios/page.tsx`. Sem migration obrigatória no MVP; índices novos só se medição exigir.

**Entrega mínima (MVP):** RF-01 pipeline + RF-02 conversão + UI dos dois cards + 1 teste de isolamento — depois revenue, SLA e CSV.

---

## 2. Alinhamento com a constituição

| Princípio         | Como este plano respeita                                     |
| ----------------- | ------------------------------------------------------------ |
| Incremental       | Fatias A (pipeline) → B (conversão+receita) → C (SLA+CSV+UI) |
| API/toolbelt only | Só Nest; FE consome HTTP; sem SQL no frontend                |
| Tenant-first      | Todo `where` com `tenantId` + `deletedAt: null`              |
| n8n orquestrador  | Fora de escopo                                               |
| TDD               | Service + isolamento antes da UI                             |
| Quality Gate      | PASS antes de marcar tasks DONE / baseline                   |

---

## 3. Arquitetura da solução

```
UI /relatorios ──► GET /api/v1/reports/* ──► ReportsService
                                              ├─ Opportunity (stage, value, status, slaBreachedAt)
                                              ├─ Lead (+ opportunities[])
                                              └─ Conversation (counts; meta.partial se faltar first-response)
```

### Componentes tocados

| Caminho                          | Mudança prevista                                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `backend/src/reports/`           | Módulo Nest: controller, service, DTOs query                                                            |
| `backend/src/app.module.ts`      | Registrar ReportsModule                                                                                 |
| `backend/**/*.spec.ts`           | Unit/integration isolamento + período inválido                                                          |
| `frontend/app/(crm)/relatorios/` | Cards com dados reais + export                                                                          |
| `frontend/lib/`                  | Client helpers `unwrap` / fetch reports                                                                 |
| `docs/`                          | OpenAPI / nota de API de relatórios                                                                     |
| `prisma/`                        | Sem migration MVP; validar índices `(tenantId, stageId)`, `(tenantId, status)`, `(tenantId, createdAt)` |

### Definições de negócio (fixadas)

| Conceito              | Definição MVP                                                                                                                                                                                         |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Convertido (lead)** | Lead com `deletedAt=null`, `createdAt` ∈ `[from,to]`, e (`status=CONVERTED` **ou** ≥1 `Opportunity` ligada com `deletedAt=null`)                                                                      |
| **Taxa de conversão** | `convertedCount / createdCount` (0 se denominador 0)                                                                                                                                                  |
| **Forecast**          | Soma de `Opportunity.value` com `status=OPEN`, `deletedAt=null`, tenant; filtro período em `createdAt` **ou** `expectedCloseDate` ∈ range (usar `expectedCloseDate` se preenchido, senão `createdAt`) |
| **Realized**          | Soma de `value` com `status=WON` e `updatedAt` ∈ `[from,to]` (proxy de data de ganho sem campo `wonAt`)                                                                                               |
| **SLA**               | Contagens: opportunities com `slaBreachedAt` não nulo no período; conversas `OPEN` / total no período. Sem first-response no modelo Conversation → `meta.partial=true`                                |
| **Roles**             | `admin` + `API_TOKEN`: todos os reports. `sales`: leitura tenant-wide no MVP (documentar; sem filtro assignee nesta Spec)                                                                             |

---

## 4. Fases de implementação

### Fase A — Foundation + Pipeline (P0)

**Objetivo:** `GET /api/v1/reports/pipeline` green + isolamento.

1. Scaffold `ReportsModule` / controller / query DTO (`from`, `to`, `pipelineId?`)
2. Validação período (`from` ≤ `to`, default últimos 30 dias)
3. Agregação por `stageId` (count + sum `value`) join stage name/order
4. Testes: contagens tenant A; tenant B vazio; 400 se range inválido

**Critério de done:** testes do bounded context verdes; gate no fechamento da Spec (não a cada microtask se CI local ok).

### Fase B — Conversão + Receita (P0)

1. `GET .../lead-conversion` com definição acima
2. `GET .../revenue` forecast vs realized
3. Testes unitários das fórmulas + isolamento

### Fase C — SLA + CSV + UI (P0)

1. `GET .../sla` com `meta.partial`
2. Export CSV por `kind` (`pipeline` \| `lead-conversion` \| `revenue` \| `sla`)
3. UI `/relatorios`: fetch, loading, empty real, botão CSV (admin)
4. Docs OpenAPI + nota em `docs/` se API pública

### Fase D — Fechamento (P0)

1. `npm run gate` PASS
2. Spec → implementado; baseline + roadmap; historico se versão bump
3. Smoke manual nos 4 cards com tenant demo

---

## 5. Decisões técnicas

| Decisão    | Opções                          | Escolha                      | Motivo                                                |
| ---------- | ------------------------------- | ---------------------------- | ----------------------------------------------------- |
| Agregação  | SQL raw vs Prisma               | Prisma `groupBy` / aggregate | Menos risco injection; suficiente no MVP              |
| Convertido | status QUALIFIED vs opportunity | Opportunity ligada           | Dado já modelado (`Lead.opportunities`)               |
| Won date   | novo campo vs `updatedAt`       | `updatedAt`                  | Evita migration; documentar limitação                 |
| CSV        | MinIO vs stream HTTP            | Stream `text/csv`            | Sem PII em bulk storage; Spec 024 já cobre MinIO bulk |
| Eventos    | RabbitMQ                        | Nenhum                       | Read-only                                             |

---

## 6. Riscos e mitigações

| Risco                              | Prob. | Impacto | Mitigação                                      |
| ---------------------------------- | ----- | ------- | ---------------------------------------------- |
| Vazamento cross-tenant             | baixa | crítico | Teste isolamento obrigatório                   |
| Performance em tenant grande       | média | médio   | Índices existentes; limitar range max 366 dias |
| SLA “mentiroso” sem first-response | alta  | baixo   | `meta.partial=true` + copy na UI               |
| `updatedAt` ≠ data real de WON     | média | médio   | Documentar; Spec futura `wonAt`                |

---

## 7. Rollback

- Remover/feature-flag módulo Reports no `AppModule` e reverter UI para EmptyState
- Sem migration → rollback = redeploy imagem anterior
- CSV/endpoints novos não quebram contratos antigos

---

## 8. Validação pós-implementação

- [ ] Testes isolamento + fórmulas
- [ ] `npm run gate` PASS
- [ ] Smoke UI `/relatorios` (4 cards)
- [ ] OpenAPI / docs sync
- [ ] Atualizar [baseline.md](../../.specify/memory/baseline.md) após PASS
- [ ] Sem secrets; constitution OK

---

## 9. Próximos passos (fora deste plano)

- Spec futura: `wonAt`, first-response SLA, filtro assignee para `sales`, PDF/digest e-mail
- Spec 027 Meta quando WABA pronto ([checklist](../../docs/operations/waba-credentials-checklist.md))

---

## Histórico

| Versão | Data       | Alteração     |
| ------ | ---------- | ------------- |
| 0.1    | 2026-08-02 | Plano inicial |
