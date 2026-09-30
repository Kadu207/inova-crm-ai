# Documentação — Inova CRM AI

Pacote corporativo de documentação do projeto.

## Índice

| Área         | Documento                                                                                                                                                                                                                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Visão        | [00-visao-geral.md](./00-visao-geral.md)                                                                                                                                                                                                                                                   |
| Harness      | [harness.md](./harness.md) · [`agents.md`](./agents.md) · [`../memory.md`](../memory.md)                                                                                                                                                                                                   |
| Roadmap      | [roadmap.md](./roadmap.md)                                                                                                                                                                                                                                                                 |
| Histórico    | [historico-versoes.md](./historico-versoes.md)                                                                                                                                                                                                                                             |
| Design       | [design/tokens.md](./design/tokens.md) · [design/brand-assets.md](./design/brand-assets.md)                                                                                                                                                                                                |
| Operações    | [quality-gate.md](./operations/quality-gate.md) · [vps-ssh.md](./operations/vps-ssh.md) · [swarm-vxlan-chatwoot-fix.md](./operations/swarm-vxlan-chatwoot-fix.md) · [vps-chatwoot-instances.md](./operations/vps-chatwoot-instances.md)                                                    |
| Specs pós    | [architecture/spec-030-rbac-navigation.md](./architecture/spec-030-rbac-navigation.md) · [architecture/spec-031-fts-idempotency-retry.md](./architecture/spec-031-fts-idempotency-retry.md) · [architecture/spec-028-commercial-reports.md](./architecture/spec-028-commercial-reports.md) |
| Agentes IA   | [agentes-ia.md](./agentes-ia.md)                                                                                                                                                                                                                                                           |
| Segurança    | [seguranca-lgpd.md](./seguranca-lgpd.md) · [security/coderabbit.md](./security/coderabbit.md)                                                                                                                                                                                              |
| Constituição | [../.specify/memory/constitution.md](../.specify/memory/constitution.md)                                                                                                                                                                                                                   |
| Plano Mestre | [../Plano_Mestre_Inova_CRM_AI.md](../Plano_Mestre_Inova_CRM_AI.md)                                                                                                                                                                                                                         |
| Baseline     | [../.specify/memory/baseline.md](../.specify/memory/baseline.md)                                                                                                                                                                                                                           |

## Estrutura

```
docs/
  architecture/   # visão técnica, diagramas, ADRs
  operations/     # deploy, gate, runbooks
  api/            # contratos OpenAPI (fase 4+)
  integrations/   # Chatwoot, n8n, webhooks (fase 2+)
```

Mantenha esta árvore alinhada ao código — o Quality Gate verifica o esqueleto mínimo.
