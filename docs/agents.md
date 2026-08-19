# agents.md — Catálogo de agentes (Inova CRM AI)

**Nome canônico:** `docs/agents.md` (inglês).

> No Windows, `agents.md` na raiz colide com `AGENTS.md` (filesystem case-insensitive). Por isso o catálogo vive em `docs/agents.md`. O front door Cursor permanece [`AGENTS.md`](../AGENTS.md) na raiz.

**Harness completo.** Entrada Cursor: [`AGENTS.md`](../AGENTS.md) · Memória viva: [`memory.md`](../memory.md) · Constituição: [`.specify/memory/constitution.md`](../.specify/memory/constitution.md)

**Última revisão:** 2026-08-03

---

## 1. Squads (governança)

| Squad      | ID                                 | Papel                                | Para quando                        |
| ---------- | ---------------------------------- | ------------------------------------ | ---------------------------------- |
| 0 Spec     | `.cursor/agents/spec-squad.md`     | Spec Kit: specify → plan → tasks     | Nova feature / mudança de contrato |
| 1 Build    | `.cursor/agents/build-squad.md`    | Implementa **uma** task + TDD e para | Task READY em `tasks.md`           |
| 2 QA       | `.cursor/agents/qa-squad.md`       | Dono do Quality Gate                 | Antes de DONE / merge              |
| 3 Delivery | `.cursor/agents/delivery-squad.md` | CI images + load VPS                 | Só com `GATE_PASS`                 |

Ordem fixa: **Spec → Build → QA → Delivery**. Proibido Delivery sem QA PASS.

---

## 2. Ciclo de sessão (copiável)

```text
INÍCIO SESSÃO
  memory.md → docs/agents.md → AGENTS.md → constitution → baseline.md
  (+ docs/ports.md se porta/rede; + waba checklist se Spec 027)

SPEC KIT (skills locais .cursor/skills/speckit-*)
  SK-01 constitution   (só se princípio mudar)
  SK-02 specify       → specs/NNN-*/spec.md
  SK-03 clarify       (ambiguidade)
  SK-07 checklist
  SK-04 plan          → plan.md
  SK-05 tasks         → tasks.md (P0–P2)
  SK-06 analyze       (gaps)
  SK-08 implement     → código + testes (papéis C-*)
  SK-09 taskstoissues (opcional)
  SK-10 / SK-11       git feature / commit (só se usuário pedir)

REVISÃO (R-* antes de DONE)
  R-01…R-12 conforme escopo; R-90 gate PASS obrigatório

RUNTIME / OPS (EMB-*)
  EMB-01 ports · EMB-02 load-ci · EMB-03 migrate · EMB-04 Chatwoot PID
  EMB-05 ram-guard · EMB-06 WABA checklist (027)

FIM SESSÃO
  Atualizar memory.md + baseline (se gate PASS) + mapa Spec abaixo
```

---

## 3. Spec Kit — papéis SK-\*

| ID    | Skill / fase               | Artefato                          |
| ----- | -------------------------- | --------------------------------- |
| SK-01 | constitution               | `.specify/memory/constitution.md` |
| SK-02 | specify                    | `specs/NNN-slug/spec.md`          |
| SK-03 | clarify                    | perguntas na spec                 |
| SK-04 | plan                       | `plan.md`                         |
| SK-05 | tasks                      | `tasks.md`                        |
| SK-06 | analyze                    | gaps / consistência               |
| SK-07 | checklist                  | Definition of Done                |
| SK-08 | implement                  | código + testes                   |
| SK-09 | taskstoissues              | issues GitLab/GitHub              |
| SK-10 | create-new-feature scripts | `.specify/scripts/*`              |
| SK-11 | commit (humano)            | conventional commits              |

Workflow: [`.specify/workflows/speckit/workflow.yml`](../.specify/workflows/speckit/workflow.yml)

---

## 4. Construção — papéis C-\*

| ID   | Domínio                 | Escopo                                |
| ---- | ----------------------- | ------------------------------------- |
| C-01 | Auth / RBAC             | JWT, roles, API_TOKEN, tenant context |
| C-02 | Multi-tenant / RLS      | `tenantId`, políticas Prisma/SQL      |
| C-03 | Prisma / schema         | models, migrations, soft-delete       |
| C-04 | API NestJS              | controllers, DTOs, OpenAPI            |
| C-05 | Domain services         | regras CRM (leads, opp, invoices…)    |
| C-06 | Outbox / events         | RabbitMQ catalog + publishers         |
| C-07 | Workers                 | consumers por domínio                 |
| C-08 | Frontend Next           | páginas/clientes Ember, `apiFetch`    |
| C-09 | Chatwoot boundary       | webhooks HMAC; sem canal direto       |
| C-10 | n8n boundary            | só HTTP orquestração                  |
| C-11 | AI FastAPI              | toolbelt `/v1/ai/*`; sem DB direto    |
| C-12 | MinIO / bulk            | prefixo tenant                        |
| C-13 | Reports                 | agregações read-only Spec 028         |
| C-14 | Blueprint / COQL        | Spec 026                              |
| C-15 | Docs corporativos       | `docs/` sync                          |
| C-16 | Infra compose           | ports, health, env.example            |
| C-17 | Security hardening      | rate-limit, secrets, audits           |
| C-18 | UI design tokens        | flame/dark Inova — sem purple AI      |
| C-19 | Tests unit/contract     | Jest / contract suites                |
| C-20 | E2E / smoke             | Playwright + health                   |
| C-21 | LGPD / soft-delete      | purge cron                            |
| C-22 | Observabilidade         | logs tenantId + correlationId         |
| C-23 | Admin SaaS              | SUPER_ADMIN                           |
| C-24 | Custom fields / filters | JSONB + FilterEngine                  |
| C-25 | Ops scripts             | VPS load, audit Chatwoot, migrate     |

Build: **um C-\* (ou um bloco P0) por vez**; marcar DONE só após R-90.

---

## 5. Revisão — papéis R-\*

| ID   | Check                                                                 |
| ---- | --------------------------------------------------------------------- |
| R-01 | Spec critérios de aceite cobertos                                     |
| R-02 | Constitution respeitada                                               |
| R-03 | TDD / testes no contexto tocado                                       |
| R-04 | Isolamento tenant (teste de vazamento)                                |
| R-05 | Segurança (sem secrets; audit)                                        |
| R-06 | CodeRabbit / static review                                            |
| R-07 | CI / format / lint / typecheck                                        |
| R-08 | Prisma validate (se schema)                                           |
| R-09 | Sem `eslint-disable` / `@ts-ignore` sem ADR                           |
| R-10 | Docs sync (API/evento/porta)                                          |
| R-11 | n8n-boundary (se tocou workflows)                                     |
| R-12 | UX / EmptyState falso (FE)                                            |
| R-90 | **`npm run gate` → GATE_PASS** + relatório em `reports/quality-gate/` |
| R-91 | Smoke (health / UI path)                                              |
| R-92 | baseline.md + roadmap atualizados                                     |

---

## 6. Embed / ops — papéis EMB-\*

| ID     | Ação                                        | Quando                                                                                    |
| ------ | ------------------------------------------- | ----------------------------------------------------------------------------------------- |
| EMB-01 | `check-ports` / mapa 9400–9419              | compose up / conflito                                                                     |
| EMB-02 | Build images CI → `load-ci-images-vps.sh`   | pós gate + push                                                                           |
| EMB-03 | `migrate-api-vps.sh`                        | schema mudou                                                                              |
| EMB-04 | Audit/recreate Chatwoot CRM PID             | PID ≥ 80% ou 500/`can't fork`                                                             |
| EMB-05 | `vps-ram-guard.sh` pause/resume             | rebuild pesado                                                                            |
| EMB-06 | WABA checklist + cutover Meta               | Spec 027                                                                                  |
| EMB-07 | Inventário Chatwoot multi-instância         | ops VPS                                                                                   |
| EMB-08 | Pacote decisão Swarm + recovery vxlan → 1/1 | dono Inova-TI · [`swarm-vxlan-chatwoot-fix.md`](./operations/swarm-vxlan-chatwoot-fix.md) |

---

## 7. Mapa Spec × papéis (ativo)

| Spec               | Status  | C-\* principais  | R-\* / EMB         |
| ------------------ | ------- | ---------------- | ------------------ |
| 026 Blueprint/COQL | DONE    | C-14, C-04, C-08 | R-90 done          |
| 028 Relatórios     | DONE    | C-13, C-04, C-08 | R-90 + EMB-02 done |
| 027 Meta/WABA      | BLOCKED | C-09, C-10       | EMB-06             |

---

## 8. Proibições (hard-stop)

- Query cross-tenant / agente com DB direto
- Lógica CRM em n8n Function/Code
- Canal WhatsApp fora do Chatwoot
- Redis como barramento de domínio
- Marcar DONE com gate vermelho
- Scale Swarm Chatwoot sem dono Inova-TI (recovery documentado em `swarm-vxlan-chatwoot-fix.md`)
- Commit de `.env` / secrets

---

## 9. Runtime AI (produto) vs harness Cursor

| Tipo                          | Onde                               | Nota                                                         |
| ----------------------------- | ---------------------------------- | ------------------------------------------------------------ |
| Harness Cursor (este arquivo) | `docs/agents.md` + `.cursor/`      | orquestra humanos/agentes de build                           |
| Agentes IA produto            | FastAPI `ai-crm` + `worker-crm-ai` | ver [`agentes-ia.md`](./agentes-ia.md) — só via toolbelt API |

---

## 10. Referências rápidas

- Quality Gate: [`.cursor/rules/quality-gate.mdc`](../.cursor/rules/quality-gate.mdc)
- Multi-tenant: [`.cursor/rules/multi-tenant.mdc`](../.cursor/rules/multi-tenant.mdc)
- n8n: [`.cursor/rules/n8n-boundary.mdc`](../.cursor/rules/n8n-boundary.mdc)
- Events: [`.cursor/rules/events.mdc`](../.cursor/rules/events.mdc)
- Deploy CI: [`operations/ci-docker-images.md`](./operations/ci-docker-images.md)
- Chatwoot VPS: [`operations/vps-chatwoot-instances.md`](./operations/vps-chatwoot-instances.md)
- Índice harness: [`harness.md`](./harness.md)
