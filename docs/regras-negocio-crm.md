# Regras de Negócio do CRM — Inova CRM AI

**Volume:** 14  
**Versão:** 0.2  
**Status:** implementado no backend (MVP)

---

## Propósito

Catálogo de regras de negócio por módulo. **Toda regra vive no backend** — nunca no n8n.

---

## Leads

| ID         | Regra                                                           | Implementação                                                     |
| ---------- | --------------------------------------------------------------- | ----------------------------------------------------------------- |
| RN-LEAD-01 | Todo lead possui `tenantId` e origem rastreável                 | `LeadsService.create` / `inboundFromChatwoot` (`source=CHATWOOT`) |
| RN-LEAD-02 | Qualificação altera status via API + `lead.qualified`           | `POST /leads/:id/qualify`                                         |
| RN-LEAD-03 | Duplicata por email/telefone no mesmo tenant                    | Upsert `Contact` + open lead reutilizado no inbound               |
| RN-LEAD-04 | Conversão cria oportunidade no funil default + `lead.converted` | `POST /leads/:id/convert`                                         |

## Funil e oportunidades

| ID        | Regra                                        | Implementação                                                                 |
| --------- | -------------------------------------------- | ----------------------------------------------------------------------------- |
| RN-OPP-01 | Estágio deve pertencer ao pipeline do tenant | `OpportunitiesService.assertStageInPipeline` + `POST /opportunities/:id/move` |
| RN-OPP-02 | Ganho/perda emite `opportunity.won` / `lost` | `POST /opportunities/:id/won` \| `lost`                                       |
| RN-OPP-03 | SLA calculado no backend                     | Pendente (worker/fase posterior)                                              |

## Atendimento

| ID         | Regra                                             | Implementação                                          |
| ---------- | ------------------------------------------------- | ------------------------------------------------------ |
| RN-CONV-01 | Conversa vinculada a contato/lead do mesmo tenant | `ConversationsService.syncFromChatwoot` + inbound lead |
| RN-CONV-02 | Sync master Chatwoot via n8n → API                | Workflows `lead-inbound` + `sync-conversation`         |
| RN-CONV-03 | Identidade WhatsApp por `whatsappExternalId`      | Contact upsert (Evolution jid / futuro Meta BSUID)     |

## Financeiro / Permissões / Auditoria

Sem mudança nesta entrega — ver seções anteriores e `seguranca-lgpd.md`.

## Fluxos n8n (orquestração only)

1. **lead-inbound** — webhook Chatwoot → `POST /api/v1/leads/inbound`
2. **sync-conversation** — webhook → `POST /api/v1/conversations/sync`
3. **notify-api** — genérico (sem regra de domínio)

Decisões (dedupe, qualify, convert, stage, won/lost) **somente na API NestJS**.
