# Guia para Cursor — Inova CRM AI

**Volume:** 17  
**Versão:** 0.1 (Fase 0 — skeleton)  
**Status:** em construção

---

## Propósito

Instruções para agentes Cursor: regras, Spec Kit, Quality Gate, skills e fluxo de trabalho.

---

## Sumário

1. [Propósito](#propósito)
2. [Regras ativas](#regras-ativas)
3. [Spec Kit](#spec-kit)
4. [Fluxo por task](#fluxo-por-task)
5. [Comandos úteis](#comandos-úteis)
6. [Squads](#squads)
7. [O que nunca fazer](#o-que-nunca-fazer)

---

## Regras ativas

| Arquivo             | Tema               |
| ------------------- | ------------------ |
| `specify-rules.mdc` | SDD + constitution |
| `quality-gate.mdc`  | Hard-stop gate     |
| `ports.mdc`         | 9400–9419          |
| `events.mdc`        | RabbitMQ domain    |
| `multi-tenant.mdc`  | tenantId + RLS     |
| `n8n-boundary.mdc`  | Orquestração only  |

## Spec Kit

1. Ler `.specify/memory/constitution.md`
2. Criar spec → plan → tasks
3. Implementar com TDD
4. `npm run gate` → PASS → marcar DONE

Scripts: `.specify/scripts/ps/` ou `bash/`

## Fluxo por task

```
READY → implement → test → gate → DONE → próxima READY
```

Falha no gate = corrigir tudo → reexecutar gate completo.

## Comandos úteis

```bash
npm run gate                    # Quality Gate (Fase 1+)
.specify/scripts/ps/check-prerequisites.ps1
```

## Squads

- **Squad 0** — Governança / Spec
- **Squad 1** — Build (para após cada task)
- **Squad 2** — QA / Quality Gate owner
- **Squad 3** — Delivery / deploy

## O que nunca fazer

- Avançar task com lint/testes vermelhos
- `eslint-disable` sem ADR
- Regra de negócio no n8n
- Query sem `tenantId`
- Redis como event bus de domínio
- Canal sem Chatwoot
