# Plano: 006-atendimento-crm

## Fases

| Fase | Entrega                                              | Gate                |
| ---- | ---------------------------------------------------- | ------------------- |
| A    | Conversations enrich + AtendimentoClient + smoke doc | unit + gate parcial |
| B    | stageEnteredAt + SLA check + testes + badge Funil    | unit + gate         |
| C    | baseline, tasks 004, runbook smoke/backup            | gate completo PASS  |

## Critérios

- Resposta humana só via Chatwoot
- SLA 24h constante MVP (`OPPORTUNITY_STAGE_SLA_HOURS=24`)
- Evento `opportunity.sla.breached` no catálogo
