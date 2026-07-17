# Guia para Claude Code — Inova CRM AI

**Volume:** 18  
**Versão:** 0.1 (Fase 0 — skeleton)  
**Status:** em construção

---

## Propósito

Instruções para sessões Claude Code: contexto do repo, constitution, design e entrega incremental.

---

## Sumário

1. [Propósito](#propósito)
2. [Contexto obrigatório](#contexto-obrigatório)
3. [Prompt mestre](#prompt-mestre)
4. [Design UI](#design-ui)
5. [Entrega por fase](#entrega-por-fase)
6. [Checklist antes de entregar](#checklist-antes-de-entregar)

---

## Contexto obrigatório

Sempre carregar:

1. `Plano_Mestre_Inova_CRM_AI.md`
2. `.specify/memory/constitution.md`
3. Spec da feature em `specs/NNN-*/spec.md` (quando existir)
4. Regras em `.cursor/rules/`

## Prompt mestre

```
Implemente seguindo rigorosamente a documentação do Inova CRM AI.
Use Clean Architecture, DDD, SOLID, TDD, Event Driven, tenant-first (tenantId + RLS).
Stack: PostgreSQL, Redis (cache/filas n8n), RabbitMQ (eventos), MinIO, Next.js, NestJS, FastAPI.
Chatwoot e n8n dedicados. n8n é SOMENTE orquestrador — regras no backend.
Quality Gate obrigatório antes de marcar task DONE.
Design: marca Inova TI (flame #fb640a, void #141416) — NÃO purple/cream AI defaults.
```

## Design UI

- Tokens: [design/tokens.md](./design/tokens.md)
- Prompts por página: [design/prompts-claude-design.md](./design/prompts-claude-design.md)

## Entrega por fase

Respeitar ordem 0→7. Não implementar IA (Fase 6) antes do CRM MVP (Fase 4).

## Checklist antes de entregar

- [ ] Constitution respeitada
- [ ] Testes no bounded context
- [ ] Sem segredos no diff
- [ ] Docs atualizados se API/evento/porta mudou
- [ ] Quality Gate PASS (quando código existir)
