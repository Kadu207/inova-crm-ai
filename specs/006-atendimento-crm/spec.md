# Especificação: Atendimento CRM + SLA Funil + Hardening

**ID:** `006-atendimento-crm`  
**Status:** aprovado  
**Autor:** Inova CRM AI  
**Data:** 2026-07-20  
**Fase do roadmap:** 4 (pós-MVP operacional)

---

## 1. Contexto e problema

WhatsApp (Evolution) → Chatwoot → n8n → CRM já cria leads. Falta superfície de **Atendimento** no CRM, **SLA de oportunidade** (RN-OPP-03) e fechamento operacional (baseline/gate/smoke).

**Problema:** conversas não são úteis no CRM; funil sem SLA; baseline desatualizada.

**Impacto:** agente não vê vínculo conversa↔lead; deals envelhecem sem alerta; ops sem DoD claro.

---

## 2. Objetivo

1. Listar conversas enriquecidas no CRM com link ao Chatwoot.
2. SLA 24h por estágio de oportunidade + evento `opportunity.sla.breached`.
3. Hardening: gate tasks, baseline, smoke/backup docs.

### Fora de escopo

- Chat embutido no CRM
- Cutover Meta Cloud API
- Kanban drag-and-drop

---

## 3. Usuários e papéis

| Ator            | Papel               | Interesse                                |
| --------------- | ------------------- | ---------------------------------------- |
| Agente / vendas | `sales` / `support` | Ver conversas, abrir Chatwoot, funil+SLA |
| n8n             | API_TOKEN           | sync + cron SLA check                    |
| Ops             | admin               | smoke/backup                             |

---

## 4. Requisitos funcionais

### RF-01 — Lista de atendimento

- [ ] GET `/conversations` retorna contact + lead resumidos
- [ ] UI `/atendimento` com auth, status, CTA Chatwoot

### RF-02 — SLA oportunidade

- [ ] `stageEnteredAt` em Opportunity
- [ ] POST `/opportunities/sla/check` publica breach idempotente
- [ ] Badge no Funil se >24h no estágio

### RF-03 — Hardening

- [ ] Tasks T-40–T-42 + T-50
- [ ] Baseline atualizada
- [ ] Checklist smoke + backup no runbook

---

## 5. RNFs

| ID     | Requisito          |
| ------ | ------------------ |
| RNF-01 | tenantId + RLS     |
| RNF-02 | n8n só orquestra   |
| RNF-03 | canais só Chatwoot |

---

## 6. Camadas

- [x] Frontend
- [x] Backend
- [x] Workers (pipeline SLA opcional via API)
- [x] n8n (cron opcional documentado)
- [x] Docs
