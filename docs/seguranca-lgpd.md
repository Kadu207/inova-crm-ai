# Segurança e LGPD — Inova CRM AI

**Volume:** 10  
**Versão:** 0.1 (Fase 0 — skeleton)  
**Status:** em construção

---

## Propósito

Políticas de segurança, RBAC, auditoria, LGPD, retenção de dados e resposta a incidentes.

---

## Sumário

1. [Propósito](#propósito)
2. [Princípios](#princípios)
3. [RBAC](#rbac)
4. [Autenticação](#autenticação)
5. [Auditoria](#auditoria)
6. [LGPD](#lgpd)
7. [Segredos e credenciais](#segredos-e-credenciais)
8. [Resposta a incidentes](#resposta-a-incidentes)

---

## Princípios

- Menor privilégio
- Segurança por padrão (secure defaults)
- Humano no loop para ações sensíveis
- Dados mínimos necessários

## RBAC

| Papel   | Escopo típico                        |
| ------- | ------------------------------------ |
| admin   | Config tenant, usuários              |
| manager | Pipeline, relatórios                 |
| sales   | Leads, oportunidades próprias/equipe |
| support | Conversas, contatos                  |
| viewer  | Somente leitura                      |

## Autenticação

- JWT curta duração + refresh
- `API_TOKEN` para n8n/workers (rotacionável)
- Webhooks externos: HMAC `X-Inova-Signature` — ver [webhook-signing.md](./webhook-signing.md)
- Rate-limit em login (Redis)
- MFA para admin (Fase posterior)

## Auditoria

Log estruturado: `who`, `what`, `when`, `tenantId`, `correlationId`. Worker `worker-crm-audit` para persistência assíncrona.

## LGPD

| Direito       | Implementação                 |
| ------------- | ----------------------------- |
| Acesso        | Export por titular (auditado) |
| Retificação   | Via CRM com log               |
| Exclusão      | Soft delete + purge agendado  |
| Portabilidade | Export JSON/CSV               |
| Oposição      | Flag de consentimento         |

Retenção documentada por tipo de dado. DPO e política de privacidade — links externos.

## Segredos e credenciais

- `.env` nunca no git
- Secrets na VPS / Cloudflare
- Rotação periódica de `API_TOKEN`

## Resposta a incidentes

<!-- TODO Fase 7 -->

Playbook: conter → investigar → notificar → corrigir → post-mortem.
