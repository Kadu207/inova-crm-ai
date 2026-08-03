# Especificação: Relatórios comerciais e métricas de funil

**ID:** `028-commercial-reports-funnel`  
**Status:** implementado  
**Autor:** Squad Build  
**Data:** 2026-08-02  
**Fase do roadmap:** pós-fase (produto contínuo) · Versão **1.1.1** (027 Meta permanece BLOCKED)

---

## 1. Contexto e problema

A UI `/relatorios` existe com cards estáticos (pipeline, conversão, receita, SLA) e **EmptyState** — sem API de agregação. Specs 019–026 entregaram CRM operacional, filtros, bulk, Blueprint e COQL; falta **insights comerciais tenant-scoped** para gestores.

**Problema:** gestores não veem conversão de funil, volume por estágio, receita prevista vs realizada nem SLA de atendimento no produto — só export/manual.

**Impacto se não resolver:** baixa adoção SaaS, decisões no escuro, pressão por planilhas / Zoho Analytics externo.

---

## 2. Objetivo

Entregar **API de relatórios** (agregações read-only, multi-tenant) + **UI `/relatorios`** com dados reais e export CSV opcional — sem depender de Meta/WABA (Spec 027).

### Fora de escopo

- BI externo / embarcar Metabase/Grafana no CRM
- Relatórios cross-tenant (SaaS super-admin)
- PDF formatado / e-mail agendado de digest (Spec futura)
- Mutação via relatório
- Meta Cloud API / Evolution cutover (027)
- COQL como substituto de relatório (COQL já existe em 026; aqui = agregações dedicadas + UX)

---

## 3. Usuários e papéis

| Ator                  | Papel       | Interesse                                                                         |
| --------------------- | ----------- | --------------------------------------------------------------------------------- |
| Gestor / admin tenant | `admin`     | Ver KPIs do funil e exportar CSV                                                  |
| Vendedor              | `sales`     | Ver métricas do próprio escopo (MVP: tenant inteiro se role permitir; documentar) |
| Integração            | `API_TOKEN` | Consumir endpoints de relatório                                                   |

**Tenant:** toda agregação filtra `tenantId` + soft-delete — [multi-tenant](../../docs/multi-tenant.md).

---

## 4. Requisitos funcionais

### RF-01 — Pipeline por estágio

**Como** gestor, **quero** contar oportunidades (e valor) por estágio do funil, **para** ver gargalos.

**Critérios de aceite:**

- [x] `GET /api/v1/reports/pipeline` → `{ data: [{ stageId, stageName, count, amountSum }], meta: { from, to, pipelineId? } }`
- [x] Filtros query: `from`, `to` (ISO date), `pipelineId` opcional
- [x] Sempre `tenantId`; isolamento coberto por teste
- [x] UI card “Pipeline por estágio” consome a API (não EmptyState quando houver dados)

### RF-02 — Conversão de leads

**Como** gestor, **quero** ver leads criados vs convertidos (oportunidade / ganho) no período, **para** medir eficiência.

**Critérios de aceite:**

- [x] `GET /api/v1/reports/lead-conversion` → taxas e contagens no período
- [x] Definição de “convertido”: `LeadStatus.CONVERTED` **ou** ≥1 Opportunity ligada (`deletedAt=null`) — ver [plan.md](./plan.md) §3
- [x] UI card “Conversão de leads” populado

### RF-03 — Receita prevista vs realizada

**Como** gestor, **quero** somar valor previsto (pipeline aberto) vs realizado (fechado ganho) no período.

**Critérios de aceite:**

- [x] `GET /api/v1/reports/revenue` → `{ forecast, realized, currency? }`
- [x] Baseado em campos existentes de Opportunity (amount / stage won-lost)
- [x] UI card populado

### RF-04 — SLA de atendimento

**Como** gestor, **quero** ver indicadores de SLA (ex.: conversas abertas, violados, median first-response) no período.

**Critérios de aceite:**

- [x] `GET /api/v1/reports/sla` usando dados já existentes (conversas / cron 019) — sem inventar motor novo
- [x] Se dado insuficiente, API retorna zeros + `meta.partial=true` (não 500)
- [x] UI card populado ou estado “dados parciais” explícito

### RF-05 — Export CSV (MVP)

**Como** admin, **quero** exportar o relatório corrente em CSV, **para** usar em planilha.

**Critérios de aceite:**

- [x] `GET /api/v1/reports/{kind}/export.csv` (ou query `format=csv`) com auth + tenant
- [x] Sem PII desnecessária além do necessário ao relatório (sem dump de mensagens)
- [x] Botão na UI por card (admin; sales conforme policy documentada)

---

## 5. Requisitos não funcionais

| ID     | Categoria    | Requisito                                                     |
| ------ | ------------ | ------------------------------------------------------------- |
| RNF-01 | Multi-tenant | Agregações sempre com `tenantId`; teste de vazamento          |
| RNF-02 | Performance  | Agregações com índices existentes; p95 API &lt; 1s no MVP VPS |
| RNF-03 | Segurança    | Roles: admin + API_TOKEN; sales conforme plan                 |
| RNF-04 | Eventos      | Read-only — **sem** novos eventos RabbitMQ obrigatórios       |
| RNF-05 | n8n          | Sem lógica de relatório no n8n                                |

---

## 6. Integrações e camadas afetadas

- [x] **Frontend** (`frontend/`) — `/relatorios`
- [x] **Backend API** (`backend/`) — módulo Reports
- [ ] **Workers**
- [ ] **AI**
- [ ] **n8n**
- [ ] **Chatwoot**
- [ ] **Infra**

**Endpoints:**

| Nome                                | Método | Descrição                  |
| ----------------------------------- | ------ | -------------------------- |
| `/api/v1/reports/pipeline`          | GET    | Contagem/valor por estágio |
| `/api/v1/reports/lead-conversion`   | GET    | Conversão de leads         |
| `/api/v1/reports/revenue`           | GET    | Forecast vs realized       |
| `/api/v1/reports/sla`               | GET    | Indicadores SLA            |
| `/api/v1/reports/{kind}/export.csv` | GET    | Export CSV                 |

---

## 7. Guardrails e aprovações

- [ ] Humano no loop? Não (read-only)
- [ ] Novos eventos RabbitMQ? Não (MVP)
- [x] n8n apenas orquestra? N/A
- [x] Quality Gate PASS antes de DONE

---

## 8. Dados e modelo

Nenhuma migration obrigatória no MVP se campos já existem (Lead, Opportunity, Conversation/SLA).  
Plan deve listar queries Prisma/`groupBy` e índices a validar; só criar migration se faltar índice comprovado por medição.

---

## 9. Cenários de teste (TDD)

1. Pipeline: tenant A com 2 estágios → contagens corretas; tenant B vazio → `data=[]`
2. Isolamento: dados do tenant B nunca aparecem nas agregações de A
3. Período inválido (`from` > `to`) → 400
4. Role sem permissão → 403
5. Export CSV: header + linhas batem com `data` do JSON
6. SLA sem dados → 200 com zeros / `meta.partial`

---

## 10. Dependências

| Dependência                    | Spec / componente | Status                 |
| ------------------------------ | ----------------- | ---------------------- |
| Listas / funil / opportunities | 004, 016, 023     | DONE                   |
| SLA / cron                     | 019               | DONE                   |
| Soft-delete                    | 018               | DONE                   |
| Meta WABA                      | 027               | BLOCKED (independente) |

---

## 11. Referências

- [Plano Mestre](../../Plano_Mestre_Inova_CRM_AI.md)
- [Constituição](../../.specify/memory/constitution.md)
- [Baseline](../../.specify/memory/baseline.md)
- UI atual: `frontend/app/(crm)/relatorios/page.tsx`
- Checklist WABA (paralelo): [`docs/operations/waba-credentials-checklist.md`](../../docs/operations/waba-credentials-checklist.md)

---

## Histórico de revisões

| Versão | Data       | Autor       | Alteração                                         |
| ------ | ---------- | ----------- | ------------------------------------------------- |
| 0.1    | 2026-08-02 | Squad Build | Rascunho inicial — abertura Spec 028              |
| 0.2    | 2026-08-02 | Squad Build | Aprovado; plan.md + tasks.md; definição conversão |
| 1.0    | 2026-08-03 | Squad Build | Implementado (API + UI + CSV); docs; v1.1.1       |
