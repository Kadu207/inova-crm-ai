# CodeRabbit — Inova CRM AI

Configuração versionada: [`.coderabbit.yaml`](../../.coderabbit.yaml) na raiz do repositório.

## Instalação (obrigatória — ação humana)

1. Abra [CodeRabbit GitHub App](https://github.com/apps/coderabbitai).
2. Instale/autorize para o usuário/org **Kadu207** e o repositório **inova-crm-ai**.
3. Confirme em _Settings → Integrations_ do repo que o App está ativo.
4. Abra um PR de teste e aguarde o review automático (ou comente `@coderabbitai review`).

Sem o App instalado, o YAML **não** gera comentários.

## Comandos úteis em PRs

| Comando                       | Efeito                     |
| ----------------------------- | -------------------------- |
| `@coderabbitai review`        | Dispara / reexecuta review |
| `@coderabbitai summary`       | Summary na descrição       |
| `@coderabbitai configuration` | Mostra config resolvida    |

## Path instructions (resumo)

- **backend/** — tenantId/RLS, DTOs, sem stack em prod
- **frontend/** — sem secrets no client; Ember Studio
- **n8n/** — orquestrador only (ADR 003)
- **infrastructure/** — portas 9400–9419; DB/Redis internos
- **ai-services/** — API/toolbelt only + guardrails

## Relação com Quality Gate

CodeRabbit **complementa** `npm run gate` — não o substitui. Gate FAIL continua hard-stop.
