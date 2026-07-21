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
- Rate-limit global (`@nestjs/throttler`, default 100/min) + login/register 10/min
- Storage: Redis quando `REDIS_URL` está definido; senão in-memory (dev)
- Headers HTTP: `helmet` na API; security headers + CSP no Next ([next.config.ts](../frontend/next.config.ts))
- Swagger: desligado em `NODE_ENV=production` salvo `SWAGGER_ENABLED=true`
- Erros: filtro global sem stack em produção
- MFA para admin (Fase posterior)

## Review de código (CodeRabbit)

Ver [security/coderabbit.md](./security/coderabbit.md) — instalar GitHub App e manter `.coderabbit.yaml`.

## Auditoria

Log estruturado: `who`, `what`, `when`, `tenantId`, `correlationId`. Worker `worker-crm-audit` para persistência assíncrona.

## LGPD

| Direito       | Implementação                                                                    |
| ------------- | -------------------------------------------------------------------------------- |
| Acesso        | Export por titular (auditado)                                                    |
| Retificação   | Via CRM com log                                                                  |
| Exclusão      | Soft delete (`deletedAt`) + purge agendado `POST /api/v1/lgpd/purge` (API_TOKEN) |
| Portabilidade | Export JSON/CSV                                                                  |
| Oposição      | Flag de consentimento                                                            |

Retenção padrão: `LGPD_PURGE_RETENTION_DAYS=30` (env). Cron n8n chama o purge diário — ver `n8n/workflows/lgpd-purge.json`.

Retenção documentada por tipo de dado. DPO e política de privacidade — links externos.

## Segredos e credenciais

- `.env` nunca no git
- Secrets na VPS / Cloudflare
- Rotação periódica de `API_TOKEN`

## Resposta a incidentes

<!-- TODO Fase 7 -->

Playbook: conter → investigar → notificar → corrigir → post-mortem.
