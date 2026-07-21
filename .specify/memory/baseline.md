# Baseline — Inova CRM AI

**Última atualização:** 2026-07-21  
**Quality Gate:** ver `npm run gate` (lefthook pre-push)

## Estado por fase

| Fase     | Escopo                           | Status              |
| -------- | -------------------------------- | ------------------- |
| 0–7 + QA | Fundação até SaaS packing        | DONE                |
| Delivery | VPS Tunnel CRM/API/Chatwoot/n8n  | DONE (ops contínuo) |
| 013      | CodeRabbit + Security P0         | DONE                |
| 014      | Create produtos/serviços/tarefas | DONE                |

## Operacional

- **UI Ember:** create/detail leads, empresas, contatos, produtos, serviços, tarefas; Funil DnD; Dashboard timeline.
- **Security P0:** Helmet, Throttler, Swagger gate, CSP, gitleaks, CodeRabbit (exclui `.cursor/**`).
- **WhatsApp:** Evolution ativo; Meta **BLOCKED** (sem WABA).

## Próximo passo

1. Validar CodeRabbit em um PR (App já instalado pelo owner)
2. **Spec 015:** edit/patch nas entidades com detalhe
3. Meta Cloud API — BLOCKED até WABA
