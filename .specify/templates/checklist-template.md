# Checklist de qualidade: [TÍTULO DA FEATURE]

**Spec:** `[NNN-nome-curto]`  
**Revisor:** [nome]  
**Data da revisão:** [AAAA-MM-DD]  
**Resultado:** aprovado | aprovado com ressalvas | reprovado

---

## 1. Constituição e guardrails

| #    | Item                                                   | OK  | N/A | Notas |
| ---- | ------------------------------------------------------ | :-: | :-: | ----- |
| C-01 | Entrega incremental — MVP identificável                | [ ] | [ ] |       |
| C-02 | Agentes/automação usam só API/toolbelt                 | [ ] | [ ] |       |
| C-03 | Ferramentas limitadas ao domínio/squad correto         | [ ] | [ ] |       |
| C-04 | Ações sensíveis têm humano no loop                     | [ ] | [ ] |       |
| C-05 | `tenantId` em entidades de domínio; sem cross-tenant   | [ ] | [ ] |       |
| C-06 | n8n só orquestra (sem regra de negócio em Function/IF) | [ ] | [ ] |       |
| C-07 | Canais somente via Chatwoot                            | [ ] | [ ] |       |
| C-08 | Ações auditáveis (quem/o quê/quando/tenantId)          | [ ] | [ ] |       |

---

## 2. Quality Gate (hard-stop)

| #    | Item                                      | OK  | N/A | Notas |
| ---- | ----------------------------------------- | :-: | :-: | ----- |
| Q-01 | `npm run gate` executado — PASS           | [ ] | [ ] |       |
| Q-02 | Lint zero errors (`--max-warnings 0`)     | [ ] | [ ] |       |
| Q-03 | Typecheck sem erros                       | [ ] | [ ] |       |
| Q-04 | Testes unit/integration verdes            | [ ] | [ ] |       |
| Q-05 | Cobertura ≥ 70% no bounded context tocado | [ ] | [ ] |       |
| Q-06 | Sem `eslint-disable` sem ADR              | [ ] | [ ] |       |
| Q-07 | Portas 9400–9419 sem conflito             | [ ] | [ ] |       |

---

## 3. Especificação

| #    | Item                           | OK  | N/A | Notas |
| ---- | ------------------------------ | :-: | :-: | ----- |
| S-01 | Objetivo claro e mensurável    | [ ] | [ ] |       |
| S-02 | Fora de escopo documentado     | [ ] | [ ] |       |
| S-03 | Critérios de aceite testáveis  | [ ] | [ ] |       |
| S-04 | Papéis e permissões definidos  | [ ] | [ ] |       |
| S-05 | Eventos no catálogo (se novos) | [ ] | [ ] |       |

---

## 4. Implementação — Backend

| #    | Item                                      | OK  | N/A | Notas |
| ---- | ----------------------------------------- | :-: | :-: | ----- |
| A-01 | DTOs validados (class-validator/Zod)      | [ ] | [ ] |       |
| A-02 | Auth: JWT usuário ou API_TOKEN serviço    | [ ] | [ ] |       |
| A-03 | RBAC + tenant scope aplicados             | [ ] | [ ] |       |
| A-04 | Outbox → RabbitMQ para eventos de domínio | [ ] | [ ] |       |
| A-05 | OpenAPI atualizado                        | [ ] | [ ] |       |
| A-06 | Prisma: tenantId + índices                | [ ] | [ ] |       |

---

## 5. Implementação — Frontend

| #    | Item                                  | OK  | N/A | Notas |
| ---- | ------------------------------------- | :-: | :-: | ----- |
| U-01 | Design tokens Inova (flame/void/bone) | [ ] | [ ] |       |
| U-02 | Tratamento de 401 (sessão expirada)   | [ ] | [ ] |       |
| U-03 | Feedback visual (toast/erro)          | [ ] | [ ] |       |
| U-04 | Build sem erros                       | [ ] | [ ] |       |
| U-05 | Responsivo mobile                     | [ ] | [ ] |       |

---

## 6. Implementação — n8n

| #    | Item                                   | OK  | N/A | Notas |
| ---- | -------------------------------------- | :-: | :-: | ----- |
| N-01 | Workflow importável sem erros          | [ ] | [ ] |       |
| N-02 | Nó Config centraliza URLs e tokens     | [ ] | [ ] |       |
| N-03 | Chama API NestJS (não DB direto)       | [ ] | [ ] |       |
| N-04 | Sem lógica de negócio em Code/Function | [ ] | [ ] |       |

---

## 7. Mensageria e storage

| #    | Item                                        | OK  | N/A | Notas |
| ---- | ------------------------------------------- | :-: | :-: | ----- |
| M-01 | Eventos de domínio via RabbitMQ (não Redis) | [ ] | [ ] |       |
| M-02 | Redis só cache/sessão/rate-limit/fila n8n   | [ ] | [ ] |       |
| M-03 | Anexos em MinIO dedicado CRM                | [ ] | [ ] |       |

---

## 8. Segurança e operação

| #    | Item                                              | OK  | N/A | Notas |
| ---- | ------------------------------------------------- | :-: | :-: | ----- |
| O-01 | Nenhum `.env` ou segredo no repositório           | [ ] | [ ] |       |
| O-02 | Postgres/Redis/RabbitMQ não expostos publicamente | [ ] | [ ] |       |
| O-03 | TLS via Cloudflare Tunnel Full strict             | [ ] | [ ] |       |
| O-04 | LGPD: dados mínimos, retenção documentada         | [ ] | [ ] |       |

---

## 9. Documentação e baseline

| #    | Item                                       | OK  | N/A | Notas |
| ---- | ------------------------------------------ | :-: | :-: | ----- |
| B-01 | `baseline.md` atualizado (se fase fechada) | [ ] | [ ] |       |
| B-02 | Docs em `docs/` sincronizados              | [ ] | [ ] |       |
| B-03 | Spec marcada como implementada             | [ ] | [ ] |       |

---

## Ressalvas e ações corretivas

| Item | Severidade       | Ação | Prazo |
| ---- | ---------------- | ---- | ----- |
|      | alta/média/baixa |      |       |

---

## Assinatura

**Revisor:** _______________  
**Data:** _______________
