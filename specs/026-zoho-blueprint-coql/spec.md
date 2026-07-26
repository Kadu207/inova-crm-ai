# Especificação: Zoho Blueprint light + filtros avançados + COQL

**ID:** `026-zoho-blueprint-coql`  
**Status:** implementado  
**Autor:** Squad Build  
**Data:** 2026-07-26  
**Fase do roadmap:** pós-fase (após 0–7 DONE) · Versão **1.1.0**

---

## 1. Contexto e problema

A onda Zoho 019–025 entregou cron nativo, campos de sistema, related lists, webhooks outbound, filtros básicos, bulk e custom fields. Ainda faltam capacidades pedidas na referência pública Zoho CRM (API V8) e solicitadas pelo produto em 2026-07-26:

1. **Blueprint light** — regras de transição de estágio (sem Deluge).
2. **Filtros avançados** — AND/OR, campos custom, além do Spec 023.
3. **COQL read-only** — linguagem de consulta tipada, sempre tenant-scoped.

**Problema:** vendedores e admins não conseguem impor regras de funil nem consultar o CRM com expressões compostas / query language segura.

**Impacto se não resolver:** funil inconsistente, relatórios manuais, paridade incompleta vs expectativa comercial Zoho-like.

---

## 2. Objetivo

Entregar no Inova CRM AI (Nest + Prisma + UI Ember) um **MVP de Blueprint light**, **filtros avançados** e **COQL read-only**, com isolamento multi-tenant e Quality Gate PASS — sem clonar Zoho.

### Fora de escopo

- Deluge / scripting arbitrário no servidor
- Blueprint UI drag-and-drop completo estilo Zoho
- OAuth apps marketplace / Multi-DC / Composite API
- COQL com mutação (INSERT/UPDATE/DELETE)
- Meta Cloud API (Spec **027**)
- Cadences / marketing automation

---

## 3. Usuários e papéis

| Ator             | Papel       | Interesse                                                |
| ---------------- | ----------- | -------------------------------------------------------- |
| Admin tenant     | `admin`     | Configurar regras de transição Blueprint                 |
| Vendedor         | `sales`     | Mover oportunidade respeitando Blueprint; filtrar listas |
| Integração / n8n | `API_TOKEN` | Consultar COQL read-only via API                         |
| Super-admin SaaS | SaaS        | Sem cross-tenant — COQL sempre filtrado                  |

**Tenant:** toda operação inclui `tenantId` — ver [multi-tenant](../../docs/multi-tenant.md).

---

## 4. Requisitos funcionais

### RF-01 — Blueprint light (pipeline)

**Como** admin, **quero** definir transições permitidas entre estágios (e campos obrigatórios na transição), **para** impedir pulos inválidos no funil.

**Critérios de aceite:**

- [ ] Modelo `BlueprintTransition` (ou equivalente) com `tenantId`, `pipelineId`, `fromStageId`, `toStageId`, `requiredFieldKeys[]`
- [ ] `PATCH` de oportunidade / move no funil valida transição; rejeita 400 com código claro se inválida
- [ ] Se pipeline **não** tem blueprint configurado, comportamento atual (qualquer estágio) permanece
- [ ] Evento de domínio opcional `opportunity.stage_changed` já existente continua; falha de blueprint **não** publica evento
- [ ] Teste de isolamento: tenant A não aplica regras do tenant B

### RF-02 — Filtros avançados

**Como** vendedor, **quero** filtrar listas com grupos AND/OR e campos custom, **para** achar registros sem exportar.

**Critérios de aceite:**

- [ ] Endpoint de filtro estruturado (JSON) para Lead, Contact, Opportunity (mínimo MVP)
- [ ] Operadores: `eq`, `neq`, `contains`, `in`, `gt`, `gte`, `lt`, `lte`, `is_null`
- [ ] Grupos aninhados com `and` / `or` (profundidade máx. documentada, ex. 3)
- [ ] Campos custom (`customFields` JSONB — Spec 025) consultáveis por `apiName`
- [ ] Sempre scoped por `tenantId` + soft-delete
- [ ] Envelope `{ data, meta }` compatível com Spec 023

### RF-03 — COQL read-only

**Como** integrador, **quero** `POST /api/v1/coql/query` com SELECT tipado, **para** extrair dados sem SQL cru.

**Critérios de aceite:**

- [ ] Parser/whitelist de módulos: `Leads`, `Contacts`, `Accounts` (Companies), `Deals` (Opportunities)
- [ ] Apenas `SELECT … FROM … WHERE … ORDER BY … LIMIT`
- [ ] Proibido: JOIN arbitrário cross-tenant, subqueries mutáveis, funções perigosas
- [ ] Injeção impossível: AST → Prisma/`$queryRaw` parametrizado com `tenant_id` obrigatório
- [ ] Limite de linhas (ex. 200) e timeout
- [ ] Roles: admin + API_TOKEN; sales somente módulos autorizados (ou só admin no MVP — documentar)
- [ ] Testes unitários de parser + teste de isolamento tenant

---

## 5. Requisitos não funcionais

| ID     | Categoria    | Requisito                                                 |
| ------ | ------------ | --------------------------------------------------------- |
| RNF-01 | Multi-tenant | `tenantId` + RLS; COQL rejeita query sem escopo de tenant |
| RNF-02 | Segurança    | Sem SQL livre do cliente; rate-limit no endpoint COQL     |
| RNF-03 | Performance  | Filtros avançados e COQL p95 &lt; 500ms em datasets seed  |
| RNF-04 | Eventos      | Registrar novos tipos no catálogo se necessário           |
| RNF-05 | Docs         | OpenAPI + `docs/historico-versoes.md` → 1.1.0 ao fechar   |

---

## 6. Integrações e camadas afetadas

- [x] **Frontend** (`frontend/`) — config Blueprint (admin), builder de filtros
- [x] **Backend API** (`backend/`) — blueprint guard, filter engine, COQL
- [ ] **Workers** — não obrigatório no MVP
- [ ] **ai-services** — fora
- [ ] **n8n** — pode chamar COQL via HTTP; sem lógica de negócio
- [x] **docs/** — APIs + roadmap + histórico

---

## 7. Riscos

| Risco                           | Mitigação                            |
| ------------------------------- | ------------------------------------ |
| COQL virar SQL injection        | Whitelist AST + params               |
| Blueprint quebrar DnD existente | Feature flag / “sem regras = legacy” |
| Escopo explodir (Deluge)        | Fora de escopo explícito             |

---

## 8. Definition of Done

- [ ] Tasks em `tasks.md` com Gate PASS
- [ ] Specs RF-01..03 aceitos
- [ ] Baseline + `historico-versoes.md` → **1.1.0**
- [ ] Meta **027** permanece QUEUED (não iniciar cutover neste Spec)
