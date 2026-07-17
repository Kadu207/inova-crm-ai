# Fluxos Comerciais e Atendimento — Inova CRM AI

**Volume:** 15  
**Versão:** 0.1 (Fase 0 — skeleton)  
**Status:** em construção

---

## Propósito

Descreve jornadas ponta a ponta: lead → qualificação → oportunidade → proposta → cobrança → pós-venda.

---

## Sumário

1. [Propósito](#propósito)
2. [Fluxo 1 — Novo lead](#fluxo-1--novo-lead)
3. [Fluxo 2 — Qualificação IA](#fluxo-2--qualificação-ia)
4. [Fluxo 3 — Oportunidade](#fluxo-3--oportunidade)
5. [Fluxo 4 — Proposta](#fluxo-4--proposta)
6. [Fluxo 5 — Follow-up](#fluxo-5--follow-up)
7. [Fluxo 6 — Cobrança](#fluxo-6--cobrança)
8. [Fluxo 7 — Pós-venda](#fluxo-7--pós-venda)
9. [Diagrama geral](#diagrama-geral)

---

## Fluxo 1 — Novo lead

```
Canal → Chatwoot → webhook → n8n → POST /v1/leads → lead.created
```

## Fluxo 2 — Qualificação IA

```
lead.created → worker-crm-ai → API qualificar → lead.qualified
```

Regras de scoring no backend; IA sugere, humano confirma se threshold baixo.

## Fluxo 3 — Oportunidade

```
lead.qualified → POST /v1/opportunities → opportunity.created
```

Funil Kanban atualiza estágio via API → `opportunity.stage.changed`.

## Fluxo 4 — Proposta

```
opportunity → proposta PDF (MinIO) → envio via Chatwoot (aprovado)
```

## Fluxo 5 — Follow-up

```
Cron n8n → GET /v1/tasks/due → notificação vendedor
```

n8n só consulta API; SLA definido no backend.

## Fluxo 6 — Cobrança

```
contrato assinado → invoice.created → humano aprova → invoice.sent
```

## Fluxo 7 — Pós-venda

```
opportunity.won → tarefas onboarding → conversation.assigned suporte
```

## Diagrama geral

Ver [arquitetura-corporativa.md](./arquitetura-corporativa.md) e [integracao-chatwoot.md](./integracao-chatwoot.md).
