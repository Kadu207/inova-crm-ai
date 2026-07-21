# Documentação — Inova CRM AI

Pacote corporativo de documentação do projeto.

## Índice

| Área         | Documento                                                                                     |
| ------------ | --------------------------------------------------------------------------------------------- |
| Arquitetura  | [overview.md](./architecture/overview.md)                                                     |
| Operações    | [quality-gate.md](./operations/quality-gate.md)                                               |
| Segurança    | [seguranca-lgpd.md](./seguranca-lgpd.md) · [security/coderabbit.md](./security/coderabbit.md) |
| Constituição | [../.specify/memory/constitution.md](../.specify/memory/constitution.md)                      |
| Plano Mestre | [../Plano_Mestre_Inova_CRM_AI.md](../Plano_Mestre_Inova_CRM_AI.md)                            |

## Estrutura

```
docs/
  architecture/   # visão técnica, diagramas, ADRs
  operations/     # deploy, gate, runbooks
  api/            # contratos OpenAPI (fase 4+)
  integrations/   # Chatwoot, n8n, webhooks (fase 2+)
```

Mantenha esta árvore alinhada ao código — o Quality Gate verifica o esqueleto mínimo.
