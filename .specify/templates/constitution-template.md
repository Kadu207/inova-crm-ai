# Constitution — Inova CRM AI (template)

Use este template ao revisar ou estender a constituição do projeto.
A versão ativa está em `.specify/memory/constitution.md`.

---

## Princípios

1. **Spec antes do código** — toda feature relevante passa por SDD (Spec Kit).
2. **Tenant-first desde o dia 1** — `tenantId` + RLS; zero queries cross-tenant.
3. **Segurança e LGPD** — menor privilégio, auditoria, humano no loop para ações sensíveis.
4. **API/toolbelt only** — agentes e n8n não acessam DB/MinIO diretamente.
5. **n8n orquestrador** — sem regra de negócio em Function/IF; decisões no backend.
6. **Mensageria com papéis fixos** — RabbitMQ = eventos; Redis = cache/sessão/filas n8n.
7. **Canais via Chatwoot** — único ponto de integração omnichannel.
8. **TDD por bounded context** — testes verdes antes de avançar task.
9. **Quality Gate hard-stop** — lint + types + testes PASS obrigatórios para DONE.
10. **Incremental** — cada fase prova valor sozinha.

## Fronteiras

| Camada   | Responsabilidade           | Proibido                   |
| -------- | -------------------------- | -------------------------- |
| Frontend | UX CRM, dashboards, funil  | Regra de negócio duplicada |
| Backend  | Domínio, API, outbox, RBAC | Bypass de tenant           |
| Workers  | Consumers RabbitMQ         | HTTP síncrono pesado       |
| n8n      | Webhook → API → notify     | IF/Function com regra CRM  |
| Chatwoot | Canais e conversas         | Lógica de pipeline         |
| MinIO    | Storage dedicado CRM       | Bucket compartilhado       |

## Qualidade

- Critérios de aceite testáveis (EARS) em toda spec.
- Tasks ordenadas por dependência; gate entre tasks.
- ADRs para decisões estruturais em `docs/adr/`.
- Baseline atualizada somente após gate PASS da fase.

## Referências

- [Constituição ativa](../memory/constitution.md)
- [Plano Mestre](../../Plano_Mestre_Inova_CRM_AI.md)
- [Quality Gate](../../.cursor/rules/quality-gate.mdc)
